const winnerMessage = document.querySelector("div[aria-label='winner message']");
const winnerMessageHeader = document.querySelector("#winner-message__header");
const winnerMessageInfo = document.querySelector("#winner-message__info");

export const showWinnerMessage = (header, info) => {
    winnerMessageHeader.innerHTML = header;
    winnerMessageInfo.innerHTML = info;
    winnerMessage.style.visibility = "visible";
}

export const hideWinnerMessage = () => {
    winnerMessage.style.visibility = "hidden";
}
