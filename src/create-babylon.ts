import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

export const createBabylon: (canvas: HTMLCanvasElement) => () => void = (canvas: HTMLCanvasElement) => {
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(1.0, 0.5, 0.3, 1);
        scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        // skybox
        const envTexture = new BABYLON.CubeTexture("textures/skybox", scene);
        scene.createDefaultSkybox(envTexture, true, 1000);

        // fog
        // scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        // scene.fogDensity = 0.01;

        // camera
        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0), scene);
        camera.attachControl(canvas, true);

        // light
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

        // mesh
        BABYLON.SceneLoader.ImportMeshAsync("", "", "well.glb", scene).then((result) => {
        });
        return scene;
    }
    const scene = createScene();

    engine.runRenderLoop(function () {
        scene.render();
    });

    window.addEventListener("resize", function () {6
        engine.resize();
    });

    return () => {
        scene.dispose();
        engine.dispose();
    }
}