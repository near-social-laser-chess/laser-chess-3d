import * as THREE from "three";
import {camera, board} from "../ui/scene.js";

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
    if (color === "blue") color = "yellow"

    switch (type) {
        case "l":
            type = "Laser";
            break;
        case "k":
            type = "King";
            break;
        case "b":
            type = "Deflector";
            break;
        case "d":
            type = "Defender";
            break;
        case "s":
            type = "Switch";
            break;
    }

    return color + type // redKing
}