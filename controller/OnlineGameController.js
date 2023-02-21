import {PlayerTypesEnum} from "../game_logic/models/Enums";
import {GameController} from "./GameController";

export class OnlineGameController extends GameController {
    constructor(userColor = PlayerTypesEnum.BLUE, opponentColor = PlayerTypesEnum.RED) {
        super(userColor, opponentColor);
    }

    async makeOpponentMove() {
        console.log("child")
        this.game.userColor = this.game.currentPlayer;
    }
}
