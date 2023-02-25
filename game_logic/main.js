import {GameStatusEnum, PlayerTypesEnum} from "./models/Enums.js";
import Board from "./models/Board.js";
import AI from "./utils/ai/AI.js";

export class Game {
    constructor(userColor, opponentColor, currentPlayer, sn, numberOfMoves) {
        this.currentPlayer = currentPlayer
        this.userColor = userColor
        this.opponentColor  = opponentColor
        this.numberOfMoves = numberOfMoves
        this.status = GameStatusEnum.PLAYING
        this.selectedPieceLocation = null
        this.movementIsLocked = false
        this.lastMove = null

        this.ai = {
            movement: null
        }

        this.laser = {
            route: [],
            finalLocation: null,
            finalActionType: null
        }

        this.setBoardType(sn)
    }

    getWinner() {
        return this.winner;
    }

    isGameFinished() {
        return this.status === GameStatusEnum.GAME_OVER;
    }

    setBoardType(sn) {
        let newBoard = new Board({setupNotation: sn}).serialize();
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
        console.log(this.currentPlayer)
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
        this.lastMove = movement;
    }

    computeAIMovement() {
        const newBoard = new Board({squares: this.squares});
        const ai = new AI();
        const movement = ai.computeMove(newBoard, this.opponentColor);
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
        this.numberOfMoves += 1
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
        if (this.selectedPieceLocation !== null && location.an === this.selectedPieceLocation.an) return false;
        const board = new Board({ squares: this.squares });
        const square = board.getSquare(location)
        if (square && square.piece && square.piece.color === this.userColor) {
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

    unselectPiece() {
        if (!this.isPieceSelected()) return false;

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
}