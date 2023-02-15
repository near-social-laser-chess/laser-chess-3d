import {scene, camera, animate, renderer} from "scene";
import {board} from "board";
import {calculateClickedPoint} from "utils";
import {spawnPiece} from "spawn";

board.drawCells();
animate();

document.addEventListener( 'mouseup', (e) => {
    const point = calculateClickedPoint(e);
    if (point) {
        const cell = board.getCellByCoords(...point.uv);
        console.log(cell);
        // board.switchCellHighlight(cell.row, cell.col);
        spawnPiece("yellowDeflector", cell.row, cell.col, 0);
    }
});

document.addEventListener('mousemove', e => {
    const point = calculateClickedPoint(e);
    if (point)
        e.target.style.cursor = 'pointer';
    else
        e.target.style.cursor = 'default';
})

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
