import { createNavToolbar  } from './toolbars/nav.js';
import { setupKeyboardShortcuts } from './keyboard.js';
import { createPlaybackToolbar } from './toolbars/playback.js';
import { createApplicationToolbar } from './toolbars/application.js';
import { createNavPanelContents } from './panels/nav.js';
import { createSettingsPanelContents } from './panels/settings.js';
import { highlightInPageSearchResult } from './search.js';
import * as player from './player.js';

async function setupUi(searchIndexUrl, searchDataUrl) {
    initState();
    // collect data before these elements get replaced
    let aboutUrl = new URL(document.querySelector("#abinb-about-link").getAttribute("href"), document.location);
    let navUrl = new URL(document.querySelector("#abinb-toc-link").getAttribute("href"), document.location);

    createNavToolbar();
    await createNavPanelContents(navUrl, aboutUrl, searchIndexUrl, searchDataUrl);
    
    let hasSyncAudio = false;
    if (document.querySelector("#abinb-audio")) {
        hasSyncAudio = true;
        createPlaybackToolbar();
        player.load();
    }
    createApplicationToolbar('../src/help');
    createSettingsPanelContents(hasSyncAudio);
    setupKeyboardShortcuts();

    let nextSection = document.querySelector("#abinb-next-section");
    let prevSection = document.querySelector("#abinb-previous-section")
    if (nextSection) {
        nextSection.addEventListener("click", async e => {
            document.querySelector("body").classList.add("abinb-fadeout");
        });
    }
    if (prevSection) {
        prevSection.addEventListener("click", async e => {
            document.querySelector("body").classList.add("abinb-fadeout");
        });
    }

    // make it visible before doing any visual stuff
    document.documentElement.classList.remove("abinb-js");
    document.querySelector("body").classList.add("abinb-fadein");

    // this page may have loaded with a search result target in mind, if so highlight it
    if (localStorage.getItem("abinb-target")) { 
        highlightInPageSearchResult(localStorage.getItem("abinb-target"));
        localStorage.setItem("abinb-target", null);
    }
    
    if (localStorage.getItem("abinb-autoplay") == "true") {
        console.log("autoplay: yes");
        localStorage.setItem("abinb-autoplay", false);
        let audio = document.querySelector("#abinb-audio");
        if (audio) audio.autoplay = true;
    }
    else {
        console.log("autoplay: no");
    }
}


function initState() {
    if (localStorage.getItem("abinb-size") == null) {
        localStorage.setItem("abinb-size", "100");
    }
    if (localStorage.getItem("abinb-rate") == null) {
        localStorage.setItem("abinb-rate", "100");
    }
    if (localStorage.getItem("abinb-volume") == null) {
        localStorage.setItem("abinb-volume", 100);
    }
    if (localStorage.getItem("abinb-announce-pagenumbers") == null) {
        localStorage.setItem("abinb-announce-pagenumbers", true);
    }
}

// for the future
function trackScrollInLocationUrl() {
    let options = {
        root: document.querySelector('main'),
        rootMargin: '0px',
        threshold: .5
    }
    let callback = (entries, observer) => {
        entries.forEach(entry => {
          // Each entry describes an intersection change for one observed
          // target element:
          //   entry.boundingClientRect
          //   entry.intersectionRatio
          //   entry.intersectionRect
          //   entry.isIntersecting
          //   entry.rootBounds
          //   entry.target
          //   entry.time
          if (entry.isIntersecting) {
            //   history.pushState({}, document.title, new Url(entry.target.id, location.href));
          }
        });
      };
    
    let observer = new IntersectionObserver(callback, options);
    let elmsWithId = Array.from(document.querySelectorAll("main *[id]"));
    elmsWithId.map(elm => observer.observe(elm));
}

export { setupUi };