import * as THREE from "three";
import {boardObj, scene} from "./scene.js";
import {SwapPiecesRenderCallback, RotatePieceRenderCallback, MoveObjectRenderCallback,
        KillPieceRenderCallback} from "./RenderCallbacks.js";
import {Color} from "three";

export const board = boardObj;
const PIECE_CENTER_Y = 0.438;

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
    if (row < 0 || row > 7 || col < 0 || col > 9) {
        throw new Error(`Invalid cell coordinates row=${row}, col=${col}`);
    }
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

    const center = board.getCellCenter({row, col});
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

board.rotatePiece = (cell, angle) => {
    if (cell.piece == null)
        return;
    return new Promise((resolve, reject) => {
        const renderCallback = new RotatePieceRenderCallback(cell.piece, angle, 0.05, resolve);
        board.addRenderCallback(renderCallback);
    });
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
    points[0].y = PIECE_CENTER_Y;
    points[1].y = PIECE_CENTER_Y;

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
    return [lineOuter, lineInner];
}

board.killAndRemovePiece = (cell, animationTime = 1000) => {
    if (cell.piece === null)
        return new Promise((resolve) => resolve());
    return new Promise((resolve) => {
        const callback = () => {
            scene.remove(cell.piece);
            cell.piece = null;
            resolve();
        }
        const renderCallback = new KillPieceRenderCallback(cell.piece, animationTime, callback);
        board.addRenderCallback(renderCallback);
    });
}

board.drawLaserPath = (pathSegments, removeTimeout = 1000) => {
    let laserSegments = [];
    for (let cellPairIndex in pathSegments) {
        const cellPair = pathSegments[cellPairIndex];
        const points = [
            board.getCellCenter(cellPair.startCell),
        ];
        if (cellPair.endCell.piece != null) {
            // raycast to the piece from the startCell
            const raycaster = new THREE.Raycaster();
            const start = points[0].clone();
            start.y = PIECE_CENTER_Y;
            const end = board.getCellCenter(cellPair.endCell).clone();
            end.y = PIECE_CENTER_Y;
            raycaster.set(start, end.clone().sub(start).normalize());
            const intersects = raycaster.intersectObject(cellPair.endCell.piece, true);
            if (intersects.length > 0) {
                points.push(intersects[0].point);
            }
        } else {
            points.push(board.getCellCenter(cellPair.endCell));
        }

        // check if the cellPair.endCell is the border of the board and if so, check if the cellEnd has piece on it
        // and if not set the point[1] to the border
        if (cellPairIndex == pathSegments.length - 1 && cellPair.endCell.piece == null && cellPair.endCell.isBorder) {
            const diff = points[1].clone().sub(points[0]);
            points[1].add(diff.multiplyScalar(10))
        }

        laserSegments.push(...board.drawLaserSegment(points[0], points[1]))
    }
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            for (let segment of laserSegments) {
                scene.remove(segment);
            }
            resolve();
        }, removeTimeout);
    });
}

board.drawLaserPathWithKill = (pathSegments, removeLaserTimeout = 1000, removePieceAnimationTime = 1000) => {
    const laserDrawing = board.drawLaserPath(pathSegments, removeLaserTimeout)
    const lastCell = pathSegments[pathSegments.length - 1].endCell;
    const killPiece = board.killAndRemovePiece(lastCell, removePieceAnimationTime);
    return Promise.all([laserDrawing, killPiece]);
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
    for (let z = -3; z <= 3; z++) {
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
