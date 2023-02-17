import {GameStatusEnum, PlayerTypesEnum} from "./models/Enums";
import Board from "./models/Board";
import AI from "./utils/ai/AI";

const DEFAULT_BOARD_SNS = [
    "l++3d++kd++b+++2/2b7/3B+6/b++1B1ss+1b+++1B+/b+++1B+1S+S1b++1B/6b+++3/7B++2/2B+DKD3L",
]

export class Game {
    constructor() {
        this.currentPlayer = PlayerTypesEnum.BLUE
        this.status = GameStatusEnum.PLAYING

        this.selectedPieceLocation = null
        this.movementIsLocked = false

        this.ai = {
            enabled: true,
            movement: null
        }

        this.laser = {
            route: [],
            finalLocation: null,
            finalActionType: null
        }

        this.setBoardType()
    }

    setBoardType() {
        let newBoard = new Board({}).serialize();
        this.squares = newBoard.squares;
        this.winner = newBoard.winner;
        this.sn = newBoard.sn;
   }

    applyMovement(movement) {
        this.movementIsLocked = true;

        const newBoard = new Board({ squares: this.squares });

        newBoard.applyMovement(movement);
        const route = newBoard.getLaserRoute(this.currentPlayer);

        this.laser.triggered = true;
        this.laser.route = route;

        const lastLaserRoutePath = route[route.length - 1];
        this.laser.finalActionType = lastLaserRoutePath.actionType;
        this.laser.finalLocation = lastLaserRoutePath.location;

        if (this.ai.movement) {
            this.ai.movement = null;
        }
    }

    computeAIMovement() {
        const newBoard = new Board({ squares: this.squares });

        const ai = new AI();
        const movement = ai.computeMove(newBoard, PlayerTypesEnum.RED);
        this.ai.movement = movement.serialize();
        this.movementIsLocked = true;
    }

    toggleAI() {
        this.ai.enabled = !this.ai.enabled;
    }

    finishMovement() {
        const newBoard = new Board({ squares: this.squares })
        newBoard.applyLaser(this.currentPlayer)
        const serializedBoard = newBoard.serialize()

        this.winner = serializedBoard.winner
        this.sn = serializedBoard.sn
        this.squares = serializedBoard.squares

        // Check if game over
        if (serializedBoard.winner) {
            // If game is over, then keep the movement locked and show who won in the UI.
            this.movementIsLocked = true
            this.status = GameStatusEnum.GAME_OVER
        } else {
            // reset laser
            this.laser.route = []
            this.laser.finalActionType = null
            this.laser.finalLocation = null

            // If game is not over, then pass the turn to the next player
            this.currentPlayer = (this.currentPlayer === PlayerTypesEnum.BLUE) ? PlayerTypesEnum.RED : PlayerTypesEnum.BLUE
            this.movementIsLocked = false // unlock the movement for the next player.
        }
    }

    selectPiece(location) {
        this.selectedPieceLocation = location
    }

    getMoveForSelectedPiece() {
        const board = new Board({ squares: this.squares });
        return board.getMovesForPieceAtLocation(this.selectedPieceLocation);
    }

    unselectPiece() {
        this.selectedPieceLocation = null
    }

    pause () {
        this.status = GameStatusEnum.PAUSED
    }

    resume() {
        this.status = GameStatusEnum.PLAYING;
    }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}