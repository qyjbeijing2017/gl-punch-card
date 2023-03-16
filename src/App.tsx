import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Buffer } from 'buffer'
import * as twgl from 'twgl.js'
import { createCard } from './create-card'
import PunchCard from './PunchCard.frag?raw'
import vs from './vs.vert?raw'
const m4 = twgl.m4;

const reverseYAxios = (bufferRaw: Buffer, size: [number, number]) => {
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

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const gl = canvasRef.current.getContext('webgl2');
    if (!gl) {
      alert('WebGL2 not supported');
      return;
    }
    console.log(`compile shader`);
    let time = Date.now();
    const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
    console.log(`compile shader done, cost ${Date.now() - time}ms`);

    const planeInfo = twgl.createBufferInfoFromArrays(gl, {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0],
      texcoord: [0, 0, 1, 0, 0, 1, 1, 1],
      indices: [0, 1, 2, 1, 3, 2],
    });

    let { buffer, width, height } = createCard();

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

    function render() {
      if (!gl) {
        return;
      }
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

  }, [canvasRef.current])

  return <>
    <script id="vs" type="x-shader/x-vertex">{vs}</script>
    <script id="fs" type="x-shader/x-fragment">{PunchCard}</script>
    <canvas id="canvas" ref={canvasRef} ></canvas>
  </>
}

export default App
