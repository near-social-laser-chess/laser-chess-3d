import * as THREE from "three";
import {board} from "board";
import {camera} from "scene";

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

export const getPieceName = (type, color) => {
    if (color === "blue") color = "red"
    let upperType = type[0].toUpperCase() + type.slice(1); // king => King

    return color + upperType // redKing
}