import {scene, camera, animate, renderer} from "scene";
import {board, getCell, switchCellHighlight, drawCells} from "board";
import {calculateClickedPoint} from "utils";

drawCells();
animate();

document.addEventListener( 'mouseup', (e) => {
    const point = calculateClickedPoint(e);
    if (point) {
        const cell = getCell(...point.uv);
        console.log(cell);
        switchCellHighlight(cell.row, cell.col);
    }
});
