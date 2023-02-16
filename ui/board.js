import * as THREE from "three";
import {boardObj, scene, RenderCallback} from "scene";

export const board = boardObj;

board.cells = [];

const initCells = () => {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 10; col++) {
            board.cells.push({
                row: row,
                col: col,
                isHighlighted: false,
                highlightObj: null,
                piece: null
            })
        }
    }
}

initCells();

board.getCellByCoords = (x, y) => {
    // get cell index in matrix by normalized coordinates (0 <= x,y <= 1)
    const row = 7 - Math.floor(y * 8);
    const col = Math.floor(x * 10);
    return board.findCell(row, col);
}

board.findCell = (row, col) => {
    return board.cells.find((obj) => obj.row === row && obj.col === col);
}

board.isCellHighlighted = (row, col) => {
    return board.findCell(row, col).isHighlighted;
}

board.getCellCenter = (cell) => {
    return new THREE.Vector3(cell.col - 5 + 0.5, 0, cell.row - 4 + 0.5)
}

board.highlightCell = (row, col, color) => {
    if (board.isCellHighlighted(row, col))
        return;
    if (color == null)
        color = 0x00ff00;
    const geometry = new THREE.PlaneGeometry( 1, 1 );
    const material = new THREE.MeshBasicMaterial( {color: color, side: THREE.FrontSide} );
    const plane = new THREE.Mesh( geometry, material );

    const center = board.getCellCenter(row, col);
    plane.position.x = center.x;
    plane.position.z = center.z;
    plane.position.y = 0.001;
    plane.rotation.x = Math.PI / 2 * -1;
    scene.add(plane);
    const cell = board.findCell(row, col);
    cell.highlightObj = plane;
    cell.isHighlighted = true;
    return cell;
}

board.unhighligtCell = (row, col) => {
    if (!board.isCellHighlighted(row, col))
        return;
    const highlightedCell = board.findCell(row, col);
    scene.remove(highlightedCell.highlightObj)

    highlightedCell.highlightObj = null;
    highlightedCell.isHighlighted = false
}

board.switchCellHighlight = (row, col, color) => {
    // returns true if cell was highlighted, otherwise returns false
    // uses color argument when highlighting
    if (!board.isCellHighlighted(row, col)) {
        board.highlightCell(row, col, color);
        return true;
    }
    board.unhighligtCell(row, col)
    return false;
}

class MoveObjectRenderCallback extends RenderCallback {
    constructor(pieceObj, endCoord, interval = 0.05) {
        super();
        this.pieceObj = pieceObj;
        this.startCoord = pieceObj.position;
        this.endCoord = endCoord;
        this.interval = interval;

        const diff = this.endCoord.clone().sub(this.startCoord);
        this.movement = new THREE.Vector3(diff.x * this.interval, diff.y, diff.z * this.interval);
    }

    draw() {
        if (this.startCoord.distanceTo(this.endCoord) <= this.interval) {
            this.pieceObj.position.copy(this.endCoord)
            this.isDrawn = true;
            return;
        }
        this.pieceObj.position.add(this.movement)
    }
}

board.movePiece = (startCell, endCell) => {
    if (startCell.piece == null || endCell.piece != null) {
        return;
    }
    const endCoord = board.getCellCenter(endCell);
    const renderCallback = new MoveObjectRenderCallback(startCell.piece, endCoord, 0.05);
    board.addRenderCallback(renderCallback);
    endCell.piece = startCell.piece;
    startCell.piece = null;
}

// for testing purposes only
board.drawCells = () => {
    const material = new THREE.LineBasicMaterial( { color: 0x000000 } );
    for (let x = -4; x <= 4; x++) {
        const points = [];
        points.push(new THREE.Vector3( x, 0, 4 ))
        points.push(new THREE.Vector3( x, 0, -4 ))
        const geometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            512,// path segments
            0.01,// THICKNESS
            8, //Roundness of Tube
            false //closed
        );
        const line = new THREE.Line(geometry, material);
        scene.add(line);
    }
    for (let z = -4; z <= 4; z++) {
        const points = [];
        points.push(new THREE.Vector3( -5, 0, z ))
        points.push(new THREE.Vector3( 5, 0, z ))
        const geometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            512,// path segments
            0.01,// THICKNESS
            8, //Roundness of Tube
            false //closed
        );
        const line = new THREE.Line(geometry, material);
        scene.add(line);
    }
}
