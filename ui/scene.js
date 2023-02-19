import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";


const request = await fetch(`${BASE_URL}/assets/scene.json`);
const sceneJsonString = await request.json();


export const rotateButtonCounterClockwise = document.querySelector("button[aria-label='rotate piece left']");
export const rotateButtonClockwise = document.querySelector("button[aria-label='rotate piece right']");

export const enableRotateButtonCounterClockwise = () => {
    rotateButtonCounterClockwise.removeAttribute("disabled");
}

export const enableRotateButtonClockwise = () => {
    rotateButtonClockwise.removeAttribute("disabled");
}

export const enableRotateButtons = () => {
    rotateButtonCounterClockwise.removeAttribute("disabled");
    rotateButtonClockwise.removeAttribute("disabled");
}

export const disableRotateButtons = () => {
    rotateButtonCounterClockwise.setAttribute("disabled", "");
    rotateButtonClockwise.setAttribute("disabled", "");
}

export class RenderCallback {
    isDrawn = false;

    // override this method. When draw ended, set isDrawn = true
    draw() {};

    render() {
        if (!this.isDrawn)
            this.draw();
    };
}

const objLoader = new THREE.ObjectLoader();

export const scene = objLoader.parse(sceneJsonString);
export const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20);
camera.position.set(0, 8, 7);
camera.lookAt(0, 0, 0);

export const boardObj = scene.children.find((obj) => obj.name === "Board");
boardObj.renderCallbacks = [];
boardObj.removeDrawnRenderCallbacks = () => {
    boardObj.renderCallbacks = boardObj.renderCallbacks.filter((el) => !el.isDrawn);
}

boardObj.addRenderCallback = (renderCallback) => {
    boardObj.renderCallbacks.push(renderCallback)
}

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio( window.devicePixelRatio );
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableZoom = false;
controls.enablePan = false;
controls.minPolarAngle = Math.PI / 3.6;
controls.maxPolarAngle = Math.PI / 3.6;

export function animate() {
    requestAnimationFrame( animate );
    for (let renderCallback of boardObj.renderCallbacks) {
        renderCallback.render();
    }
    boardObj.removeDrawnRenderCallbacks();
    renderer.render( scene, camera );
    controls.update();
}
