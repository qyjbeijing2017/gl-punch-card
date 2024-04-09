# gl-punch-card

`gl-punch-card` 在片元着色器中创建了一个虚拟机。它会读取一张纹理（穿孔卡）作为脚本。因为**punch card**本身的特性，`gl-punch-card`语法类似汇编或者机器码。`gl-punch-card` 创立初衷是为了`ray-marching`传递`sdf(sign distance function)`信息，但是它似乎本身也可以传递其他代码信息。



`gl-punch-card` creates a virtual machine within a fragment shader. It reads a texture (punch card) as a script. Due to the inherent characteristics of the **punch card**, the syntax of `gl-punch-card` is akin to assembly or machine code. The initial purpose of `gl-punch-card` was to convey `sdf (signed distance function)` information for `ray-marching`, but it appears capable of transmitting other types of code information as well.



## All are float

在`gl-punch-card`中所有的数据都以4字节浮点数作为一个‘原子’。`gl-punch-card` 每次从穿孔卡读取一个像素的数据作为一个浮点值。

在 `gl-punch-card` 中指令也是以float表示， 参数也是如此。例如，将第一个寄存器的数值存入第二个寄存器`mov r1 r2; 1.0 0.0 2.0`



In `gl-punch-card`, all data is treated as an 'atom', represented by a 4-byte floating point number. `gl-punch-card` reads data from the punch card one pixel at a time, interpreting each pixel as a floating point value.

In `gl-punch-card`, instructions are also represented as floats, and the same applies to parameters. For example, to move the value from the first register to the second register, the instruction is `mov r1 r2; 1.0 0.0 2.0`.



## Punch Card

**穿孔卡（Punch Card）**是从uniform输入的一个特殊的纹理，它的每个像素表示一个float值。

穿孔卡是从左下角，也就是`texture2D(card,vec2(0,0))`的位置**由左到右**，**由下到上**读取的。穿孔卡的一个像素和第二个像素分别代表穿孔卡的宽度和高度，真正的数据是从第三个像素开始的。

> 注意，穿孔卡在做数据交换时不能做有损的压缩，会导致数据错误。




The **Punch Card** is a special texture input as a uniform, where each pixel represents a float value.

Punch Cards are read from the bottom left corner, meaning from the position `texture2D(card, vec2(0,0))`, **from left to right**, and **from bottom to top**. The first and second pixels of the punch card represent the width and height of the punch card, respectively, with the actual data starting from the third pixel.

> Note that the Punch Card should not undergo lossy compression when exchanging data, as this would lead to data corruption.

## Instruction

`gl-punch-card`与机器码一样通过**指令（instruction）**操作虚拟机。每一条指令跟机器码一样由**操作码(Opcode)**和多个**操作数(Operand)**组成。操作数的数量取决于操作码。

操作码和操作数都由一个或者数个float值组成。例如，将1.0送入第一个浮点寄存器的操作如下`mov rf1 1.0 ; -1.0 0.0 1.0`

**操作码(Opcode)**，一般代表内存、寄存器地址或者一个或多个字面量。寄存器地址的操作码为正数`Opcode >= 0`，而内存地址的操作码为负数`Opcode < 0`。

**立即数（Immediate）**是一种特殊的操作数，它取数据的字面量作为输入而不是作为一个寄存器地址或者内存地址。

立即数只作为最后一个操作数，如果需要将一个数作为立即数读取，需要将操作码的**第一位(bit)**置1。也就是说将操作数变为负值， 一般来讲现在只有mov拥有立即数。例如，`mov rf1 rf2 ; 1.0 0.0 1.0` 立即数 `mov rf1 1.0 ; -1.0 0.0 1.0`

以下为当前`gl-punch-card`所有的指令:

> 注意：在操作数（Operand）中必须有一个参数是寄存器位置否则无法判断参数类型



`gl-punch-card` operates the virtual machine through **instructions** just like machine code. Each instruction is composed of an **Opcode** and several **Operands**, similar to machine code. The number of operands depends on the opcode.

Both opcodes and operands are composed of one or several float values. For example, the operation to move 1.0 into the first floating-point register is as follows: `mov rf1 1.0 ; -1.0 0.0 1.0`

**Opcode** generally represents memory, register addresses, or one or more literals. Register address opcodes are positive `Opcode >= 0`, while memory address opcodes are negative `Opcode < 0`.

**Immediate** is a special type of operand that takes the literal value of the data as input, rather than as a register or memory address.

An immediate is only used as the last operand. If a number needs to be read as an immediate, the **first bit** of the opcode must be set to 1, turning the opcode into a negative value. Currently, only the mov instruction accepts an immediate. For example, `mov rf1 rf2 ; 1.0 0.0 1.0` becomes an immediate with `mov rf1 1.0 ; -1.0 0.0 1.0`

In the operand (Operand), there must be one parameter that is a register position; otherwise, it's impossible to determine the parameter type.

Here are the instructions currently available in `gl-punch-card`:

> Note: In the operands, there must be at least one parameter indicating a register position to determine the parameter type.



## Register

在`gl-punch-card`中所有的通用寄存器都能够存储一个mat4大小的数据。同时也可以像汇编语言读取word数据那样读取vector数据或者float数据。



In `gl-punch-card`, all general-purpose registers are capable of storing data up to the size of a `mat4`. Similar to assembly language, it's also possible to read data as vectors or float values, akin to reading word data.



### TypeCode Index

* Typecode，类型码，代表了寄存器的类型信息，它是一个预设值，比如mat的类型数为100，当寄存器的操作码大于这个数时则代表操作当前类型的寄存器。操作码从大到小进行匹配。
* Index，寄存器编号，代表了寄存器编号，它由操作数减去类型数得到`index = Operand - Typecode`；

> 例如：从punch-card读取到一个寄存器操作数103。首先它大于100，是一个float寄存器。它的位置为3=103-100。那么它代表的是第4个数组通用寄存器（寄存器位置从0开始）。



`gl-punch-card`包含以下几个寄存器：

* 类型码0~999：通用寄存器，用于存放数据
  * mat，类型码0；
  * vector，类型码10；
  * float，类型码100；
* 类型码1000~1010：特殊寄存器，用于部分特殊目的
  * pos，操作数1001，用于表示下一个指令的像素位置；




In `gl-punch-card`, the Typecode represents the type information of a register and is a preset value. For instance, the type number for a `mat` is 100. When the opcode of a register is greater than this number, it indicates an operation on a register of the current type, with opcodes matched from largest to smallest.

The Index, or register number, represents the register's number, which is obtained by subtracting the Typecode from the Operand: `index = Operand - Typecode`.

For example, if an operand 103 is read from the punch-card, it first exceeds 100, indicating it is a float register. Its position is 3 = 103 - 100. This means it represents the fourth array general-purpose register (register positions start from 0).

`gl-punch-card` includes the following registers:

- Typecodes 0~999: General-purpose registers, used for storing data
  - `mat`, with a Typecode of 0;
  - `vector`, with a Typecode of 10;
  - `float`, with a Typecode of 100;
- Typecodes 1000~1010: Special registers, used for specific purposes
  - `pos`, with an operand of 1001, used to indicate the pixel position of the next instruction;
