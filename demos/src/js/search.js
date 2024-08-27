import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.4.6/dist/fuse.esm.js'
import { createRange } from './range.js';

async function initSearchPanel(searchPanel, searchIndexUrl, searchDataUrl) {
    searchPanel.innerHTML = 
    `<div>
        <label for="abinb-search">Search</label>
        <input type="search" id="abinb-search-text" placeholder="Search"></input>
        <input type="button" id="abinb-search-button" value="Search"></input>
    </div>
    <section aria-label="Search results" id="abinb-search-results" aria-live="polite">
    </section>`;

    let fuse = await initSearchEngine(searchIndexUrl, searchDataUrl);
    
    let performSearch = async e => {
        let searchText = searchPanel.querySelector("#abinb-search-text").value;
        if (searchText.trim() != '') {
            let result = fuse.search(searchText);
            presentSearchResults(result);
        }
    };
    searchPanel.querySelector("#abinb-search-button").addEventListener("click", performSearch);
    searchPanel.querySelector("#abinb-search-text").addEventListener("keydown", async e => {
        if (e.code == "Enter") {
            await performSearch();
        }
    });
}

function highlightInPageSearchResult(selector) {
    let elm = document.querySelector(selector);
    if (elm) {
        let range = createRange({type: "CssSelector", value: selector});
        let highlight = new Highlight(range);
        CSS.highlights.set("searchresult", highlight);
        elm.scrollIntoView();
        elm.setAttribute("role", "mark");
    }
}

function clearInPageSearchResults() {
    let marks = Array.from(document.querySelectorAll("[role=mark]"));
    marks.map(mark => {
        let attrval = mark.getAttribute("role");
        attrval = attrval.replace('mark', '');
        mark.setAttribute("role", attrval);
    });
    CSS.highlights.delete("searchresult");
}


function presentSearchResults(results) {
    // clear any old results
    let resultsElm = document.querySelector("#abinb-search-results");
    resultsElm.innerHTML = '';
    
    clearInPageSearchResults();
    
    resultsElm = document.querySelector("#abinb-search-results");
    
    resultsElm.innerHTML = 
    `<p>${results.length} results</p>
    <table summary="Search results, ranked by best match">
        <thead>
            <tr>
                <th>Rank</th>
                <th>Result</th>
                <th>Chapter</th>
            </tr>
        </thead>
        <tbody>
        ${results.map((result, idx) => 
            `<tr>
                <td>${idx+1}</td>
                <td><a href="${result.item.filename}" data-selector="${result.item.selector}">${result.item.text}</a></td>
                <td>${result.item.filetitle}</td>
            </tr>`)
        .join('')}
        </tbody>
    </table>`;
    
    let resultsLinks = Array.from(resultsElm.querySelectorAll("table td a[data-selector]"));
    resultsLinks.map(link => link.addEventListener("click", e => localStorage.setItem("abinb-target", link.getAttribute("data-selector"))));
    document.querySelector("#abinb-search").appendChild(resultsElm);
}

async function initSearchEngine(searchIndexUrl, searchDataUrl) {
    let idxFile = await fetch(searchIndexUrl);
    idxFile = await idxFile.text();
    let idx = Fuse.parseIndex(JSON.parse(idxFile));
    let dataFile = await fetch(searchDataUrl);
    let data = await dataFile.text();
    data = JSON.parse(data);
    const options = {
        includeScore: true,
        keys: ['text'],
        threshold: 0.4
    };
    let fuse = new Fuse(data, options, idx);
    return fuse;
}


export { highlightInPageSearchResult, clearInPageSearchResults, initSearchPanel };