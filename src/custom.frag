#ifdef GL_ES
precision mediump float;
#endif

#include<punchCard>

uniform sampler2D cardTexture;

void main() {
    pc_run(cardTexture);
    gl_FragColor = vec4(pc_storage.r[0][0]);
}