import { useEffect, useRef } from 'react'
import './App.css'
import { createBabylon } from './create-babylon';
import { createEngine } from './engine';
import PunchCard from './PunchCard.frag?raw'
import vs from './vs.vert?raw'



function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    // createEngine(canvasRef.current);
    return createBabylon(canvasRef.current);
  }, [canvasRef.current])

  return <>
    <script id="vs" type="x-shader/x-vertex">{vs}</script>
    <script id="fs" type="x-shader/x-fragment">{PunchCard}</script>
    <canvas id="canvas" ref={canvasRef} ></canvas>
  </>
}

export default App
