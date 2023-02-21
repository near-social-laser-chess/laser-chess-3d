import {Game} from '../game_logic/main.js'
import {board} from "../ui/scene.js";
import {
    disableRotateButtons,
    enableRotateButtonClockwise,
    enableRotateButtonCounterClockwise,
    enableRotateButtons
} from "../ui/scene.js";
import {animate} from "../ui/scene.js";
import {getPieceName} from "./utils.js";
import {spawnPiece} from "../ui/spawn.js";
import Location from "../game_logic/models/Location.js";
import Movement from "../game_logic/models/Movement";
import {showWinnerMessage} from "../ui/main";
import {HighlightType} from "../ui/board";
import {PlayerTypesEnum} from "../game_logic/models/Enums";

export class GameController {
    constructor(userColor = PlayerTypesEnum.BLUE, opponentColor = PlayerTypesEnum.RED) {
        this.game = new Game(userColor, opponentColor)
        this.highlightedMoves = []
        this.spawnAllFigures()

        if (userColor === PlayerTypesEnum.RED) {
            this.makeOpponentMove();
        }
    }

    spawnAllFigures() {
        for (let i = 0; i < this.game.squares.length; i++) {
            let square = this.game.squares[i]
            for (let j = 0; j < square.length; j++) {
                let cell = square[j]
                let colIndex = cell.location.colIndex
                let rowIndex = cell.location.rowIndex
                if (!cell.piece) continue
                let pieceType = cell.piece.type
                let pieceColor = cell.piece.color
                let name = getPieceName(pieceType, pieceColor)

                spawnPiece(name, rowIndex, colIndex, cell.piece.orientation)
            }
        }

        animate();
    }

    async clickOnBoard(cell) {
        if (this.game.movementIsLocked || this.game.isGameFinished()) return;

        this.game.lockMovement();
        const isUserMakeMove = await this.makeUserMove(cell);
        if (!isUserMakeMove) {
            this.game.unlockMovement();
            return;
        }

        await this.makeOpponentMove();
        this.game.unlockMovement();
    }

    checkGameFinished() {
        if (this.game.isGameFinished()) {
            if (this.game.getWinner() === "red")
                showWinnerMessage("You lose!", "Reload page to restart.")
            else if (this.game.getWinner() === "blue")
                showWinnerMessage("You win!", "Reload page to restart.")

            return true;
        }

        return false;
    }

    async makeUserMove(cell) {
        const location = new Location(cell.col, cell.row)

        const move = this.findHighlightedMove(location)
        if (!move) {
            if (this.selectPiece(location)) return false;
            this.unselectPiece(location);
            return false;
        }

        this.unhighlightAllCells();
        await this.game.applyMovement(move);
        await this.makeMove(move)
        await this.finishMove();

        return true;
    }

    selectPiece(location) {
        if (!this.game.selectPiece(location)) {
            return false;
        }

        this.unhighlightAllCells();
        const moves = this.game.getMoveForSelectedPiece();

        board.highlightCell(location.rowIndex, location.colIndex, HighlightType.current)
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].type === "special") {
                board.highlightCell(moves[i].destLocation.rowIndex, moves[i].destLocation.colIndex, HighlightType.swap)
            } else {
                board.highlightCell(moves[i].destLocation.rowIndex, moves[i].destLocation.colIndex)
            }
        }
        this.highlightedMoves = moves;

        if (this.game.checkPieceType(location, "l")) {
            const laserOrientation = this.game.getCellOrientation(location);
            if (laserOrientation === 0) {
                enableRotateButtonCounterClockwise()
            } else {
                enableRotateButtonClockwise();
            }
        } else if (!this.game.checkPieceType(location, "k")) {
            enableRotateButtons();
        }

        return true;
    }

    unhighlightAllCells() {
        board.unhighlightAllCells();
        this.highlightedMoves = [];
        disableRotateButtons()
    }

    unselectPiece() {
        if (!this.game.unselectPiece()) return;
        this.unhighlightAllCells();
    }

    findHighlightedMove(location) {
        for (let i = 0; i < this.highlightedMoves.length; i++) {
            const move = this.highlightedMoves[i];
            if (location.rowIndex === move.destLocation.rowIndex &&
                location.colIndex === move.destLocation.colIndex) {
                return move;
            }
        }

        return null;
    }

    async makeMove(move) {
        const srcCell = board.findCell(move.srcLocation.rowIndex, move.srcLocation.colIndex);
        const destCell = board.findCell(move.destLocation.rowIndex, move.destLocation.colIndex);

        if (move.type === "special") {
            return await board.swapPieces(srcCell, destCell)
        } else if (move.type === "clockwise_rotation") {
            return await board.rotatePiece(srcCell, 90);
        } else if (move.type === "c_clockwise_rotation") {
            return await board.rotatePiece(srcCell, -90);
        }
        return await board.movePiece(srcCell, destCell)
    }

    async finishMove() {
        let laser = this.game.getLaser();
        await this.displayLaser(laser)
        await this.game.finishMovement();
    }

    async displayLaser(laser) {
        let laserPath = this.convertLaserPath(laser);
        if (laser.finalActionType === "kill") {
            return await board.drawLaserPathWithKill(laserPath);
        }
        return await board.drawLaserPath(laserPath);
    }

    convertLaserPath(laser) {
        if (!laser || !laser.route || laser.route.length === 0) return [];

        let laserPath = []
        for (let i = 1; i < laser.route.length; i++) {
            const startRow = laser.route[i - 1].location.rowIndex;
            const startCol = laser.route[i - 1].location.colIndex;

            const endRow = laser.route[i].location.rowIndex;
            const endCol = laser.route[i].location.colIndex;

            const startCell = board.findCell(startRow, startCol);
            const endCell = board.findCell(endRow, endCol);

            laserPath.push({
                startCell,
                endCell,
            })
        }

        return laserPath;
    }

    async makeOpponentMove() {
    }

    async rotatePiece(rotateType) {
        if (this.game.movementIsLocked || this.game.isGameFinished()) return;
        this.game.lockMovement();

        const selectedPieceLocation = this.game.getSelectedPiece();
        if (!selectedPieceLocation) {
            this.game.unlockMovement();
            return;
        }
        this.unhighlightAllCells();

        const move = new Movement(rotateType, selectedPieceLocation, selectedPieceLocation)
        await this.game.applyMovement(move);
        await this.makeMove(move);
        await this.finishMove();

        await this.makeOpponentMove();
        this.game.unlockMovement();
    }
}
