import {Game} from 'gameLogic'
import {board} from "uiBoard";
import {getPieceName} from "utils";

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
            let colIndex = square.location.colIndex
            let rowIndex = square.location.rowIndex
            let pieceType = square.location.piece.type
            let pieceColor = square.location.piece.color
            let name = getPieceName(pieceType, pieceColor)
            board.spawn(rowIndex, colIndex, name)
            animate();
        }
    }
}