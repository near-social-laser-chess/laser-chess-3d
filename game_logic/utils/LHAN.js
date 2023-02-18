import { LaserActionTypesEnum } from "../models/Enums.js";
import * as THREE from 'three';

/**
 * Laser Hit Action Notation
 * represents the action taken by the laser when it hits a particular piece at any given orientation
 */
class LHAN {

    /**
     * Get the laser beam hit action on the piece from the current direction.
     *
     * @param {LaserDirectionsEnum} currentDirection The direction from where the laser beam is coming to hit the piece.
     * @param {Piece} piece The piece you want the hit action of from the currentDirection.
     *
     * @returns {object} { actionType: LaserActionTypesEnum, newDirection LaserDirectionsEnum | null }
     */
    static async getHitAction(currentDirection, piece) {
        const orientation = piece.orientation;
        const type = piece.type;

        const request = await fetch(`${BASE_URL}/assets/laser-v-piece.json`);
        const json = await request.json();
        const objLoader = new THREE.ObjectLoader();
        const lhan_relations_json = objLoader.parse(json );
        const hitAction = lhan_relations_json[currentDirection][type][orientation];
        if (hitAction === "kill" || hitAction === "nothing") {
            return {
                type: hitAction,
                newDirection: null
            };
        } else {
            return {
                type: LaserActionTypesEnum.DEFLECT,
                newDirection: hitAction
            };
        }
    }
}

export default LHAN;