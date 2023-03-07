import * as twgl from 'twgl.js';
import { Buffer } from 'buffer';
import './index.css';
const m4 = twgl.m4;

function step(edge: number, x: number) {
    return x < edge ? 0.0 : 1.0;
}

function main() {

    // const buffer = Buffer.alloc(4);
    // buffer.writeFloatLE(5.5);

    // const pixel = {
    //     r: 0.5,
    //     g: 0.5,
    //     b: 0.5,
    //     a: 0.5,
    // }
    // pixel.r = buffer[0] / 255.0;
    // pixel.g = buffer[1] / 255.0;
    // pixel.b = buffer[2] / 255.0;
    // pixel.a = buffer[3] / 255.0;

    // const s = pixel.a * 255.0 > 127.0 ? -1.0 : 1.0;
    // const e = (pixel.a * 255.0 & 0x7f) << 1 | (pixel.b * 255.0 & 0x80) >> 7;
    // const m = (pixel.b * 255.0 & 0x7f) << 16 | pixel.g * 255.0 << 8 | pixel.r * 255.0;
    // const f = s * (1.0 + m / 0x800000) * Math.pow(2.0, e - 127.0);

    // const intR = pixel.r * 255.0;
    // const intG = pixel.g * 255.0;
    // const intB = pixel.b * 255.0;
    // const intA = pixel.a * 255.0;

    // const s1 = -step(127.0, intA);
    // const eLastBit = step(127.0, intB);
    // const e1 = (intA + s1 * 128.0) * 2 + eLastBit;
    // const m1 = (intB - eLastBit * 128.0) * 65536.0 + intG * 256.0 + intR; 
    // const f1 = (s1 * 2.0 + 1.0) * (1.0 + m1 / 8388608.0) * Math.pow(2.0, e1 - 127.0);



    const canvas = document.getElementById('c') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('WebGL2 not supported');
        return;
    }
    const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    const planeInfo = twgl.createBufferInfoFromArrays(gl, {
        position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0],
        texcoord: [0, 0, 1, 0, 0, 1, 1, 1],
        indices: [0, 1, 2, 1, 3, 2],
    });

    const cubeInfo = twgl.createBufferInfoFromArrays(gl, {
        position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
        normal: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
        texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
        indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
    });
    const object = {
        transform: {
            position: [0, 0, 0],
            euler: [0, 0, 0],
            scale: [1, 1, 1],
        },
        bufferInfo: planeInfo,
    }
    const camera = {
        position: [0, 0, 5],
        lookAt: [0, 0, 0],
        fov: 45 * Math.PI / 180,
        nearPlane: 0.1,
        farPlane: 100,
    };

    const buffer1 = Buffer.alloc(16);
    buffer1.writeFloatLE(3);
    buffer1.writeFloatLE(3, 4);
    buffer1.writeFloatLE(3, 8);
    buffer1.writeFloatLE(3, 12);

    const tex = twgl.createTexture(gl, {
        src: [
            buffer1[0], buffer1[1], buffer1[2], buffer1[3],
            buffer1[4], buffer1[5], buffer1[6], buffer1[7],
            buffer1[8], buffer1[9], buffer1[10], buffer1[11],
            buffer1[12], buffer1[13], buffer1[14], buffer1[15],
        ],
        wrap: gl.CLAMP_TO_EDGE,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        format: gl.RGBA,
    });

    const mouseController = () => {
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;
        let lastEuler = [0, 0, 0];
        const mouseDown = (e: MouseEvent) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            lastEuler = [...object.transform.euler];
        };
        const mouseUp = () => {
            isDragging = false;
        };
        const mouseMove = (e: MouseEvent) => {
            if (!isDragging) {
                return;
            }
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            object.transform.euler = [
                lastEuler[0] + dy * 0.01,
                lastEuler[1] + dx * 0.01,
                0,
            ];
        };
        const wheel = (e: WheelEvent) => {
            camera.position[2] += e.deltaY * 0.01;
        };
        canvas.addEventListener('mousedown', mouseDown);
        canvas.addEventListener('mouseup', mouseUp);
        canvas.addEventListener('mousemove', mouseMove);
        canvas.addEventListener('mouseleave', mouseUp);
        canvas.addEventListener('wheel', wheel);
    }

    mouseController();

    enum LightType {
        Directional = 0,
        Point = 1,
        Spot = 2,
    }

    const uniforms: {
        modelMatrix: twgl.m4.Mat4,
        viewMatrix: twgl.m4.Mat4,
        projectionMatrix: twgl.m4.Mat4,
        modelViewProjectionMatrix: twgl.m4.Mat4,
        inverseModelMatrix: twgl.m4.Mat4,
        eyePosition: twgl.v3.Vec3,
        code: WebGLTexture,
    } = {
        modelMatrix: m4.identity(),
        viewMatrix: m4.identity(),
        projectionMatrix: m4.identity(),
        modelViewProjectionMatrix: m4.identity(),
        inverseModelMatrix: m4.identity(),
        eyePosition: [0, 0, 0],
        code: tex,
    };

    function render(time: number) {
        if (!gl) {
            return;
        }

        time *= 0.001;
        // update


        // render
        const aspect = (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight;
        twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // model matrix
        m4.identity(uniforms.modelMatrix);
        m4.translate(uniforms.modelMatrix, object.transform.position, uniforms.modelMatrix);
        m4.rotateZ(uniforms.modelMatrix, object.transform.euler[2], uniforms.modelMatrix);
        m4.rotateY(uniforms.modelMatrix, object.transform.euler[1], uniforms.modelMatrix);
        m4.rotateX(uniforms.modelMatrix, object.transform.euler[0], uniforms.modelMatrix);
        m4.scale(uniforms.modelMatrix, object.transform.scale, uniforms.modelMatrix);

        // view matrix
        m4.lookAt(camera.position, camera.lookAt, [0, 1, 0], uniforms.viewMatrix);
        m4.inverse(uniforms.viewMatrix, uniforms.viewMatrix);

        // projection matrix
        m4.perspective(camera.fov, aspect, camera.nearPlane, camera.farPlane, uniforms.projectionMatrix);

        // model view projection matrix
        const projectionViewMatrix = m4.multiply(uniforms.projectionMatrix, uniforms.viewMatrix, uniforms.modelViewProjectionMatrix);
        m4.multiply(projectionViewMatrix, uniforms.modelMatrix, uniforms.modelViewProjectionMatrix);
        m4.inverse(uniforms.modelMatrix, uniforms.inverseModelMatrix);

        uniforms.projectionMatrix = m4.identity();
        m4.perspective(camera.fov, aspect, camera.nearPlane, camera.farPlane, uniforms.projectionMatrix);

        uniforms.eyePosition = camera.position;

        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, object.bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        gl.drawElements(gl.TRIANGLES, object.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();