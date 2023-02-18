import * as THREE from "three";
import {scene} from "./scene.js";
import {board} from "./board.js";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";

export const pieceModels = {
    yellowKing: {
        model: `${process.env.BASE_URL ? process.env.BASE_URL: ""}assets/kingY.obj`,
        texture: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/kingY.mtl`
    },
    redKing: {
        model: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/kingR.obj`,
        texture: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/kingR.mtl`
    },
    yellowDeflector: {
        model: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/deflectorY.obj`,
        texture: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/deflectorY.mtl`
    },
    redDeflector: {
        model: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/deflectorR1.obj`,
        texture: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/deflectorR1.mtl`
    },
    yellowDefender: {
        model: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/DefenderY1.obj`,
        texture: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/DefenderY1.mtl`
    },
    redDefender: {
        model: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/DefenderR1.obj`,
        texture: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/DefenderR1.mtl`
    },
    yellowSwitch: {
        model: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/switchY1.obj`,
        texture: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/switchY1.mtl`
    },
    redSwitch: {
        model: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/switchR1.obj`,
        texture: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/switchR1.mtl`
    },
    yellowLaser: {
        model: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/laserY.obj`,
        texture: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/laserY.mtl`
    },
    redLaser: {
        model: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/laserR.obj`,
        texture: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/assets/laserR.mtl`
    }
};

export const spawnPieceOnCell = (cell, pieceName, degree= 0) => {
    /*
    pieceName - name of piece in pieceModels
    degree - rotation is clockwise
    */
    console.log(pieceName)
    const pieceData = pieceModels[pieceName];
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
            cell.piece.scale.set(4.5, 4.5, 4.5);
            // make the rotation in range [0, 2PI]
            let rotation = Math.PI / 180 * -(degree % 360);
            if (rotation < 0) {
                rotation += Math.PI * 2;
            }
            cell.piece.rotation.y = rotation; // here we use -degree to rotate clockwise
            scene.add(cell.piece);
        });
    });
}

export const spawnPiece = (pieceName, row, col, degree= 0) => {
    /*
    pieceName - name of piece in pieceModels
    degree - rotation is clockwise
    */
    const cell = board.findCell(row, col);
    spawnPieceOnCell(cell, pieceName, degree);
}

export const removePiece = (cell) => {
    /*
    removes piece from scene at all
    */
    if (cell.piece == null) {
        return;
    }
    scene.remove(cell.piece);
    cell.piece = null;
}

export const removePieceByRowCol = (row, col) => {
    /*
    removes piece from scene at all
    */
    const cell = board.findCell(row, col);
    removePiece(cell);
}
