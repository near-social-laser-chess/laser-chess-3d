import {camera, renderer, rotateButtonClockwise,
    rotateButtonCounterClockwise} from "./ui/scene.js";
import {board} from "./ui/scene.js";
import {calculateClickedPoint} from "./controller/utils.js";
import {MovementTypesEnum} from "./game_logic/models/Enums";
import {initUI} from "./ui/main";
import {AIGameController} from "./controller/AIGameController";
import {OnlineGameController} from "./controller/OnlineGameController";
import {soundClick, soundMovement} from "./ui/sounds";

export let gameController;

export const initGame = async (gameConfig, callback) => {
    await initUI();

    if (gameConfig.type === "online") {
        gameController = new OnlineGameController(gameConfig.userColor, gameConfig.opponentColor, gameConfig.sn, gameConfig.currentPlayer, gameConfig.numberOfMoves);
    } else {
        gameController = new AIGameController(gameConfig.sn);
    }

    document.addEventListener( 'mouseup', async (e) => {
        const point = calculateClickedPoint(e);
        if (point) {
            soundClick.play();
            const cell = board.getCellByCoords(...point.uv);
            const data = await gameController.clickOnBoard(cell)
            if (data && callback instanceof Function) {
                callback(data)
            }
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

    rotateButtonCounterClockwise.addEventListener('click', async () => {
        soundClick.play();
        const data = await gameController.rotatePiece(MovementTypesEnum.ROTATION_C_CLOCKWISE);

        if (callback instanceof Function) {
            callback(data)
        }
    });

    rotateButtonClockwise.addEventListener('click', async () => {
        soundClick.play();
        const data = await gameController.rotatePiece(MovementTypesEnum.ROTATION_CLOCKWISE);

        if (callback instanceof Function) {
            callback(data)
        }
    });
}

export const makeMove = async (data) => {
    soundMovement.play();
    if (!(gameController instanceof OnlineGameController)) throw new Error("Must be online");
    await gameController.displayMove(data);
}
