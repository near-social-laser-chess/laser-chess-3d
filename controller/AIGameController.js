import {GameController} from "./GameController";

export class AIGameController extends GameController {
    constructor(sn = null) {
        super(sn);
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