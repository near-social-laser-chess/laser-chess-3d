import {PlayerTypesEnum} from "../game_logic/models/Enums";
import {GameController} from "./GameController";

export class AIGameController extends GameController {
    constructor(userColor = PlayerTypesEnum.BLUE, opponentColor = PlayerTypesEnum.RED, sn = null) {
        super(userColor, opponentColor, sn, "blue", 0);
    }

    async passMoveToOpponent() {
        if (this.checkGameFinished()) return;

        let aiMovement = this.game.computeAIMovement();
        await this.game.applyMovement(aiMovement);

        await this.makeMove(aiMovement);
        await this.finishMove();
        this.checkGameFinished();

        return {}
    }
}