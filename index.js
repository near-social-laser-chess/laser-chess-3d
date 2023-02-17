import {camera, animate, renderer, rotateButtonClockwise,
    rotateButtonCounterClockwise} from "./ui/scene.js";
import {board} from "./ui/board.js";
import {calculateClickedPoint} from "./controller/utils.js";
import {spawnPieceOnCell} from "./ui/spawn.js";

board.drawCells();
let currentCell = board.findCell(3, 4);
const secondCell = board.findCell(4, 5);
spawnPieceOnCell(currentCell, "redKing")
spawnPieceOnCell(secondCell, "yellowDeflector")
animate();

document.addEventListener( 'mouseup', (e) => {
    const point = calculateClickedPoint(e);
    if (point) {
        const cell = board.getCellByCoords(...point.uv);
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
