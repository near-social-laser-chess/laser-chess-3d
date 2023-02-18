import * as THREE from "three";
import {boardObj, scene, RenderCallback} from "./scene.js";

export const board = boardObj;

board.cells = [];

const initCells = () => {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 10; col++) {
            board.cells.push({
                row: row,
                col: col,
                isBorder: row === 0 || row === 7 || col === 0 || col === 9,
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

board.unhighlightAllCells = () => {
    for (let cell of board.cells) {
        if (cell.isHighlighted)
            board.unhighligtCell(cell.row, cell.col);
    }
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
    constructor(pieceObj, endCoord, interval = 0.05, callback = null) {
        super();
        this.callback = callback;
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
            if (this.callback != null)
                this.callback();
            return;
        }
        this.pieceObj.position.add(this.movement)
    }
}

board.movePiece = (startCell, endCell) => {
    if (startCell.piece == null || endCell.piece != null) {
        return;
    }
    return new Promise((resolve, reject) => {
        const endCoord = board.getCellCenter(endCell);
        const callback = () => {
            const pieceObj = startCell.piece;
            startCell.piece = null;
            endCell.piece = pieceObj;
            resolve();
        }
        const renderCallback = new MoveObjectRenderCallback(startCell.piece, endCoord, 0.05, callback);
        board.addRenderCallback(renderCallback);
    });
}

class RotatePieceRenderCallback extends RenderCallback {
    constructor(pieceObj, angle, interval = 0.05, callback = null) {
        // angle in degrees. negative is counterclockwise, positive is clockwise
        super();
        this.callback = callback;
        this.pieceObj = pieceObj;
        angle = angle / 180 * Math.PI * -1;
        this.angle = angle;
        this.endAngle = this.pieceObj.rotation.y + angle;
        if (angle < 0)
            if (this.pieceObj.rotation.y === 0)
                this.endAngle = Math.PI * 2 - this.pieceObj.rotation.y + angle;
            else
                this.endAngle = this.pieceObj.rotation.y + angle;
        this.interval = interval;
        this.movement = angle * this.interval;
    }

    draw() {
        if (Math.abs(this.pieceObj.rotation.y - this.endAngle) <= this.interval || Math.abs(Math.PI * 2 + this.pieceObj.rotation.y - this.endAngle) <= this.interval) {
            this.pieceObj.rotation.y = this.endAngle;
            this.isDrawn = true;
            if (this.callback != null)
                this.callback();
            if (this.angle > 0 && this.pieceObj.rotation.y >= Math.PI * 2) {
                this.pieceObj.rotation.y = 0;
            }
            return;
        }
        this.pieceObj.rotation.y += this.movement;
    }
}

board.rotatePiece = (cell, angle) => {
    if (cell.piece == null)
        return;
    return new Promise((resolve, reject) => {
        const renderCallback = new RotatePieceRenderCallback(cell.piece, angle, 0.05, resolve);
        board.addRenderCallback(renderCallback);
    });
}

class SwapPiecesRenderCallback extends RenderCallback {
    // Firsty pieceObj1 is moved up on it's height, then it is moved to the position of pieceObj2,
    // then pieceObj2 is moved on starting position of pieceObj1 and finally pieceObj1 moved down on it's height
    State = {
        FirstPieceUp: "firstPieceUp",
        FirstPieceMove: "firstPieceMove",
        SecondPieceMove: "secondPieceMove",
        FirstPieceDown: "secondPieceDown",
    }

    constructor(pieceObj1, pieceObj2, interval = 0.05, callback = null) {
        super();
        this.pieceObj1 = pieceObj1;
        this.pieceObj2 = pieceObj2;
        this.interval = interval;
        this.callback = callback;
        this.state = this.State.FirstPieceUp;

        this.firstPieceUpEndCoord = new THREE.Vector3(this.pieceObj1.position.x, 1, this.pieceObj1.position.z);
        this.firstPieceMoveEndCoord = new THREE.Vector3(
            this.pieceObj2.position.x,
            this.firstPieceUpEndCoord.y,
            this.pieceObj2.position.z);
        this.secondPieceMoveEndCoord = this.pieceObj1.position.clone();
        this.firstPieceDownEndCoord = this.pieceObj2.position.clone();

        // calculate movement vectors
        this.firstPieceUpMovement = new THREE.Vector3(0, interval, 0);
        let diff = this.pieceObj2.position.clone().sub(this.pieceObj1.position);
        this.firstPieceMoveMovement = new THREE.Vector3(diff.x * this.interval, 0, diff.z * this.interval);
        diff = this.pieceObj1.position.clone().sub(this.pieceObj2.position);
        this.secondPieceMoveMovement = new THREE.Vector3(diff.x * this.interval, 0, diff.z * this.interval);
        this.firstPieceDownMovement = new THREE.Vector3(0, -interval, 0);
    }

    draw() {
        switch (this.state) {
            case this.State.FirstPieceUp:
                if (this.pieceObj1.position.y >= this.firstPieceUpEndCoord.y) {
                    this.pieceObj1.position.copy(this.firstPieceUpEndCoord);
                    this.state = this.State.FirstPieceMove;
                } else {
                    this.pieceObj1.position.add(this.firstPieceUpMovement);
                }
                break;
            case this.State.FirstPieceMove:
                if (this.pieceObj1.position.distanceTo(this.firstPieceMoveEndCoord) <= this.interval) {
                    this.pieceObj1.position.copy(this.firstPieceMoveEndCoord);
                    this.state = this.State.SecondPieceMove;
                } else {
                    this.pieceObj1.position.add(this.firstPieceMoveMovement);
                }
                break;
            case this.State.SecondPieceMove:
                if (this.pieceObj2.position.distanceTo(this.secondPieceMoveEndCoord) <= this.interval) {
                    this.pieceObj2.position.copy(this.secondPieceMoveEndCoord);
                    this.state = this.State.FirstPieceDown;
                } else {
                    this.pieceObj2.position.add(this.secondPieceMoveMovement);
                }
                break;
            case this.State.FirstPieceDown:
                if (this.pieceObj1.position.y <= this.firstPieceDownEndCoord.y) {
                    this.pieceObj1.position.copy(this.firstPieceDownEndCoord);
                    this.isDrawn = true;
                    if (this.callback != null) {
                        this.callback();
                    }
                } else {
                    this.pieceObj1.position.add(this.firstPieceDownMovement);
                }
                break;
        }
    }

}

board.swapPieces = (cell1, cell2) => {
    if (cell1.piece == null || cell2.piece == null)
        return;
    return new Promise((resolve, reject) => {
        const callback = () => {
            const temp = cell1.piece;
            cell1.piece = cell2.piece;
            cell2.piece = temp;
            resolve();
        }
        const renderCallback = new SwapPiecesRenderCallback(cell1.piece, cell2.piece, 0.05, callback);
        board.addRenderCallback(renderCallback);
    });
}

board.drawLaserSegment = (startCoords, endCoords) => {
    const materialOuter = new THREE.MeshBasicMaterial( { color: 0xff0000, transparent: true, opacity: 0.5 } );
    const materialInner = new THREE.LineBasicMaterial( { color: 0xffffff } );
    const points = [
        startCoords,
        endCoords
    ]
    points[0].y = 0.48;
    points[1].y = 0.48;

    const geometryOuter = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        512,// path segments
        0.02,// THICKNESS
        8, //Roundness of Tube
        false, //closed
    );
    const lineOuter = new THREE.Line(geometryOuter, materialOuter);
    const geometryInner = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        2048,// path segments
        0.0195,// THICKNESS
        8, //Roundness of Tube
        false //closed
    );
    const lineInner = new THREE.Line(geometryInner, materialInner);
    scene.add(lineOuter);
    scene.add(lineInner);
    setTimeout(() => {
        scene.remove(lineOuter);
        scene.remove(lineInner);
    }, 1000);
}

board.drawLaserPath = (pathSegments) => {
    for (let cellPairIndex in pathSegments) {
        const cellPair = pathSegments[cellPairIndex];
        const points = [
            board.getCellCenter(cellPair.startCell),
            board.getCellCenter(cellPair.endCell)
        ];

        // check if the cellPair.endCell is the border of the board and if so, check if the cellEnd has piece on it
        // and if not set the point[1] to the border
        if (cellPairIndex == pathSegments.length - 1 && cellPair.endCell.piece == null && cellPair.endCell.isBorder) {
            const diff = points[1].clone().sub(points[0]);
            points[1].add(diff.multiplyScalar(10))
        }

        board.drawLaserSegment(points[0], points[1])
    }
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
