attribute vec4 position;
attribute vec2 texcoord;

varying vec3 v_fragPos;
varying vec3 v_normal;
varying vec2 v_texcoord;
varying vec3 v_viewPos;

void main() {
    v_texcoord = texcoord;
    v_fragPos = vec3(position);
    v_normal = vec3(0.0, 0.0, 1.0);
    v_viewPos = vec3(0.0, 0.0, 0.0);
    gl_Position = position;
}