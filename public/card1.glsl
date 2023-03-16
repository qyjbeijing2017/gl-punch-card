
        #define PC_MAX_INSTRUCTIONS 1000
        #define PC_MAX_IN 10
        #define PC_MAX_TEXTURES 2
        #define PC_MAX_OUT 10
        #define PC_MAX_MEMORY 100
        #define PC_MAX_MATRIX_REGISTERS 2

        #ifdef GL_ES
        precision mediump float;
        #endif

        
        struct PCInput{
            float argf[PC_MAX_IN];
            sampler2D argt[PC_MAX_TEXTURES];
        };
        uniform PCInput pc_input;

        struct PCOutput{
            float data[PC_MAX_OUT];
        } pc_output;

        struct PCStorage{
            float   memory[PC_MAX_MEMORY];
            mat4    r[PC_MAX_MATRIX_REGISTERS];           // 0
            int   pos;                                  // 1000
            int   esp;                                  // 1001
            int   card_width;
            int   card_height;
        } pc_storage;

        float pc_Pixel2float(vec4 pixel) {
            float rByte = pixel.r * 255.0;
            float gByte = pixel.g * 255.0;
            float bByte = pixel.b * 255.0;
            float aByte = pixel.a * 255.0;

            float s = -step(127.0, aByte);
            float eLastBit = step(127.0, bByte);
            float e = (aByte + s * 128.0) * 2.0 + eLastBit;
            float m = (bByte - eLastBit * 128.0) * 65536.0 + gByte * 256.0 + rByte;
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

        struct PCStoragePos{
            // -1 memory 0 float 1 vec3 2 mat4
            float type;
            int indexMat;
            int indexVec;
            int indexFloat;
            int indexMemory;
        };

        PCStoragePos pc_GetCardStoragePos(sampler2D code) {
            float Operand = pc_GetCardFloat(code);
            PCStoragePos sp;
            sp.type = (step(0.0, Operand) * 2.0 - 1.0) * (step(10.0, Operand) + step(100.0, Operand));
            int index = int(Operand - step(10.0, Operand) * 10.0 - step(100.0, Operand) * 100.0);
            sp.indexMat = index / 16;
            sp.indexVec = (index - sp.indexMat * 16) / 4;
            sp.indexFloat = index - sp.indexMat * 16 - sp.indexVec * 4;
            sp.indexMemory = int(-Operand);
            return sp;
        }

        mat4 pc_GetMatrix(PCStoragePos sp) {
            if(sp.type < 0.0) {
                mat4 m;
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == sp.indexMemory) {
                        m[0][0] = pc_storage.memory[i];
                        m[0][1] = pc_storage.memory[i + 1];
                        m[0][2] = pc_storage.memory[i + 2];
                        m[0][3] = pc_storage.memory[i + 3];
                        m[1][0] = pc_storage.memory[i + 4];
                        m[1][1] = pc_storage.memory[i + 5];
                        m[1][2] = pc_storage.memory[i + 6];
                        m[1][3] = pc_storage.memory[i + 7];
                        m[2][0] = pc_storage.memory[i + 8];
                        m[2][1] = pc_storage.memory[i + 9];
                        m[2][2] = pc_storage.memory[i + 10];
                        m[2][3] = pc_storage.memory[i + 11];
                        m[3][0] = pc_storage.memory[i + 12];
                        m[3][1] = pc_storage.memory[i + 13];
                        m[3][2] = pc_storage.memory[i + 14];
                        m[3][3] = pc_storage.memory[i + 15];
                        return m;
                    }
                }
            } else {
                for(int i = 0; i < PC_MAX_MATRIX_REGISTERS; i++) {
                    if(i == sp.indexMat) {
                        return pc_storage.r[i];
                    }
                }
            }
        }

        void pc_SetMatrix(PCStoragePos sp, mat4 m) {
            if(sp.type < 0.0) {
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == sp.indexMemory) {
                        pc_storage.memory[i] = m[0][0];
                        pc_storage.memory[i + 1] = m[0][1];
                        pc_storage.memory[i + 2] = m[0][2];
                        pc_storage.memory[i + 3] = m[0][3];
                        pc_storage.memory[i + 4] = m[1][0];
                        pc_storage.memory[i + 5] = m[1][1];
                        pc_storage.memory[i + 6] = m[1][2];
                        pc_storage.memory[i + 7] = m[1][3];
                        pc_storage.memory[i + 8] = m[2][0];
                        pc_storage.memory[i + 9] = m[2][1];
                        pc_storage.memory[i + 10] = m[2][2];
                        pc_storage.memory[i + 11] = m[2][3];
                        pc_storage.memory[i + 12] = m[3][0];
                        pc_storage.memory[i + 13] = m[3][1];
                        pc_storage.memory[i + 14] = m[3][2];
                        pc_storage.memory[i + 15] = m[3][3];
                        return;
                    }
                }
            } else {
                for(int i = 0; i < PC_MAX_MATRIX_REGISTERS; i++) {
                    if(i == sp.indexMat) {
                        pc_storage.r[i] = m;
                        return;
                    }
                }
            }
        }

        vec4 pc_GetVector(PCStoragePos sp) {
            if(sp.type < 0.0) {
                vec4 v;
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == sp.indexMemory) {
                        v.x = pc_storage.memory[i];
                        v.y = pc_storage.memory[i + 1];
                        v.z = pc_storage.memory[i + 2];
                        v.w = pc_storage.memory[i + 3];
                        return v;
                    }
                }
            } else {
                for(int i = 0; i < PC_MAX_MATRIX_REGISTERS; i++) {
                    if(i == sp.indexMat) {
                        for(int j = 0; j < 4; j++) {
                            if(j == sp.indexVec) {
                                return pc_storage.r[i][j];
                            }
                        }
                    }
                }
            }
        }

        void pc_SetVector(PCStoragePos sp, vec4 v) {
            if(sp.type < 0.0) {
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == sp.indexMemory) {
                        pc_storage.memory[i] = v.x;
                        pc_storage.memory[i + 1] = v.y;
                        pc_storage.memory[i + 2] = v.z;
                        pc_storage.memory[i + 3] = v.w;
                        return;
                    }
                }
            } else {
                for(int i = 0; i < PC_MAX_MATRIX_REGISTERS; i++) {
                    if(i == sp.indexMat) {
                        for(int j = 0; j < 4; j++) {
                            if(j == sp.indexVec) {
                                pc_storage.r[i][j] = v;
                                return;
                            }
                        }
                    }
                }
            }
        }

        float pc_GetFloat(PCStoragePos sp) {
            if(sp.type < 0.0) {
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == sp.indexMemory) {
                        return pc_storage.memory[i];
                    }
                }
            } else {
                for(int i = 0; i < PC_MAX_MATRIX_REGISTERS; i++) {
                    if(i == sp.indexMat) {
                        for(int j = 0; j < 4; j++) {
                            if(j == sp.indexVec) {
                                for(int k = 0; k < 4; k++) {
                                    if(k == sp.indexFloat) {
                                        return pc_storage.r[i][j][k];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        void pc_SetFloat(PCStoragePos sp, float f) {
            if(sp.type < 0.0) {
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == sp.indexMemory) {
                        pc_storage.memory[i] = f;
                        return;
                    }
                }
            } else {
                for(int i = 0; i < PC_MAX_MATRIX_REGISTERS; i++) {
                    if(i == sp.indexMat) {
                        for(int j = 0; j < 4; j++) {
                            if(j == sp.indexVec) {
                                for(int k = 0; k < 4; k++) {
                                    if(k == sp.indexFloat) {
                                        pc_storage.r[i][j][k] = f;
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        void pc_mov(sampler2D code, float op) {
            PCStoragePos desPos = pc_GetCardStoragePos(code);
            if(op > 0.0) {
                PCStoragePos srcPos = pc_GetCardStoragePos(code);
                float type = desPos.type > 0.0 ? desPos.type : srcPos.type;
                if(type == 0.0) {
                    pc_SetMatrix(desPos, pc_GetMatrix(srcPos));
                } else if(type == 1.0) {
                    pc_SetVector(desPos, pc_GetVector(srcPos));
                } else if(type == 2.0) {
                    pc_SetFloat(desPos, pc_GetFloat(srcPos));
                }
            } else {
                float type = desPos.type;
                if(type == 0.0) {
                    pc_SetMatrix(desPos, pc_GetCardMatrix(code));
                } else if(type == 1.0) {
                    pc_SetVector(desPos, pc_GetCardVector(code));
                } else if(type == 2.0) {
                    pc_SetFloat(desPos, pc_GetCardFloat(code));
                }
            }
        }

        void pc_push(sampler2D code) {
            PCStoragePos srcPos = pc_GetCardStoragePos(code);
            if(srcPos.type == 0.0) {
                mat4 m = pc_GetMatrix(srcPos);
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == pc_storage.esp) {
                        pc_storage.memory[i] = m[0][0];
                        pc_storage.memory[i - 1] = m[0][1];
                        pc_storage.memory[i - 2] = m[0][2];
                        pc_storage.memory[i - 3] = m[0][3];
                        pc_storage.memory[i - 4] = m[1][0];
                        pc_storage.memory[i - 5] = m[1][1];
                        pc_storage.memory[i - 6] = m[1][2];
                        pc_storage.memory[i - 7] = m[1][3];
                        pc_storage.memory[i - 8] = m[2][0];
                        pc_storage.memory[i - 9] = m[2][1];
                        pc_storage.memory[i - 10] = m[2][2];
                        pc_storage.memory[i - 11] = m[2][3];
                        pc_storage.memory[i - 12] = m[3][0];
                        pc_storage.memory[i - 13] = m[3][1];
                        pc_storage.memory[i - 14] = m[3][2];
                        pc_storage.memory[i - 15] = m[3][3];
                        pc_storage.esp -= 16;
                        return;
                    }
                }
            } else if(srcPos.type == 1.0) {
                vec4 v = pc_GetVector(srcPos);
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == pc_storage.esp) {
                        pc_storage.memory[i] = v.x;
                        pc_storage.memory[i - 1] = v.y;
                        pc_storage.memory[i - 2] = v.z;
                        pc_storage.memory[i - 3] = v.w;
                        pc_storage.esp -= 4;
                        return;
                    }
                }
            } else if(srcPos.type == 2.0) {
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == pc_storage.esp) {
                        pc_storage.memory[i] = pc_GetFloat(srcPos);
                        pc_storage.esp -= 1;
                        return;
                    }
                }
            }
        }

        void pc_pop(sampler2D code) {
            PCStoragePos desPos = pc_GetCardStoragePos(code);
            if(desPos.type == 0.0) {
                mat4 m;
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == pc_storage.esp) {
                        m[0][0] = pc_storage.memory[i];
                        m[0][1] = pc_storage.memory[i + 1];
                        m[0][2] = pc_storage.memory[i + 2];
                        m[0][3] = pc_storage.memory[i + 3];
                        m[1][0] = pc_storage.memory[i + 4];
                        m[1][1] = pc_storage.memory[i + 5];
                        m[1][2] = pc_storage.memory[i + 6];
                        m[1][3] = pc_storage.memory[i + 7];
                        m[2][0] = pc_storage.memory[i + 8];
                        m[2][1] = pc_storage.memory[i + 9];
                        m[2][2] = pc_storage.memory[i + 10];
                        m[2][3] = pc_storage.memory[i + 11];
                        m[3][0] = pc_storage.memory[i + 12];
                        m[3][1] = pc_storage.memory[i + 13];
                        m[3][2] = pc_storage.memory[i + 14];
                        m[3][3] = pc_storage.memory[i + 15];
                        pc_SetMatrix(desPos, m);
                        pc_storage.esp += 16;
                        return;
                    }
                }
            } else if(desPos.type == 1.0) {
                vec4 v;
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == pc_storage.esp) {
                        v.x = pc_storage.memory[i];
                        v.y = pc_storage.memory[i + 1];
                        v.z = pc_storage.memory[i + 2];
                        v.w = pc_storage.memory[i + 3];
                        pc_SetVector(desPos, v);
                        pc_storage.esp += 4;
                        return;
                    }
                }
            } else if(desPos.type == 2.0) {
                for(int i = 0; i < PC_MAX_MEMORY; i++) {
                    if(i == pc_storage.esp) {
                        pc_SetFloat(desPos, pc_storage.memory[i]);
                        pc_storage.esp += 1;
                        return;
                    }
                }
            }
        }

        void pc_in(sampler2D code, float op) {
            PCStoragePos desPos = pc_GetCardStoragePos(code);
            int offset = op < 0.0 ? int(pc_GetCardFloat(code)) : int(pc_GetFloat(pc_GetCardStoragePos(code)));
            if(desPos.type == 0.0) {
                mat4 m;
                for(int i = 0; i < PC_MAX_IN; i++) {
                    if(i == offset) {
                        m[0][0] = pc_input.argf[i];
                        m[0][1] = pc_input.argf[i + 1];
                        m[0][2] = pc_input.argf[i + 2];
                        m[0][3] = pc_input.argf[i + 3];
                        m[1][0] = pc_input.argf[i + 4];
                        m[1][1] = pc_input.argf[i + 5];
                        m[1][2] = pc_input.argf[i + 6];
                        m[1][3] = pc_input.argf[i + 7];
                        m[2][0] = pc_input.argf[i + 8];
                        m[2][1] = pc_input.argf[i + 9];
                        m[2][2] = pc_input.argf[i + 10];
                        m[2][3] = pc_input.argf[i + 11];
                        m[3][0] = pc_input.argf[i + 12];
                        m[3][1] = pc_input.argf[i + 13];
                        m[3][2] = pc_input.argf[i + 14];
                        m[3][3] = pc_input.argf[i + 15];
                        pc_SetMatrix(desPos, m);
                        return;
                    }
                }
            } else if(desPos.type == 1.0) {
                vec4 v;
                for(int i = 0; i < PC_MAX_IN; i++) {
                    if(i == offset) {
                        v.x = pc_input.argf[i];
                        v.y = pc_input.argf[i + 1];
                        v.z = pc_input.argf[i + 2];
                        v.w = pc_input.argf[i + 3];
                        return;
                    }
                }
                pc_SetVector(desPos, v);
            } else if(desPos.type == 2.0) {
                for(int i = 0; i < PC_MAX_IN; i++) {
                    if(i == offset) {
                        pc_SetFloat(desPos, pc_input.argf[i]);
                    }
                }
            }
        }

        void pc_out(sampler2D code, float op) {
            PCStoragePos desPos = pc_GetCardStoragePos(code);
            int offset = op < 0.0 ? int(pc_GetCardFloat(code)) : int(pc_GetFloat(pc_GetCardStoragePos(code)));
            if(desPos.type == 0.0) {
                for(int i = 0; i < PC_MAX_IN; i++) {
                    if(i == offset) {
                        mat4 m = pc_GetMatrix(desPos);
                        pc_output.data[i] = m[0][0];
                        pc_output.data[i + 1] = m[0][1];
                        pc_output.data[i + 2] = m[0][2];
                        pc_output.data[i + 3] = m[0][3];
                        pc_output.data[i + 4] = m[1][0];
                        pc_output.data[i + 5] = m[1][1];
                        pc_output.data[i + 6] = m[1][2];
                        pc_output.data[i + 7] = m[1][3];
                        pc_output.data[i + 8] = m[2][0];
                        pc_output.data[i + 9] = m[2][1];
                        pc_output.data[i + 10] = m[2][2];
                        pc_output.data[i + 11] = m[2][3];
                        pc_output.data[i + 12] = m[3][0];
                        pc_output.data[i + 13] = m[3][1];
                        pc_output.data[i + 14] = m[3][2];
                        pc_output.data[i + 15] = m[3][3];
                        return;
                    }
                }
            } else if(desPos.type == 1.0) {
                vec4 v = pc_GetVector(desPos);
                for(int i = 0; i < PC_MAX_IN; i++) {
                    if(i == offset) {
                        pc_output.data[i] = v.x;
                        pc_output.data[i + 1] = v.y;
                        pc_output.data[i + 2] = v.z;
                        pc_output.data[i + 3] = v.w;
                        return;
                    }
                }
            } else if(desPos.type == 2.0) {
                for(int i = 0; i < PC_MAX_IN; i++) {
                    if(i == offset) {
                        pc_output.data[i] = pc_GetFloat(desPos);
                    }
                }
            }
        }

        void run(sampler2D code) {
            pc_storage.pos = 0;
            pc_storage.esp = PC_MAX_MEMORY;
            pc_storage.card_width = 100;
            pc_storage.card_height = 100;
            pc_storage.card_width = int(pc_GetCardFloat(code));
            pc_storage.card_height = int(pc_GetCardFloat(code));

            float op = pc_GetCardFloat(code);
            for(int i = 0; i < PC_MAX_INSTRUCTIONS; i++) {
                if(op == 0.0) {
                    break;
                }
                float opabs = abs(op);
                if(opabs == 1.0) {
                    pc_mov(code, op);
                } else if(opabs == 2.0) {
                    pc_push(code);
                } else if(opabs == 3.0) {
                    pc_pop(code);
                } else if(opabs == 4.0) {
                    pc_in(code, op);
                } else if(opabs == 5.0) {
                    pc_out(code, op);
                }
                op = pc_GetCardFloat(code);
            }
        }


        uniform sampler2D pc_code;
        void main() {
            run(pc_code);
            gl_FragColor = vec4(pc_output.data[0], pc_output.data[1], pc_output.data[2], pc_output.data[3]);
        }