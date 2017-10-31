/*
    inject.js
    
    This file is injected at "document_end" via the extension's manifes.json file's
    "content_scripts" object. Once injected, the function 'inject' (below) is called 
    which does the magic of reading the current page's document's innerHTML and 
    creating an iframe with this content, prepending the custom 'WatchDog.js' 
    (compressed) content. This serves to 'watch' any changes made to the page's 
    window/document objects and/or any calls made to the page's window/document 
    objects' member functions.
*/

function inject() {
    // Hide the iframe from user view
    var setHiddenStyle = function(newFrame) {
        newFrame.style.position = "fixed";
        newFrame.style.left = "-10px;";
        newFrame.style.top = "-10px";
        newFrame.style.width = "1px";
        newFrame.style.height = "1px";
        newFrame.style.opacity = "0.0";
        newFrame.style.filter = "opacity(0)";
    };
    
    // function to create an iframe and write its content directly
    var newIframeWithContent = function(content) {
        // Creates the new iframe, add the iframe where you want
        var newFrame = document.createElement("iframe");
        setHiddenStyle(newFrame);
        document.body.appendChild(newFrame); 
        
        // We need the iframe document object, different browsers different ways
        var frameDocument = newFrame.document;
        
        if (newFrame.contentDocument)
            frameDocument = newFrame.contentDocument;
        else if (newFrame.contentWindow)
            frameDocument = newFrame.contentWindow.document;
        
        // We open the document of the empty frame and we write desired content.
        // originalHtmlContent is a string where you have the source iframe HTML content.
        frameDocument.open();
        frameDocument.writeln(content);
        frameDocument.close();
        
        return newFrame;
    };
    
        
    var content = document.documentElement.innerHTML;
    
    iframe = newIframeWithContent("<script>function ___stringy(_){var t=[];return JSON.stringify(_,function(_,r){if('object'==typeof r&&null!==r){if(-1!==t.indexOf(r))return;t.push(r)}return r})}function ___addToWatchList(_,t){if('string'==typeof _&&(0===_.indexOf('___')||'self'==_||'frames'==_||'window'==_||'parent'==_||'top'==_||'chrome'==_))return!1;'function'==typeof t[_]&&(___proxs[_.toString()]=t[_],t[_]=function(){return ___functionIntercept(_.toString(),arguments),___proxs[_.toString()].apply(t,arguments)});try{return ___props[_]=___stringy(t[_]),!0}catch(_){return console.error(_.message),!1}}function ___startTrace(_){___watchOn=!0;for(var t in _)___addToWatchList(t.toString(),_);!function t(){for(var r in _)if(___props.hasOwnProperty(r)){if(___props[r]&&void 0!==___props[r]&&___props[r]!==___stringy(_[r])){var n=JSON.parse(___props[r]);___propertyIntercept(r,n,_[r]),___props[r]=___stringy(_[r])}}else ___addToWatchList(r.toString(),_)&&___propertyIntercept(r,void 0,_[r]);___watchOn&&___setTimeout(t,___delay)}()}function ___stopTrace(){___watchOn=!1}function ___showTrace(){for(var _ in ___trace)console.log('STEP '+_,___trace[_])}var ___props={},___proxs={},___propertyTrace=[],___functionTrace=[],___trace=[],___watchOn=!0,___delay=100,___propertyIntercept=function(_,t,r){var n={property:_,oldValue:t,newValue:r};___propertyTrace.push(n),___trace.push(n);console.log(n)},___functionIntercept=function(_,t){var r={function:_,arguments:t};___functionTrace.push(r),___trace.push(r);console.log(r)},___setTimeout=setTimeout,___sendInterval,___setInterval=setInterval,___clearInterval=clearInterval;___startTrace(window);___startTrace(document);</script>" + content);
    
    var iframeLoadStart = function() {
        // For verification...
        console.log("iframeLoadStart ('load') event fired " +
            "from location.reload() triggered.");
    };
    
    var iframeLoadEnd = function() {
        // (NOT)TODO: remove iframe? Probably a bad idea as scripts can 
        // still run in background, etc.
        // This function is simply called after all the CSS/Images/etc. 
        // have been loaded inside the iframe.
    };
    
    iframe.addEventListener("load", iframeLoadStart, true);
    iframe.onload = iframeLoadEnd; //iframe is finished loading...
}

inject(); //Let's do this