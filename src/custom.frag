#ifdef GL_ES
precision mediump float;
#endif
#define PC_TEXTURE0 cardTexture
#define PC_MAX_INSTRUCTIONS 1000

uniform sampler2D cardTexture;

#include<punchCard>

void main() {
    pc_run(cardTexture);
    gl_FragColor = vec4(pc_storage.r[0][0]);
}