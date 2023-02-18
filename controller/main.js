import {Game} from '../game_logic/main.js'
import {board} from "../ui/board.js";
import {animate} from "../ui/scene.js";
import {getPieceName} from "./utils.js";
import {spawnPiece} from "../ui/spawn.js";
import Location from "../game_logic/models/Location.js";

export class GameController {
    constructor(board) {
        this.board = board
        this.game = new Game()

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

    clickOnBoard(cell) {
        const cellLocation = new Location(cell.col, cell.row)

        if (!this.game.isPieceSelected()) {
            this.selectPiece(cellLocation)
        }
    }

    selectPiece(location) {
        this.game.selectPiece(location)
        const moves = this.game.getMoveForSelectedPiece()
        if (moves.length === 0) return;

        for (let i = 0; i < moves.length; i++) {

        }
    }
}