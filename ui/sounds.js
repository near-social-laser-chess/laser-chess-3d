const loadAudio = (url) => {
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.addEventListener('canplaythrough', () => {
            resolve(audio);
        });
        audio.addEventListener('error', (e) => {
            reject(e);
        });
    });
};

export let soundClick;
loadAudio(BASE_URL + '/assets/sounds/click.mp3').then((audio) => {
    soundClick = audio;
});
export let soundKill;
loadAudio(BASE_URL + '/assets/sounds/kill.mp3').then((audio) => {
    soundKill = audio;
});
export let soundLaser;
loadAudio(BASE_URL + '/assets/sounds/laser.mp3').then((audio) => {
    soundLaser = audio;
});
export let soundLose;
loadAudio(BASE_URL + '/assets/sounds/lose.mp3').then((audio) => {
    soundLose = audio;
});
export let soundMovement;
loadAudio(BASE_URL + '/assets/sounds/movement.mp3').then((audio) => {
    soundMovement = audio;
});
export let soundSwap;
loadAudio(BASE_URL + '/assets/sounds/swap.mp3').then((audio) => {
    soundSwap = audio;
});
export let soundTurn;
loadAudio(BASE_URL + '/assets/sounds/turn.mp3').then((audio) => {
    soundTurn = audio;
});
export let soundWin;
loadAudio(BASE_URL + '/assets/sounds/win.mp3').then((audio) => {
    soundWin = audio;
});


export function playSound(sound) {
    try {
        sound.play();
    } catch (e) {
        console.log(e);
    }
}
