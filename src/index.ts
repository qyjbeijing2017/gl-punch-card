import * as twgl from 'twgl.js';
import { Buffer } from 'buffer';
import './index.css';
import glsl from './PunchCard.frag';
const m4 = twgl.m4;

const reverseYAxios = (bufferRaw: Buffer, size:[number, number]) => {
    const [width, height] = size;
    const buffer = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const index2 = ((height - y - 1) * width + x) * 4;
            buffer[index] = bufferRaw[index2];
            buffer[index + 1] = bufferRaw[index2 + 1];
            buffer[index + 2] = bufferRaw[index2 + 2];
            buffer[index + 3] = bufferRaw[index2 + 3];
        }
    }
    return buffer;
}

async function main() {
    const canvas = document.getElementById('c') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('WebGL2 not supported');
        return;
    }
    console.log(`compile shader`);
    let time = Date.now();
    document.getElementById('fs')!.textContent = glsl;
    const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
    console.log(`compile shader done, cost ${Date.now() - time}ms`);


    const planeInfo = twgl.createBufferInfoFromArrays(gl, {
        position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0],
        texcoord: [0, 0, 1, 0, 0, 1, 1, 1],
        indices: [0, 1, 2, 1, 3, 2],
    });


    const width = 4;
    const height = 4;
    let buffer = Buffer.alloc(width * height * 4, 0);
    buffer.writeFloatLE(width, 0);
    buffer.writeFloatLE(height, 4);
    let index = 8;
    // punch card code
    buffer.writeFloatLE(-1, index);         // mov
    index += 4;
    buffer.writeFloatLE(10, index);         // vec0    
    index += 4;
    buffer.writeFloatLE(1, index);          // 1
    index += 4;
    buffer.writeFloatLE(0, index);          // 0
    index += 4;
    buffer.writeFloatLE(0, index);          // 0
    index += 4;
    buffer.writeFloatLE(1, index);          // 1
    index += 4;
    buffer.writeFloatLE(5, index);          // out
    index += 4;
    buffer.writeFloatLE(10, index);         // vec0
    index += 4;
    buffer.writeFloatLE(0, index);          // 0

    buffer = reverseYAxios(buffer, [width, height]);
    // reverse y axis
    const tex = twgl.createTexture(gl, {
        src: buffer,
        width,
        height,
        wrap: gl.CLAMP_TO_EDGE,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        format: gl.RGBA,
    });

    const uniforms: {
        code: WebGLTexture,
    } = {
        code: tex,
    };

    function render(time: number) {
        if (!gl) {
            return;
        }

        time *= 0.001;
        // update


        // render
        twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, planeInfo);
        twgl.setUniforms(programInfo, uniforms);
        gl.drawElements(gl.TRIANGLES, planeInfo.numElements, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();