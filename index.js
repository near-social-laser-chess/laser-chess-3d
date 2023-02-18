import {camera, animate, renderer, rotateButtonClockwise,
    rotateButtonCounterClockwise, disableRotateButtons} from "./ui/scene.js";
import {board} from "./ui/board.js";
import {calculateClickedPoint} from "./controller/utils.js";
import {spawnPiece, pieceModels} from "./ui/spawn.js";
import {GameController} from "./controller/main.js";

let gameController = new GameController()
let currentCell = board.findCell(3, 4)
spawnPiece("redDefender", 0, 9, 90)
let index = 0;
const laserPath = [
    {
        startCell: board.findCell(7, 9),
        endCell: board.findCell(6, 9)
    },
    {
        startCell: board.findCell(6, 9),
        endCell: board.findCell(5, 9)
    },
    {
        startCell: board.findCell(5, 9),
        endCell: board.findCell(4, 9)
    },
    {
        startCell: board.findCell(4, 9),
        endCell: board.findCell(4, 8)
    },
    {
        startCell: board.findCell(4, 8),
        endCell: board.findCell(4, 7)
    },
    {
        startCell: board.findCell(4, 7),
        endCell: board.findCell(3, 7)
    },
    {
        startCell: board.findCell(3, 7),
        endCell: board.findCell(3, 8)
    },
    {
        startCell: board.findCell(3, 8),
        endCell: board.findCell(3, 9)
    },
    {
        startCell: board.findCell(3, 9),
        endCell: board.findCell(2, 9)
    },
    {
        startCell: board.findCell(2, 9),
        endCell: board.findCell(1, 9)
    },
    {
        startCell: board.findCell(1, 9),
        endCell: board.findCell(0, 9)
    }
]

// for (let cellPair of laserPath) {
//     board.drawLaser(cellPair.start, cellPair.end)
// }

document.addEventListener( 'mouseup', (e) => {
    const point = calculateClickedPoint(e);
    if (point) {
        const cell = board.getCellByCoords(...point.uv);
        gameController.clickOnBoard(cell)
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

rotateButtonClockwise.addEventListener('click', async () => {
    await board.rotatePiece(currentCell, 90);
    await board.swapPieces(currentCell, board.findCell(4, 5));
    await board.movePiece(currentCell, board.findCell(2, 4));
    await board.drawLaserPathWithKill(laserPath, 1000, 2000);
    console.log("done")
});
