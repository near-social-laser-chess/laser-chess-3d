import {camera, renderer, rotateButtonClockwise,
    rotateButtonCounterClockwise, disableRotateButtons} from "./ui/scene.js";
import {board} from "./ui/scene.js";
import {calculateClickedPoint} from "./controller/utils.js";
import {MovementTypesEnum, PlayerTypesEnum} from "./game_logic/models/Enums";
import {initUI} from "./ui/main";
import {AIGameController} from "./controller/AIGameController";
import {OnlineGameController} from "./controller/OnlineGameController";

export let gameController;

export const initGame = async () => {
    await initUI();
    gameController = new OnlineGameController(PlayerTypesEnum.BLUE, PlayerTypesEnum.RED);

    document.addEventListener( 'mouseup', async (e) => {
        const point = calculateClickedPoint(e);
        if (point) {
            const cell = board.getCellByCoords(...point.uv);
            await gameController.clickOnBoard(cell)
        }
        /*
        else {
            gameController.unselectPiece();
        }

         */
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

    rotateButtonCounterClockwise.addEventListener('click', async () => {
        await gameController.rotatePiece(MovementTypesEnum.ROTATION_C_CLOCKWISE);
    });

    rotateButtonClockwise.addEventListener('click', async () => {
        await gameController.rotatePiece(MovementTypesEnum.ROTATION_CLOCKWISE);
    });
}
