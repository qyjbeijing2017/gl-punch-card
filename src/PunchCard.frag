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


uniform sampler2D pc_code;

void run(sampler2D code) {

}

void main() {
    gl_FragColor = vec4(0.18, 0.45, 0.96, 1.0);
}