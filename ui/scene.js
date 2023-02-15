import * as THREE from 'three';
import {OrbitControls} from 'OrbitControls';


const request = await fetch('/assets/scene.json');
const sceneJsonString = await request.json();

const objLoader = new THREE.ObjectLoader();

export const scene = objLoader.parse(sceneJsonString);
export const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20);
camera.position.set(0, 9, 4);
camera.lookAt(0, 0, 0);

export const boardObj = scene.children.find((obj) => obj.name === "Board");

export const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// TODO: remove controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);

export function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
