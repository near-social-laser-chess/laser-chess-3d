import * as THREE from "three";
import {scene} from "./scene.js";
import {board} from "./board.js";
import {OBJLoader} from 'OBJLoader';
import {MTLLoader} from "MTLLoader";

export const pieceModels = {
    yellowKing: {
        model: "/assets/kingY.obj",
        texture: "/assets/kingY.mtl"
    },
    redKing: {
        model: "/assets/kingR.obj",
        texture: "/assets/kingR.mtl"
    },
    yellowDeflector: {
        model: "/assets/deflectorY.obj",
        texture: "/assets/deflectorY.mtl"
    },
    redDeflector: {
        model: "/assets/deflectorR1.obj",
        texture: "/assets/deflectorR1.mtl"
    },
    yellowDefender: {
        model: "/assets/DefenderY1.obj",
        texture: "/assets/DefenderY1.mtl"
    },
    redDefender: {
        model: "/assets/DefenderR1.obj",
        texture: "/assets/DefenderR1.mtl"
    },
    yellowSwitch: {
        model: "/assets/switchY1.obj",
        texture: "/assets/switchY1.mtl"
    },
    redSwitch: {
        model: "/assets/switchR1.obj",
        texture: "/assets/switchR1.mtl"
    },
    yellowLaser: {
        model: "/assets/laserY.obj",
        texture: "/assets/laserY.mtl"
    },
    redLaser: {
        model: "/assets/laserR.obj",
        texture: "/assets/laserR.mtl"
    }
};

export const spawnPiece = (pieceName, row, col, degree= 0) => {
    /*
    pieceName - name of piece in pieceModels
    degree - rotation is clockwise
    */
    console.log(pieceName)
    const pieceData = pieceModels[pieceName];
    const cell = board.findCell(row, col);
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();
    mtlLoader.load(pieceData.texture, (mtl) => {
        mtl.preload();
        for (const material of Object.values(mtl.materials)) {
            material.side = THREE.DoubleSide;
        }
        objLoader.setMaterials(mtl);
        objLoader.load(pieceData.model, (root) => {
            cell.piece = root;
            const center = board.getCellCenter(cell);
            cell.piece.position.x = center.x;
            cell.piece.position.z = center.z;
            cell.piece.position.y = 0;
            cell.piece.scale.set(5, 5, 5);
            cell.piece.rotateY(Math.PI / 180 * -degree); // here we use -degree to rotate clockwise
            scene.add(cell.piece);
        });
    });
}
