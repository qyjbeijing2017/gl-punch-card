export class Transform {
    position: vec3;
    rotation: vec4;
    scale: vec3;
    constructor() {
        this.position = [0, 0, 0];
        this.rotation = [0, 0, 0, 1];
        this.scale = [1, 1, 1];
    }
}