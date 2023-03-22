attribute vec4 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 world;
uniform mat4 worldView;
uniform mat4 worldViewProjection;
uniform mat4 view;
uniform mat4 projection;
uniform float time;

void main() {
    gl_Position = worldViewProjection * position;
}