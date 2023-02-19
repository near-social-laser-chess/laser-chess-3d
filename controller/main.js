import {Game} from '../game_logic/main.js'
import {board} from "../ui/board.js";
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

export class GameController {
    constructor(board) {
        this.board = board
        this.game = new Game()
        this.highlightedMoves = []

        this.spawnAllFigures()
    }

    spawnAllFigures() {
        board.drawCells();

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
        if (this.game.movementIsLocked) return;
        const isUserMakeMove = await this.makeUserMove(cell);
        if (!isUserMakeMove) return;
        await this.makeAIMove();

        const winner = this.game.getWinner();
        console.log(winner);
    }

    async makeUserMove(cell) {
        const location = new Location(cell.col, cell.row)

        if (this.unselectPiece(location)) return false;
        if (this.selectPiece(location)) return false;

        const move = this.findHighlightedMove(location)
        if (!move) return false;

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

        for (let i = 0; i < moves.length; i++) {
            board.highlightCell(moves[i].destLocation.rowIndex, moves[i].destLocation.colIndex)
        }
        this.highlightedMoves = moves;

        if (this.game.checkPieceType(location, "l")) {
            const laserOrientation = this.game.getCellOrientation(location);
            console.log(laserOrientation)
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

    unselectPiece(location) {
        if (!this.game.unselectPiece(location)) return false;
        this.unhighlightAllCells();
        return true;
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
            if (startRow < 0 || startRow > 7 || startCol < 0 || startCol > 9) return laserPath;

            const endRow = laser.route[i].location.rowIndex;
            const endCol = laser.route[i].location.colIndex;
            if (endRow < 0 || endRow > 7 || endCol < 0 || endCol > 9) return laserPath;

            const startCell = board.findCell(startRow, startCol);
            const endCell = board.findCell(endRow, endCol);

            laserPath.push({
                startCell,
                endCell,
            })
        }

        return laserPath;
    }

    async makeAIMove() {
        let aiMovement = this.game.computeAIMovement();
        await this.game.applyMovement(aiMovement);

        await this.makeMove(aiMovement);
        await this.finishMove();
    }

    async rotatePiece(rotateType) {
        const selectedPieceLocation = this.game.getSelectedPiece();
        if (!selectedPieceLocation) return;
        this.unhighlightAllCells();

        const move = new Movement(rotateType, selectedPieceLocation, selectedPieceLocation)
        await this.game.applyMovement(move);
        await this.makeMove(move);
        await this.finishMove();
        await this.makeAIMove();
    }
}