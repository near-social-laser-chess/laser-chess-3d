import {PlayerTypesEnum} from "../game_logic/models/Enums";
import {GameController} from "./GameController";
import Movement from "../game_logic/models/Movement";

export class OnlineGameController extends GameController {
    constructor(userColor = PlayerTypesEnum.BLUE, opponentColor = PlayerTypesEnum.RED, sn = null) {
        super(userColor, opponentColor, sn);
    }

    async passMoveToOpponent() {
    }

    /* data
    {
        "sn": "l++3d++kd++b+++2/2b7/3B+6/b++1B1ss+1b+++1B+/b+++1B+1S+S1b++1B/6b+++3/7B++2/2B+DKD3L",
        "lastMove": {
            "playerColor": "red",
            "type": "special",
            "srcLocation": {
                "colIndex": "2",
                "rowIndex": "3",
            },
            "destLocation": {
                "colIndex": "2",
                "rowIndex": "3",
            }
        },
        "numberOfMoves": "0",
        "player1": {
            "account_id": "test1.testnet",
            "color": "blue",
        },
        "player2": {
            "account_id": "test2.testnet",
            "color": "red",
        },
    }
     */

    async displayOpponentMove(data) {
        const opponentMove = new Movement(data.lastMove.type, data.lastMove.srcLocation, data.lastMove.destLocation);
        await this.game.applyMovement(opponentMove);

        await this.makeMove(opponentMove);
        await this.finishMove();

        this.checkGameFinished();
    }
}
