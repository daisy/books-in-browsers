import * as icons from '../icons.js';
import * as player from '../player.js';

// volume, prev phrase, play pause, next phrase
function createPlaybackToolbar() {
    let toolbar = document.querySelector("#abinb-playback-toolbar");
    toolbar.innerHTML = toolbar.innerHTML + 
    `<button id="abinb-previous-phrase"
        type="button"
        class="abinb-lightup"
        aria-label="Previous phrase"
        title="Previous phrase">
        ${icons.prevPhrase}
    </button>
    <button id="abinb-playpause"
        type="button" 
        class="abinb-lightup"
        aria-label="Play"
        title="Play">
        ${icons.play}
        ${icons.pause}
    </button>
    <button id="abinb-next-phrase"
        type="button"
        class="abinb-lightup"
        aria-label="Next phrase"
        title="Next phrase">
        ${icons.nextPhrase}
    </button>
    <input id="abinb-volume"
        aria-label="Volume" 
        title="volume"
        class="abinb-lightup"
        type="range"  
        min="0" 
        max="100" 
        value="90" 
        step="5">
    </input>`;

    toolbar.querySelector("#abinb-playpause").addEventListener("click", e => {
        let audio = document.querySelector("#abinb-audio");
        if (!audio.paused) {
            audio.pause();
        }
        else {
            try {
                player.jumpToFragment();
                audio.play();
            }
            catch(err) {
                console.error("Play() failed");
            }
        }
    });

    toolbar.querySelector("#abinb-previous-phrase").addEventListener("click", e => {
        player.goPrevious();
    });

    toolbar.querySelector("#abinb-next-phrase").addEventListener("click", e => {
        player.goNext();
    });

    let volumeRange = document.querySelector("#abinb-volume");
    let setVolume = (volume, player) => {
        localStorage.setItem("abinb-volume", volume);
        let audio = document.querySelector("#abinb-audio");
        audio.volume = volume/100;
        volumeRange.value = volume;
    };

    let volume = localStorage.getItem("abinb-volume");
    setVolume(volume, player);
    volumeRange.addEventListener("input", e => {
        setVolume(e.target.value, player);
    });

    let audio = document.querySelector("#abinb-audio");
    audio.addEventListener("play", e => {
        document.querySelector("#abinb-playpause").setAttribute("title", "Pause");
        document.querySelector("#abinb-playpause").setAttribute("aria-label", "Pause");
    });
    audio.addEventListener("pause", e => {
        document.querySelector("#abinb-playpause").setAttribute("title", "Play");
        document.querySelector("#abinb-playpause").setAttribute("aria-label", "Play");
    });
}


export { createPlaybackToolbar };