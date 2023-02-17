import {camera, animate, renderer} from "scene";
import {board} from "board";
import {calculateClickedPoint} from "utils";
import {spawnPiece, pieceModels} from "spawn";
import {GameController} from "gameController"

let gameController = new GameController();
/*
board.drawCells();
let currentCell = board.findCell(3, 4);
spawnPiece("redKing", 3, 4)
animate();
let index = 0;
 */

let currentCell = board.findCell(3, 4);
document.addEventListener( 'mouseup', (e) => {
    const point = calculateClickedPoint(e);
    if (point) {
        const cell = board.getCellByCoords(...point.uv);
        // board.switchCellHighlight(cell.row, cell.col);
        // if (index === Object.keys(pieceModels).length)
        //     index = 0;
        // let i = 0;
        // for (let name in pieceModels) {
        //     if (i === index) {
        //         spawnPiece(name, cell.row, cell.col, 0);
        //         index++;
        //         break;
        //     }
        //     i++;
        // }
        board.movePiece(currentCell, cell);
        currentCell = cell;
    }
});

document.addEventListener('mousemove', e => {
    const point = calculateClickedPoint(e);
    if (point)
        e.target.style.cursor = 'pointer';
    else
        e.target.style.cursor = 'default';
})

document.addEventListener('resize', (e) => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
});
