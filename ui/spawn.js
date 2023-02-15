import {scene} from "scene";
import {board} from "board";
import {OBJLoader} from 'OBJLoader';
import {MTLLoader} from "MTLLoader";

export const pieceModels = {
    yellowKing: {
        model: "/assets/deflectorY12.obj",
        texture: "/assets/deflectorY12.mtl"
    },
    redKing: {
        model: "/assets/deflectorY12.obj",
        texture: "/assets/deflectorY12.mtl"
    },
    yellowDeflector: {
        model: "/assets/deflectorY12.obj",
        texture: "/assets/deflectorY12.mtl"
    },
    redDeflector: {
        model: "/assets/deflectorY12.obj",
        texture: "/assets/deflectorY12.mtl"
    },
    yellowDefender: {
        model: "/assets/deflectorY12.obj",
        texture: "/assets/deflectorY12.mtl"
    },
    redDefender: {
        model: "/assets/deflectorY12.obj",
        texture: "/assets/deflectorY12.mtl"
    },
    yellowSwitch: {
        model: "/assets/deflectorY12.obj",
        texture: "/assets/deflectorY12.mtl"
    },
    redSwitch: {
        model: "/assets/deflectorY12.obj",
        texture: "/assets/deflectorY12.mtl"
    },
    yellowLaser: {
        model: "/assets/deflectorY12.obj",
        texture: "/assets/deflectorY12.mtl"
    },
    redLaser: {
        model: "/assets/deflectorY12.obj",
        texture: "/assets/deflectorY12.mtl"
    }
};

export const spawnPiece = (pieceName, row, col, degree= 0) => {
    /*
    pieceName - name of piece in pieceModels
    degree - rotation is clockwise
    */
    const pieceData = pieceModels[pieceName];
    const cell = board.findCell(row, col);
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();
    mtlLoader.load(pieceData.texture, (mtl) => {
        mtl.preload();
        objLoader.setMaterials(mtl);
        objLoader.load(pieceData.model, (root) => {
            cell.piece = root;
            const center = board.getCellCenter(row, col);
            cell.piece.position.x = center.x;
            cell.piece.position.z = center.z;
            cell.piece.position.y = 0.001;
            cell.piece.scale.set(5, 5, 5);
            cell.piece.rotateY(Math.PI / 180 * -degree); // here we use -degree to rotate clockwise
            scene.add(cell.piece);
        });
    });
}
