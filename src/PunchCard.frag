#define PC_MAX_INSTRUCTIONS 100
#define PC_MAX_MATRIX_IN 10
#define PC_MAX_TEXTURES_IN 4
#define PC_MATRIX_REGISTER_COUNT 2

#ifdef GL_ES
precision mediump float;
#endif

struct PCInput {
    mat4 argm[PC_MAX_MATRIX_IN];
    sampler2D argt[PC_MAX_TEXTURES_IN];
};
uniform PCInput pc_input;

struct PCStorage {
    mat4 r[PC_MATRIX_REGISTER_COUNT];
    int pos;
    int card_width;
    int card_height;
} pc_storage;

float pc_Pixel2float(vec4 pixel) {
    float rByte = pixel.r * 255.0;
    float gByte = pixel.g * 255.0;
    float bByte = pixel.b * 255.0;
    float aByte = pixel.a * 255.0;
    float s = -step(127.0, aByte);
    float eLastBit = step(127.0, bByte);
    float e = float(int(aByte + s * 128.0)) * 2.0 + eLastBit;
    float m = float(int(bByte - eLastBit * 128.0)) * 65536.0 + gByte * 256.0 + rByte;
    float f = (s * 2.0 + 1.0) * (1.0 + m / 8388608.0) * pow(2.0, e - 127.0);
    return f;
}

float pc_GetCardFloat(sampler2D code) {
    int y = pc_storage.pos / pc_storage.card_width;
    int x = pc_storage.pos - y * pc_storage.card_width;
    vec2 uv = vec2(float(x) / float(pc_storage.card_width), float(y) / float(pc_storage.card_height));
    vec4 pixel = texture2D(code, uv);
    pc_storage.pos++;
    return pc_Pixel2float(pixel);
}

vec4 pc_GetCardVector(sampler2D code) {
    vec4 v;
    v.x = pc_GetCardFloat(code);
    v.y = pc_GetCardFloat(code);
    v.z = pc_GetCardFloat(code);
    v.w = pc_GetCardFloat(code);
    return v;
}

mat4 pc_GetCardMatrix(sampler2D code) {
    mat4 m;
    m[0] = pc_GetCardVector(code);
    m[1] = pc_GetCardVector(code);
    m[2] = pc_GetCardVector(code);
    m[3] = pc_GetCardVector(code);
    return m;
}

struct PCStoragePos {
    // -1 memory 0 float 1 vec3 2 mat4
    int type;
    int indexMat;
    int indexVec;
    int indexFloat;
};

PCStoragePos pc_GetCardStoragePos(sampler2D code) {
    float Operand = pc_GetCardFloat(code);
    PCStoragePos sp;
    sp.type = int(step(100.0, Operand) + step(10.0, Operand));
    int index = int(Operand - pow(10.0, float(sp.type)));
    if(sp.type == 2) {
        sp.indexMat = index / 16;
        sp.indexVec = (index - sp.indexMat * 16) / 4;
        sp.indexFloat = index - sp.indexMat * 16 - sp.indexVec * 4;
    } else if(sp.type == 1) {
        sp.indexMat = index / 4;
        sp.indexVec = index - sp.indexMat * 4;
    } else if(sp.type == 0) {
        sp.indexMat = index;
    }
    return sp;
}

mat4 pc_GetMatrixFromStorage(PCStoragePos sp) {
    mat4 m;
    for(int i = 0; i < PC_MATRIX_REGISTER_COUNT; i++) {
        if(sp.indexMat == i) {
            m = pc_storage.r[i];
        }
    }
    return m;
}

vec4 pc_GetVectorFromStorage(PCStoragePos sp) {
    vec4 v;
    for(int i = 0; i < PC_MATRIX_REGISTER_COUNT; i++) {
        if(sp.indexMat == i) {
            for(int j = 0; j < 4; j++) {
                if(sp.indexVec == j) {
                    v = pc_storage.r[i][j];
                }
            }
        }
    }
    return v;
}

