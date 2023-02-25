import {initCells, initHighlightMaterials} from "./board";
import {enableRotateButtonCounterClockwise, disableRotateButtons, enableRotateButtonClockwise, initScene} from "./scene";
import {board} from "./board";

const winnerMessage = document.querySelector("div[aria-label='winner message']");
const winnerMessageHeader = document.querySelector("#winner-message__header");
const winnerMessageInfo = document.querySelector("#winner-message__info");

export const showWinnerMessage = (header) => {
    winnerMessageHeader.innerHTML = header;
    winnerMessage.style.visibility = "visible";
}

export const hideWinnerMessage = () => {
    winnerMessage.style.visibility = "hidden";
}

export const initUI = async () => {
    initHighlightMaterials();
    initCells();
    await initScene();
}
