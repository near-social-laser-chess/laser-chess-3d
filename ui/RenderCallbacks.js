import {RenderCallback} from "./scene.js";
import * as THREE from "three";

export class SwapPiecesRenderCallback extends RenderCallback {
    // Firsty pieceObj1 is moved up on it's height, then it is moved to the position of pieceObj2,
    // then pieceObj2 is moved on starting position of pieceObj1 and finally pieceObj1 moved down on it's height
    State = {
        FirstPieceUp: "firstPieceUp",
        FirstPieceMove: "firstPieceMove",
        SecondPieceMove: "secondPieceMove",
        FirstPieceDown: "secondPieceDown",
    }

    constructor(pieceObj1, pieceObj2, interval = 0.05, callback = null) {
        super();
        this.pieceObj1 = pieceObj1;
        this.pieceObj2 = pieceObj2;
        this.interval = interval;
        this.callback = callback;
        this.state = this.State.FirstPieceUp;

        this.firstPieceUpEndCoord = new THREE.Vector3(this.pieceObj1.position.x, 1, this.pieceObj1.position.z);
        this.firstPieceMoveEndCoord = new THREE.Vector3(
            this.pieceObj2.position.x,
            this.firstPieceUpEndCoord.y,
            this.pieceObj2.position.z);
        this.secondPieceMoveEndCoord = this.pieceObj1.position.clone();
        this.firstPieceDownEndCoord = this.pieceObj2.position.clone();

        // calculate movement vectors
        this.firstPieceUpMovement = new THREE.Vector3(0, interval, 0);
        let diff = this.pieceObj2.position.clone().sub(this.pieceObj1.position);
        this.firstPieceMoveMovement = new THREE.Vector3(diff.x * this.interval, 0, diff.z * this.interval);
        diff = this.pieceObj1.position.clone().sub(this.pieceObj2.position);
        this.secondPieceMoveMovement = new THREE.Vector3(diff.x * this.interval, 0, diff.z * this.interval);
        this.firstPieceDownMovement = new THREE.Vector3(0, -interval, 0);
    }

    draw() {
        switch (this.state) {
            case this.State.FirstPieceUp:
                if (this.pieceObj1.position.y >= this.firstPieceUpEndCoord.y) {
                    this.pieceObj1.position.copy(this.firstPieceUpEndCoord);
                    this.state = this.State.FirstPieceMove;
                } else {
                    this.pieceObj1.position.add(this.firstPieceUpMovement);
                }
                break;
            case this.State.FirstPieceMove:
                if (this.pieceObj1.position.distanceTo(this.firstPieceMoveEndCoord) <= this.interval) {
                    this.pieceObj1.position.copy(this.firstPieceMoveEndCoord);
                    this.state = this.State.SecondPieceMove;
                } else {
                    this.pieceObj1.position.add(this.firstPieceMoveMovement);
                }
                break;
            case this.State.SecondPieceMove:
                if (this.pieceObj2.position.distanceTo(this.secondPieceMoveEndCoord) <= this.interval) {
                    this.pieceObj2.position.copy(this.secondPieceMoveEndCoord);
                    this.state = this.State.FirstPieceDown;
                } else {
                    this.pieceObj2.position.add(this.secondPieceMoveMovement);
                }
                break;
            case this.State.FirstPieceDown:
                if (this.pieceObj1.position.y <= this.firstPieceDownEndCoord.y) {
                    this.pieceObj1.position.copy(this.firstPieceDownEndCoord);
                    this.isDrawn = true;
                    if (this.callback instanceof Function)
                        this.callback();
                } else {
                    this.pieceObj1.position.add(this.firstPieceDownMovement);
                }
                break;
        }
    }

}

export class RotatePieceRenderCallback extends RenderCallback {
    constructor(pieceObj, angle, interval = 0.05, callback = null) {
        // angle in degrees. negative is counterclockwise, positive is clockwise
        super();
        this.callback = callback;
        this.pieceObj = pieceObj;
        angle = angle / 180 * Math.PI * -1;
        this.angle = angle;
        this.endAngle = this.pieceObj.rotation.y + angle;
        if (angle < 0)
            if (this.pieceObj.rotation.y === 0)
                this.endAngle = Math.PI * 2 - this.pieceObj.rotation.y + angle;
            else
                this.endAngle = this.pieceObj.rotation.y + angle;
        this.interval = interval;
        this.movement = angle * this.interval;
    }

