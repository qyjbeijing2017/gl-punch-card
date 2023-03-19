#define PC_MAX_INSTRUCTIONS 100
#define PC_MAX_MATRIX_IN 2
#define PC_MAX_TEXTURES_IN 2
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
    int index = int(Operand - step(10.0, Operand) * 10.0 - step(100.0, Operand) * 100.0);
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
        if(i == offset){
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
    pc_storage.r[0][0][0] = sqrt(pc_storage.r[0][0][0]);
}

void pc_init(sampler2D code) {
    pc_storage.pos = 0;
    pc_storage.card_width = 100;
    pc_storage.card_height = 100;
    pc_storage.card_width = int(pc_GetCardFloat(code));
    pc_storage.card_height = int(pc_GetCardFloat(code));
}

void pc_loop(sampler2D code) {
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
        if(opcode == 12.0) {
            pc_Div();
            continue;
        }
        if(opcode == 13.0) {
            pc_Dot();
            continue;
        }
        if(opcode == 14.0) {
            pc_Crs();
            continue;
        }
        if(opcode == 15.0) {
            pc_Nor();
            continue;
        }
        if(opcode == 16.0) {
            pc_Sin();
            continue;
        }
        if(opcode == 17.0) {
            pc_Cos();
            continue;
        }
        if(opcode == 18.0) {
            pc_Sqrt();
            continue;
        }
        break;
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