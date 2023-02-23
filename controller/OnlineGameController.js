import {PlayerTypesEnum} from "../game_logic/models/Enums";
import {GameController} from "./GameController";
import Movement from "../game_logic/models/Movement";

export class OnlineGameController extends GameController {
    constructor(userColor = PlayerTypesEnum.BLUE, opponentColor = {
        opponentColor: PlayerTypesEnum.RED,
        opponentId: ""
    }, currentPlayer = PlayerTypesEnum.BLUE, sn = null, numberOfMoves = 0) {
        super(userColor, opponentColor, currentPlayer, sn, numberOfMoves);
    }

    async passMoveToOpponent() {
        const type = this.game.lastMove.type;
        const srcLocation = this.game.lastMove.srcLocation;
        const destLocation = this.game.lastMove.destLocation;
        const lastMove = {
            type,
            srcLocation,
            destLocation,
        }
        const sn = this.game.sn;
        const numberOfMoves = this.game.numberOfMoves;
        const userColor = this.game.userColor;
        const opponent = this.game.opponent;

        return {
            sn,
            lastMove,
            numberOfMoves,
            userColor,
            opponent,
        }
    }

    /* data
    {
        "sn": "l++3d++kd++b+++2/2b7/3B+6/b++1B1ss+1b+++1B+/b+++1B+1S+S1b++1B/6b+++3/7B++2/2B+DKD3L",
        "lastMove": {
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
        "userColor": "blue",
        "opponent": {
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

    async displayUserMove(data) {

    }
}