float pc_GetFloatFromStorage(PCStoragePos sp) {
    float f;
    for(int i = 0; i < PC_MATRIX_REGISTER_COUNT; i++) {
        if(sp.indexMat == i) {
            for(int j = 0; j < 4; j++) {
                if(sp.indexVec == j) {
                    for(int k = 0; k < 4; k++) {
                        if(sp.indexFloat == k) {
                            f = pc_storage.r[i][j][k];
                        }
                    }
                }
            }
        }
    }
    return f;
}

void pc_SetMatrixToStorage(PCStoragePos sp, mat4 m) {
    for(int i = 0; i < PC_MATRIX_REGISTER_COUNT; i++) {
        if(sp.indexMat == i) {
            pc_storage.r[i] = m;
        }
    }
}

void pc_SetVectorToStorage(PCStoragePos sp, vec4 v) {
    for(int i = 0; i < PC_MATRIX_REGISTER_COUNT; i++) {
        if(sp.indexMat == i) {
            for(int j = 0; j < 4; j++) {
                if(sp.indexVec == j) {
                    pc_storage.r[i][j] = v;
                }
            }
        }
    }
}

void pc_SetFloatToStorage(PCStoragePos sp, float f) {
    for(int i = 0; i < PC_MATRIX_REGISTER_COUNT; i++) {
        if(sp.indexMat == i) {
            for(int j = 0; j < 4; j++) {
                if(sp.indexVec == j) {
                    for(int k = 0; k < 4; k++) {
                        if(sp.indexFloat == k) {
                            pc_storage.r[i][j][k] = f;
                        }
                    }
                }
            }
        }
    }
}

void pc_Mov(sampler2D code, float op) {
    PCStoragePos sp = pc_GetCardStoragePos(code);
    if(op < 0.0) {
        if(sp.type == 0) {
            pc_SetMatrixToStorage(sp, pc_GetCardMatrix(code));
        } else if(sp.type == 1) {
            pc_SetVectorToStorage(sp, pc_GetCardVector(code));
        } else if(sp.type == 2) {
            pc_SetFloatToStorage(sp, pc_GetCardFloat(code));
        }
    } else {
        PCStoragePos sp2 = pc_GetCardStoragePos(code);
        if(sp.type == 0) {
            pc_SetMatrixToStorage(sp, pc_GetMatrixFromStorage(sp2));
        } else if(sp.type == 1) {
            pc_SetVectorToStorage(sp, pc_GetVectorFromStorage(sp2));
        } else if(sp.type == 2) {
            pc_SetFloatToStorage(sp, pc_GetFloatFromStorage(sp2));
        }
    }
}

void pc_In(sampler2D code) {
    int offset = int(pc_GetCardFloat(code));
    for(int i = 0; i < PC_MAX_MATRIX_IN; i++) {
        if(i == offset) {
            pc_storage.r[0] = pc_input.argm[i];
        }
    }
}

void pc_Add() {
    pc_storage.r[0] += pc_storage.r[1];
}

void pc_Sub() {
    pc_storage.r[0] -= pc_storage.r[1];
}

void pc_Mul() {
    pc_storage.r[0] *= pc_storage.r[1];
}

void pc_Div() {
    pc_storage.r[0] /= pc_storage.r[1];
}

void pc_Dot() {
    pc_storage.r[0][1][1] = dot(pc_storage.r[0][0], pc_storage.r[1][0]);
}

void pc_Crs() {
    pc_storage.r[0][1].xyz = cross(pc_storage.r[0][0].xyz, pc_storage.r[1][0].xyz);
}

void pc_Nor() {
    pc_storage.r[0][0] = normalize(pc_storage.r[0][0]);
}

void pc_Sin() {
    pc_storage.r[0][0][0] = sin(pc_storage.r[0][0][0]);
}

void pc_Cos() {
    pc_storage.r[0][0][0] = cos(pc_storage.r[0][0][0]);
}

void pc_Sqrt() {
    pc_storage.r[0][0] = sqrt(pc_storage.r[0][0]);
}

void pc_Abs() {
    pc_storage.r[0][0] = abs(pc_storage.r[0][0]);
}

void pc_Exp() {
    pc_storage.r[0][0] = exp(pc_storage.r[0][0]);
}

