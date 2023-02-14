import {scene, camera, animate, renderer} from "scene";
import {board} from "board";
import {calculateClickedPoint} from "utils";

board.drawCells();
animate();

document.addEventListener( 'mouseup', (e) => {
    const point = calculateClickedPoint(e);
    if (point) {
        const cell = board.getCell(...point.uv);
        console.log(cell);
        board.switchCellHighlight(cell.row, cell.col);
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
