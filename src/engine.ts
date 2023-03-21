import { createCard } from './create-card'
import * as twgl from 'twgl.js'
const m4 = twgl.m4;

export const createEngine = async (canvas: HTMLCanvasElement) => {

  const gl = canvas.getContext('webgl2');
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

  // buffer = reverseYAxios(buffer, [width, height]);
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
    code?: WebGLTexture,
    pc_input?:{
      argm?:twgl.m4.Mat4[],
      argt?: WebGLTexture[],
    }
  } = {
    code: tex,
    pc_input: {
      argm: [
        [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1,
        ],
      ],
    },
  };

  gl.clearColor(0, 0, 0, 1);

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
}