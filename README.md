# gl-punch-card

`gl-punch-card` 在片元着色器中创建了一个虚拟机。它会读取一张纹理（穿孔卡）作为脚本。因为**punch card**本身的特性，`gl-punch-card`语法类似汇编或者机器码。`gl-punch-card` 创立初衷是为了`ray-marching`传递`sdf(sign distance function)`信息，但是它似乎本身也可以传递其他代码信息。

`gl-punch-card` create a virtual machine in fragment shader. It will read a texture as **punch card** from uniform as script. Because of the characteristics of **punch card** , the `gl-punch-card` syntax is similar to assembly or machine code. `gl-punch-card ` was originally created to transmit `sdf (sign distance function)` information in **ray-matching** , but it seems that it can also transmit other code information.



## All are float

在`gl-punch-card`中所有的数据都以4字节浮点数作为一个‘原子’。`gl-punch-card` 每次从穿孔卡读取一个像素的数据作为一个浮点值。

All data in `gl-punch-card` takes a 4-byte floating point number as an 'atom'. once  `gl-punch-card` read the data of one pixel from punch card each time as a float .

在 `gl-punch-card` 中指令也是以float表示， 参数也是如此。比如`1.5+2`表示为`3.0 1.5 2`。

In `gl-punch-card`, instructions are also represented by floats, and so are parameters. For example, `1.5+2` means ` 3.0 1.5 2 `.



## Punch Card

**穿孔卡（Punch Card）**是从uniform输入的一个特殊的纹理，它的每个像素表示一个float值。

穿孔卡是从左下角，也就是`texture2D(card,vec2(0,0))`的位置**由左到右**，**由下到上**读取的。穿孔卡的一个像素和第二个像素分别代表穿孔卡的宽度和高度，真正的数据是从第三个像素开始的。

> 注意，穿孔卡在做数据交换时不能做有损的压缩，会导致数据错误。



## Instruction

`gl-punch-card`与机器码一样通过**指令（instruction）**操作虚拟机。每一条指令跟机器码一样由**操作码(Opcode)**和多个**操作数(Operand)**组成。操作数的数量取决于操作码。

操作码和操作数都由一个或者数个float值组成。例如，将1.0送入第一个浮点寄存器的操作如下`mov rf1 1.0 ; -1.0 0.0 1.0`

**操作码(Opcode)**，一般代表内存、寄存器地址或者一个或多个字面量。寄存器地址的操作码为正数`Opcode >= 0`，而内存地址的操作码为负数`Opcode < 0`。

**立即数（Immediate）**是一种特殊的操作数，它取数据的字面量作为输入而不是作为一个寄存器地址或者内存地址。

立即数只作为最后一个操作数，如果需要将一个数作为立即数读取，需要将操作码的**第一位(bit)**置1。也就是说将操作数变为负值。例如，`mov rf1 rf2 ; 1.0 0.0 1.0` 立即数 `mov rf1 1.0 ; -1.0 0.0 1.0`

以下为当前`gl-punch-card`所有的指令:

| Opcode | Assembled | Operand1       | Operand2             | Description                                                  |
| ------ | --------- | -------------- | -------------------- | ------------------------------------------------------------ |
| 0      | exit      |                |                      | exit the program                                             |
| 1      | mov       | 寄存位置       | 寄存器位置或者立即数 | Operand1 = Operand2                                          |
| 2      | in        | 输入参数offset |                      | input[Operand1]->register[0]                                 |
| 3      | add       |                |                      | register[0] = register[0]-register[1]                        |
| 4      | sub       |                |                      | register[0] = register[0]-register[1]                        |
| 5      | mulMM     |                |                      | register[0] = register[0]*register[1]                        |
| 6      | mulMV     |                |                      | register\[0][0] = register[0] * register\[1][0]              |
| 7      | mulVM     |                |                      | register\[0][0] = register\[0][0] * register[1]              |
| 8      | mulVV     |                |                      | register\[0][0] = register\[0][0] * register\[1][0]          |
| 9      | mulMF     |                |                      | register\[0] = register\[0] * register\[1]\[0][0]            |
| 10     | mulVF     |                |                      | register\[0][0] =  register\[0][0] * register\[1]\[0][0]     |
| 11     | mulFF     |                |                      | register\[0]\[0][0] = register\[0]\[0][0] * register\[0]\[0][1] |
| 12     | div       |                |                      | register[0] = register[0] / register[1]                      |
| 13     | dot       |                |                      | register\[0]\[0][0] = dot(register\[0][0], register\[0][1])  |
| 14     | crs       |                |                      | register\[0][0] = vec4(cross(vec3(register\[0][0]), vec3(register\[0][1])), 0.0) |
| 15     | nor       |                |                      | register\[0][0] = normalize(register\[0][0])                 |
| 16     | sin       |                |                      | register\[0]\[0][0] = sin(register\[0]\[0][0])               |
| 17     | cos       |                |                      | register\[0]\[0][0] = cos(register\[0]\[0][0])               |
| 18     | sqrt      |                |                      | register\[0]\[0][0] = sqrt(register\[0]\[0][0])              |

> 注意：在操作数（Operand）中必须有一个参数是寄存器位置否则无法判断参数类型

## Register

在`gl-punch-card`中所有的通用寄存器都能够存储一个mat4大小的数据。同时也可以像汇编语言读取word数据那样读取vector数据或者float数据。



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



