import * as THREE from "three";
import {boardObj, scene} from "scene";

export const board = boardObj;

board.highlightedCells = [];

board.getCell = (x, y) => {
    // get cell index in matrix by normalized coordinates (0 <= x,y <= 1)
    const row = 7 - Math.floor(y * 8);
    const col = Math.floor(x * 10);
    return {
        row: row,
        col: col
    }
}

board.findHighlightedCell = (row, col) => {
    return board.highlightedCells.find((obj) => obj.row === row && obj.col === col);
}

board.isCellHighlighted = (row, col) => {
    return !!board.findHighlightedCell(row, col);
}

board.highlightCell = (row, col, color) => {
    if (board.isCellHighlighted(row, col))
        return;
    if (color == null)
        color = 0x00ff00;
    const geometry = new THREE.PlaneGeometry( 1, 1 );
    const material = new THREE.MeshBasicMaterial( {color: color, side: THREE.FrontSide} );
    const plane = new THREE.Mesh( geometry, material );
    plane.position.x = col - 5 + 0.5;
    plane.position.z = row - 4 + 0.5;
    plane.position.y = 0.001;
    plane.rotation.x = Math.PI / 2 * -1;
    scene.add(plane);
    const cell = {row: row, col: col, highlightObj: plane};
    board.highlightedCells.push(cell);
    return cell;
}

board.unhighligtCell = (row, col) => {
    if (!board.isCellHighlighted(row, col))
        return;
    const highlightedCell = board.findHighlightedCell(row, col);
    scene.remove(highlightedCell.highlightObj)

    board.highlightedCells.splice(
        board.highlightedCells.indexOf(highlightedCell),
        1
    );
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
