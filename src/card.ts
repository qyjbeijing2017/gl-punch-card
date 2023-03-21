import { Buffer } from 'buffer'

export enum TypeCode {
    float = 100,
    vector = 10,
    matrix = 0,
}

export enum OpCode {
    movConst = -1,          // op1: address    op2: value       r[op1] = op2
    exit = 0,               //                                  exit
    mov = 1,                // op1: address1   op2: address2    r[op1] = r[op2]
    pcIn = 2,               // op1: offset                      r[0] = pcIn[op1]
    add = 3,                //                                  r[0] = r[0] + r[1]
    sub = 4,                //                                  r[0] = r[0] - r[1]
    mul = 5,                //                                  r[0] = r[0] * r[1]
    div = 6,                //                                  r[0] = r[0] / r[1]
    dot = 7,                //                                  dot(r[0][0], r[1][0]) -> r[0][0]
    cross = 8,              //                                  cross(r[0][0].xyz, r[1][0].xyz) -> r[0][0].xyz
    normalize = 9,          //                                  normalize(r[0][0]) -> r[0][0]
    sin = 10,               //                                  sin(r[0]) -> r[0]
    cos = 11,               //                                  cos(r[0]) -> r[0]
    sqrt = 12,              //                                  sqrt(r[0][0]) -> r[0][0]
    abs = 13,               //                                  abs(r[0][0]) -> r[0][0]
    exp = 14,               //                                  exp(r[0][0]) -> r[0][0]
    pow = 15,               //                                  pow(r[0][0], r[1][0]) -> r[0][0]
    transpose = 16,         //                                  transpose(r[0]) -> r[0]
    inverse = 17,           //                                  inverse(r[0]) -> r[0]
    discard = 18,           //                                  discard
}

export class Card {
    m_buffer: Buffer;
    m_width: number;
    m_height: number;
    m_index: number;

    get buffer() { return this.m_buffer; }
    get width() { return this.m_width; }
    get height() { return this.m_height; }
    get index() { return this.m_index; }

    private set index(index: number) {
        if (index >= this.m_buffer.length) {
            throw new Error('index out of range');
        }
        this.m_index = index;
    }

    constructor(width: number = 64, height: number = 64) {
        if (width < 2 || height < 2) {
            throw new Error('width and height must be greater than 1');
        }
        this.m_width = width;
        this.m_height = height;
        this.m_buffer = Buffer.alloc(width * height * 4);
        this.m_buffer.writeFloatLE(width, 0);
        this.m_buffer.writeFloatLE(height, 4);
        this.m_index = 8;
    }

    static address(type: TypeCode, index: number) {
        return type + index;
    }

    movConst = (address: number, val: [number] | [number, number, number, number] | [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]) => {
        this.m_buffer.writeFloatLE(OpCode.movConst, this.index);       // mov
        this.index += 4;
        this.m_buffer.writeFloatLE(address, this.index);
        this.index += 4;
        for (let i = 0; i < val.length; i++) {
            this.m_buffer.writeFloatLE(val[i], this.index);
            this.index += 4;
        }
    }

    exit = () => {
        this.m_buffer.writeFloatLE(OpCode.exit, this.index);       // mov
        this.index += 4;
    }

    mov = (address1: number, address2: number) => {
        this.m_buffer.writeFloatLE(OpCode.mov, this.index);       // mov
        this.index += 4;
        this.m_buffer.writeFloatLE(address1, this.index);
        this.index += 4;
        this.m_buffer.writeFloatLE(address2, this.index);
        this.index += 4;
    }

    pcIn = (offset: number) => {
        this.m_buffer.writeFloatLE(OpCode.pcIn, this.index);       // pcIn
        this.index += 4;
        this.m_buffer.writeFloatLE(offset, this.index);
        this.index += 4;
    }

    add = () => {
        this.m_buffer.writeFloatLE(OpCode.add, this.index);       // add
        this.index += 4;
    }

    sub = () => {
        this.m_buffer.writeFloatLE(OpCode.sub, this.index);       // sub
        this.index += 4;
    }

    mul = () => {
        this.m_buffer.writeFloatLE(OpCode.mul, this.index);       // mul
        this.index += 4;
    }

    div = () => {
        this.m_buffer.writeFloatLE(OpCode.div, this.index);       // div
        this.index += 4;
    }

    dot = () => {
        this.m_buffer.writeFloatLE(OpCode.dot, this.index);       // dot
        this.index += 4;
    }

    cross = () => {
        this.m_buffer.writeFloatLE(OpCode.cross, this.index);       // cross
        this.index += 4;
    }

    normalize = () => {
        this.m_buffer.writeFloatLE(OpCode.normalize, this.index);       // normalize
        this.index += 4;
    }

    sin = () => {
        this.m_buffer.writeFloatLE(OpCode.sin, this.index);       // sin
        this.index += 4;
    }

    cos = () => {
        this.m_buffer.writeFloatLE(OpCode.cos, this.index);       // cos
        this.index += 4;
    }

    sqrt = () => {
        this.m_buffer.writeFloatLE(OpCode.sqrt, this.index);       // sqrt
        this.index += 4;
    }

    abs = () => {
        this.m_buffer.writeFloatLE(OpCode.abs, this.index);       // abs
        this.index += 4;
    }

    exp = () => {
        this.m_buffer.writeFloatLE(OpCode.exp, this.index);       // exp
        this.index += 4;
    }

    pow = () => {
        this.m_buffer.writeFloatLE(OpCode.pow, this.index);       // pow
        this.index += 4;
    }

    transpose = () => {
        this.m_buffer.writeFloatLE(OpCode.transpose, this.index);       // transpose
        this.index += 4;
    }

    inverse = () => {
        this.m_buffer.writeFloatLE(OpCode.inverse, this.index);       // inverse
        this.index += 4;
    }

    discard = () => {
        this.m_buffer.writeFloatLE(OpCode.discard, this.index);       // discard
        this.index += 4;
    }
}