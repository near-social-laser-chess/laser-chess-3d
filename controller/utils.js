import * as THREE from "three";
import {board} from "../ui/board.js";
import {camera} from "../ui/scene.js";

const raycaster = new THREE.Raycaster();

export const calculateClickedPoint = (event) => {
    const pointer = new THREE.Vector2();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(board, false);
    if (intersects.length > 0) {
        return intersects[0];
    }
}