    draw() {
        if (Math.abs(this.pieceObj.rotation.y - this.endAngle) <= this.interval || Math.abs(Math.PI * 2 + this.pieceObj.rotation.y - this.endAngle) <= this.interval) {
            this.pieceObj.rotation.y = this.endAngle;
            this.isDrawn = true;
            if (this.angle > 0 && this.pieceObj.rotation.y >= Math.PI * 2) {
                this.pieceObj.rotation.y = 0;
            }
            if (this.callback instanceof Function)
                this.callback();
            return;
        }
        this.pieceObj.rotation.y += this.movement;
    }
}

export class MoveObjectRenderCallback extends RenderCallback {
    constructor(pieceObj, endCoord, interval = 0.05, callback = null) {
        super();
        this.callback = callback;
        this.pieceObj = pieceObj;
        this.startCoord = pieceObj.position;
        this.endCoord = endCoord;
        this.interval = interval;

        const diff = this.endCoord.clone().sub(this.startCoord);
        this.movement = new THREE.Vector3(diff.x * this.interval, diff.y, diff.z * this.interval);
    }

    draw() {
        if (this.startCoord.distanceTo(this.endCoord) <= this.interval) {
            this.pieceObj.position.copy(this.endCoord)
            this.isDrawn = true;
            if (this.callback instanceof Function)
                this.callback();
            return;
        }
        this.pieceObj.position.add(this.movement)
    }
}


export class KillPieceRenderCallback extends RenderCallback {
    constructor(pieceObj, animationTime = 2000, callback = null) {
        super();
        this.callback = callback;
        this.animationTime = animationTime;
        this.pieceObj = pieceObj;
        this.framesCounter = 0;
        this.animationFrames = this.animationTime / 1000 * 60;
        this.child = pieceObj.children[0];
        this.initialMaterials = this.child.material;
        this.redMaterials = [];
        for (let i = 0; i < this.initialMaterials.length; i++) {
            const material = new THREE.MeshBasicMaterial({color: 0xff0000,
                name: this.initialMaterials[i].name, side: THREE.DoubleSide});
            this.redMaterials.push(material);
        }
        this.currentMaterial = this.initialMaterials;
        this.currentStep = 0;
    }

    switchMaterial(currentStep) {
        if (this.currentStep === currentStep) {
            return;
        }
        if (this.currentMaterial === this.initialMaterials) {
            this.child.material = this.redMaterials;
            this.currentMaterial = this.redMaterials;
        }
        else {
            this.child.material = this.initialMaterials;
            this.currentMaterial = this.initialMaterials;
        }
        this.currentStep = currentStep;
    }

    draw() {
        this.framesCounter++;
        if (this.framesCounter / this.animationFrames < 0.2)
            this.switchMaterial(0.2);
        else if (this.framesCounter / this.animationFrames < 0.4)
            this.switchMaterial(0.4);
        else if (this.framesCounter / this.animationFrames < 0.5)
            this.switchMaterial(0.5);
        else if (this.framesCounter / this.animationFrames < 0.6)
            this.switchMaterial(0.6);
        else if (this.framesCounter / this.animationFrames < 0.7)
            this.switchMaterial(0.7);
        else if (this.framesCounter / this.animationFrames < 0.8)
            this.switchMaterial(0.8);
        else if (this.framesCounter / this.animationFrames < 0.85)
            this.switchMaterial(0.85);
        else if (this.framesCounter / this.animationFrames < 0.9)
            this.switchMaterial(0.9);
        else if (this.framesCounter / this.animationFrames < 0.95)
            this.switchMaterial(0.95);
        else if (this.framesCounter / this.animationFrames < 1)
            this.switchMaterial(1);
        else {
            this.isDrawn = true;
            if (this.callback instanceof Function)
                this.callback();
        }
    }
}