void pc_Pow() {
    pc_storage.r[0][0] = pow(pc_storage.r[0][0], pc_storage.r[1][0]);
}

void pc_Transpose() {
    pc_storage.r[0] = mat4(pc_storage.r[0][0][0], pc_storage.r[0][1][0], pc_storage.r[0][2][0], pc_storage.r[0][3][0], pc_storage.r[0][0][1], pc_storage.r[0][1][1], pc_storage.r[0][2][1], pc_storage.r[0][3][1], pc_storage.r[0][0][2], pc_storage.r[0][1][2], pc_storage.r[0][2][2], pc_storage.r[0][3][2], pc_storage.r[0][0][3], pc_storage.r[0][1][3], pc_storage.r[0][2][3], pc_storage.r[0][3][3]);
}

void pc_Inverse() {
    mat4 m = pc_storage.r[0];
    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3], a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3], a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3], a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    pc_storage.r[0] = mat4(a11 * b11 - a12 * b10 + a13 * b09, a02 * b10 - a01 * b11 - a03 * b09, a31 * b05 - a32 * b04 + a33 * b03, a22 * b04 - a21 * b05 - a23 * b03, a12 * b08 - a10 * b11 - a13 * b07, a00 * b11 - a02 * b08 + a03 * b07, a32 * b02 - a30 * b05 - a33 * b01, a20 * b05 - a22 * b02 + a23 * b01, a10 * b10 - a11 * b08 + a13 * b06, a01 * b08 - a00 * b10 - a03 * b06, a30 * b04 - a31 * b02 + a33 * b00, a21 * b02 - a20 * b04 - a23 * b00, a11 * b07 - a10 * b09 - a12 * b06, a00 * b09 - a01 * b07 + a02 * b06, a31 * b01 - a30 * b03 - a32 * b00, a20 * b03 - a21 * b01 + a22 * b00) / det;
}

void pc_init(sampler2D code) {
    pc_storage.pos = 0;
    pc_storage.card_width = 100;
    pc_storage.card_height = 100;
    pc_storage.card_width = int(pc_GetCardFloat(code));
    pc_storage.card_height = int(pc_GetCardFloat(code));
}

void pc_loop(sampler2D code) {
    bool isDisCard = false;
    for(int i = 0; i < PC_MAX_INSTRUCTIONS; i++) {
        float opcode = pc_GetCardFloat(code);
        if(abs(opcode) == 1.0) {
            pc_Mov(code, opcode);
            continue;
        }
        if(opcode == 2.0) {
            pc_In(code);
            continue;
        }
        if(opcode == 3.0) {
            pc_Add();
            continue;
        }
        if(opcode == 4.0) {
            pc_Sub();
            continue;
        }
        if(opcode == 5.0) {
            pc_Mul();
            continue;
        }
        if(opcode == 6.0) {
            pc_Div();
            continue;
        }
        if(opcode == 7.0) {
            pc_Dot();
            continue;
        }
        if(opcode == 8.0) {
            pc_Crs();
            continue;
        }
        if(opcode == 9.0) {
            pc_Nor();
            continue;
        }
        if(opcode == 10.0) {
            pc_Sin();
            continue;
        }
        if(opcode == 11.0) {
            pc_Cos();
            continue;
        }
        if(opcode == 12.0) {
            pc_Sqrt();
            continue;
        }
        if(opcode == 13.0) {
            pc_Abs();
            continue;
        }
        if(opcode == 14.0) {
            pc_Exp();
            continue;
        }
        if(opcode == 15.0) {
            pc_Pow();
            break;
        }
        if(opcode == 16.0) {
            pc_Transpose();
            continue;
        }
        if(opcode == 17.0) {
            pc_Inverse();
            continue;
        }
        if(opcode == 18.0) {
            isDisCard = true;
            break;
        }
        break;
    }
    if(isDisCard) {
        discard;
    }
}

void pc_run(sampler2D code) {
    pc_init(code);
    pc_loop(code);
}

uniform sampler2D pc_code;

void main() {
    pc_run(pc_code);
    gl_FragColor = vec4(pc_storage.r[0][0]);
}