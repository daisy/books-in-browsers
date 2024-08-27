import { createRange } from "./range.js";

let audio;
let activeCueIdx = -1; 
let activeCueMetadata;
let goingBackwards = false;
let startedPlayback = false;

async function load() {
    audio = document.querySelector("#abinb-audio");
    let track = document.querySelector("#abinb-audio track");
    track.track.addEventListener("cuechange", onCueChange);
    
    audio.addEventListener("play", e => {
        startedPlayback = true;
        document.querySelector("body").classList.add("abinb-playing");
        document.querySelector("#abinb-playpause").setAttribute("title", "Pause");
        document.querySelector("#abinb-playpause").setAttribute("aria-label", "Pause");
    });
    audio.addEventListener("pause", e => {
        document.querySelector("body").classList.remove("abinb-playing");
        document.querySelector("#abinb-playpause").setAttribute("title", "Play");
        document.querySelector("#abinb-playpause").setAttribute("aria-label", "Play");
    });
    audio.addEventListener("ended", e => {
        localStorage.setItem("abinb-autoplay", true);
        let nextSection = document.querySelector("#abinb-next-section");
        if (nextSection) nextSection.click();
    });
    
    // hide the basic html audio player
    if (document.querySelector("#abinb-audio")) {
        document.querySelector("#abinb-audio").style['display'] = 'none';
    }

    window.addEventListener("hashchange", async e => {
        startedPlayback = false; // act like it's a new page load
        let wasPlaying = !audio.paused;
        if (wasPlaying) await audio.pause;
        console.log("hashchange");
        jumpToFragment();
        if (wasPlaying) await audio.play();
    });
}

function onCueChange(e) {
    let track = audio.textTracks[0];
    // console.debug("cue change", e);
    let activeCues = Array.from(e.target.activeCues);
    if (activeCues.length > 0) {
        let activeCue = activeCues[activeCues.length - 1];
        activeCueIdx = Array.from(track.cues).findIndex(cue => cue.id == activeCue.id);
        endCueAction(); // this event also marks the end of the previous cue
        let cueMetadata = JSON.parse(activeCue.text);
        startCueAction(cueMetadata);
    }
}
function startCueAction(cueMetadata) {
    activeCueMetadata = cueMetadata;
    let elm = select(cueMetadata.selector);
    if (elm) {
        if (canPlay(elm)) {
            let range = createRange(cueMetadata.selector);
            let highlight = new Highlight(range);
            CSS.highlights.set("narration", highlight);
            if (!isInViewport(elm, document)) {
                elm.scrollIntoView();
            }
        }
        else {
            if (goingBackwards) {
                goingBackwards = false;
                goPrevious();
            }
            else {
                goNext();
            }
        }
    }
    else {
        console.debug(`Element not found ${cueMetadata.selector}`);
    }
}
function endCueAction() {
    if (!activeCueMetadata) return;
    let elm = select(activeCueMetadata.selector);
    if (elm) {
        // TODO undo highlight? may not be necessary.
    }
}
function select(selector) {
    if (selector.type == "FragmentSelector") {
        return document.querySelector(`#${selector.value}`);
    }
    else if (selector.type == "CssSelector") {
        return document.querySelector(selector.value);
    }
    else return null;
}
function goNext() {
    goingBackwards = false;
    let track = audio.textTracks[0];
    if (activeCueIdx != -1) {
        if (activeCueIdx < track.cues.length - 1) {
            audio.currentTime = track.cues[activeCueIdx + 1].startTime;
        }
    }
}
function goPrevious() {
    goingBackwards = true;
    let track = audio.textTracks[0];
    if (activeCueIdx != -1) {
        if (activeCueIdx > 0) {
            audio.currentTime = track.cues[activeCueIdx - 1].startTime;
        }
    }
}

function canGoNext() {
    return curridx <= syncpoints.length - 2;
}
function canGoPrevious() {
    return curridx > 0;
}
function isInViewport(elm) {
    let bounding = elm.getBoundingClientRect();
    let doc = elm.ownerDocument;
    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <= (doc.defaultView.innerHeight || doc.documentElement.clientHeight) &&
        bounding.right <= (doc.defaultView.innerWidth || doc.documentElement.clientWidth)
    );
}
function canPlay(elm) {
    // true unless this is a pagebreak
    if (elm.classList.contains("epubtype_pagebreak")) {
        return localStorage.getItem("abinb-announce-pagenumbers") == "true";
    }
    return true;
}
// call this when a new page loads
// it searches the cues list for a starting point, based on the document location hash
function jumpToFragment() {
    // only do it if the page is newly loaded
    // caveat and TODO: this doesn't handle in-page jumps 
    if (startedPlayback) return;
    if (document.location.hash == '') return;
    let track = audio.textTracks[0];
    // all the element selectors that we have cues for
    let allSelectors = Array.from(track.cues).map(cue => {
        let cueMetadata = JSON.parse(cue.text);
        return cueMetadata.selector.value;
    });
    let getMatchingCueIdx = elm => allSelectors.findIndex(selector => elm.matches(`#${selector}`));

    let targetElm = document.querySelector(document.location.hash);

    // first see if the target element or any of its descendents have a matching cue
    let matchingCueIdx = getMatchingCueIdx(targetElm);
    if (matchingCueIdx == -1) {
        let descendents = Array.from(targetElm.querySelectorAll("*"));
        for (let elm of descendents) {
            matchingCueIdx = getMatchingCueIdx(elm);
            if (matchingCueIdx != -1) {
                break;
            }
        }
    }
    // if still not found, look up the ancestor tree
    if (matchingCueIdx == -1) {
        let closest = targetElm.closest(allSelectors);
        if (closest) {
            matchingCueIdx = getMatchingCueIdx(closest);
        }
    }
    if (matchingCueIdx == -1) {
        console.log("Warning: matching cue not found");
        /*
        this could happen for something like
        <h1 id="target-elm">The href in the URL bar goes here</h1>
        <p id="cue-point">But this is the nearest narration point</p>
        */
       // so do we do an exhaustive dom search looking for the nearest starting point in this case?
       // or do we just start at the beginning of the file?
        return;
    }
    else {
        // we found a matching cue, now update the audio player's current location to its start time
        activeCueIdx = matchingCueIdx;
        audio.currentTime = track.cues[matchingCueIdx].startTime;
    }
    
}

export { load, audio, goNext, goPrevious, canGoNext, canGoPrevious, jumpToFragment };