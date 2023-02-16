import * as THREE from 'three';
import {OrbitControls} from 'OrbitControls';


const request = await fetch('/assets/scene.json');
const sceneJsonString = await request.json();

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
camera.position.set(0, 9, 4);
camera.lookAt(0, 0, 0);

export const boardObj = scene.children.find((obj) => obj.name === "Board");
boardObj.renderCallbacks = [];
boardObj.removeDrawnRenderCallbacks = () => {
    boardObj.renderCallbacks = boardObj.renderCallbacks.filter((el) => !el.isDrawn);
}

boardObj.addRenderCallback = (renderCallback) => {
    boardObj.renderCallbacks.push(renderCallback)
}

export const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// TODO: remove controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);

export function animate() {
    requestAnimationFrame( animate );
    for (let renderCallback of boardObj.renderCallbacks) {
        renderCallback.render();
    }
    boardObj.removeDrawnRenderCallbacks();
    renderer.render( scene, camera );
}
