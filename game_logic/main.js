import {GameStatusEnum, PieceTypesEnum, PlayerTypesEnum} from "./models/Enums.js";
import Board from "./models/Board.js";
import AI from "./utils/ai/AI.js";

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

    getWinner() {
        return this.winner;
    }

    isGameFinished() {
        console.log(this.status)
        return this.status === GameStatusEnum.GAME_OVER;
    }

    setBoardType() {
        let newBoard = new Board({}).serialize();
        this.squares = newBoard.squares;
        this.winner = newBoard.winner;
        this.sn = newBoard.sn;
   }

   getLaser() {
        return this.laser;
   }

    async applyMovement(movement) {
        const newBoard = new Board({squares: this.squares});

        newBoard.applyMovement(movement);
        const route = await newBoard.getLaserRoute(this.currentPlayer);

        this.laser.triggered = true;
        this.laser.route = route;

        const lastLaserRoutePath = route[route.length - 1];
        this.laser.finalActionType = lastLaserRoutePath.actionType;
        this.laser.finalLocation = lastLaserRoutePath.location;

        if (this.ai.movement) {
            this.ai.movement = null;
        }

        this.selectedPieceLocation = null;
    }

    async computeAIMovement() {
        const newBoard = new Board({squares: this.squares});

        const ai = new AI();
        const movement = await ai.computeMove(newBoard, PlayerTypesEnum.RED);
        this.ai.movement = movement.serialize();

        return this.ai.movement;
    }

    async finishMovement() {
        const newBoard = new Board({squares: this.squares})
        await newBoard.applyLaser(this.currentPlayer)

        const serializedBoard = newBoard.serialize()
        this.winner = serializedBoard.winner
        this.sn = serializedBoard.sn
        this.squares = serializedBoard.squares

        // Check if game over
        if (serializedBoard.winner) {
            // If game is over, then keep the movement locked and show who won in the UI.
            this.status = GameStatusEnum.GAME_OVER
        } else {
            // reset laser
            this.laser.route = []
            this.laser.finalActionType = null
            this.laser.finalLocation = null

            // If game is not over, then pass the turn to the next player
            this.currentPlayer = (this.currentPlayer === PlayerTypesEnum.BLUE) ? PlayerTypesEnum.RED : PlayerTypesEnum.BLUE
        }
    }

    selectPiece(location) {
        const board = new Board({ squares: this.squares });
        const square = board.getSquare(location)
        if (square && square.piece && square.piece.color === "blue") {
            this.selectedPieceLocation = location
            return true;
        }

        return false;
    }

    getMoveForSelectedPiece() {
        if (!this.isPieceSelected()){
            return;
        }
        const board = new Board({ squares: this.squares });
        return board.getMovesForPieceAtLocation(this.selectedPieceLocation);
    }

    checkPieceType(location, type) {
        const board = new Board({ squares: this.squares });
        let square = board.getSquare(location)
        return square.piece.type === type;
    }

    getSelectedPiece() {
        return this.selectedPieceLocation;
    }

    isPieceSelected() {
        return !!this.selectedPieceLocation
    }

    unselectPiece(location) {
        if (!this.isPieceSelected()) return false;

        if (location.rowIndex !== this.selectedPieceLocation.rowIndex ||
            location.colIndex !== this.selectedPieceLocation.colIndex) {
            return false;
        }

        this.selectedPieceLocation = null
        return true;
    }

    getCellOrientation(location) {
        const board = new Board({ squares: this.squares });
        let square = board.getSquare(location)
        return square.piece.orientation;
    }

    lockMovement() {
        this.movementIsLocked = true;
    }

    unlockMovement() {
        this.movementIsLocked = false;
    }

    pause () {
        this.status = GameStatusEnum.PAUSED
    }

    resume() {
        this.status = GameStatusEnum.PLAYING;
    }

    toggleAI() {
        this.ai.enabled = !this.ai.enabled;
    }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}