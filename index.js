import {camera, animate, renderer, rotateButtonClockwise,
    rotateButtonCounterClockwise, disableRotateButtons, enableRotateButtons} from "./ui/scene.js";
import {board} from "./ui/board.js";
import {calculateClickedPoint} from "./controller/utils.js";
import {spawnPiece, pieceModels} from "./ui/spawn.js";

board.drawCells();
let currentCell = board.findCell(3, 4);
spawnPiece("yellowDeflector", 3, 4)
animate();
let index = 0;

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


rotateButtonCounterClockwise.addEventListener('click', () => {
    board.rotatePiece(currentCell, -90);
});

rotateButtonClockwise.addEventListener('click', () => {
    board.rotatePiece(currentCell, 90);
});

disableRotateButtons();
