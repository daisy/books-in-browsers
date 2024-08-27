// Supports FragmentSelector and CssSelector optionally with TextPositionSelector as its refinedBy
function createRange(selector) {
    let sel = selector.type == "FragmentSelector" ? 
        `#${selector.value}` : selector.value;
    let node = document.querySelector(sel);
    let startOffset = 0;
    let endOffset = 0;
    if (selector.hasOwnProperty('refinedBy')) {
        startOffset = rangeSelector.refinedBy.start;
        endOffset = rangeSelector.refinedBy.end;
        
        return new StaticRange({
            startContainer: node.firstChild,
            startOffset,
            endContainer: node.firstChild,
            endOffset: endOffset + 1
        });
    }
    
    return new StaticRange({
        startContainer: node,
        startOffset: 0,
        endContainer: node.nextSibling,
        endOffset: 0
    });
}

export { createRange };