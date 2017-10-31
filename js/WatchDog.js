/*
    WatchDog.js
    
    This file is gives the ability to hook any object (window/document
    are used in this scenario) and 'watch' its properties and 
    intercept any calls made to its member functions.
*/


/*
    ___props (Object):
        Records ONLY and all VARIABLE changes made while watching
*/
var ___props = {};

/*
    ___proxs (Object):
        Contains references to all proxied functions of the object 
        being watched
*/
var ___proxs = {};

/*
    ___propertyTrace (Array):
        Records ONLY and all VARIABLE changes made while watching.
        
        WARNING: This array can get vary large, very fast
        when watching even simple web applications. If necessary,
        remove this reporting functionality in order to avoid slow
        page loads and potential crashes.
*/
var ___propertyTrace = [];

/*
    ___functionTrace (Array):
        Records ONLY and all FUNCTION CALLS made while watching.
        
        WARNING: This array can get vary large, very fast
        when watching even simple web applications. If necessary,
        remove this reporting functionality in order to avoid slow
        page loads and potential crashes.
*/
var ___functionTrace = [];

/*
    ___trace (Array):
        Records all variable changes and function calls made while 
        watching.
        
        WARNING: This array can get vary large, very fast
        when watching even simple web applications. If necessary,
        remove this reporting functionality in order to avoid slow
        page loads and potential crashes.
*/
var ___trace = [];

/*
    ___watchOn (Boolean):
        Determine if we're watching
*/
var ___watchOn = true;

/*
    ___delay (Number):
        The delay at which the loop occurs (milliseconds).
        
        WARNING: Setting a low delay speed (quicker interval)
        means that the '___watchLoop' function below will be ran
        with less delay between calls. This could mean slower page
        loads and even unexpected crashes, given the computationally-
        intensive task of object comparison present in '___watchLoop'.
        To avoid slow load speeds, crashing applications  or poor 
        application performance in general, it is recommended that 
        the delay be set to a high number (>1000). For less complex 
        web applications, the delay can be lower.
*/
var ___delay = 100;

/*
    ___setTimeout / ___setInterval / ___clearInterval (Functions):
        These functions are merely wrappers to their native equivalents 
        such that we don't watch our own variables and thus, our 
        tracing history objects don't include reports of the tracing 
        loop '___watchLoop' in '___startTrace'.
*/
var ___setTimeout = setTimeout;
var ___setInterval = setInterval;
var ___clearInterval = clearInterval;

/*
    ___propertyIntercept (Function):
        This function is called after the property 'property' is 
        changed and adds a trace entry object in to the tracing 
        history objects '___propertyTrace' and '___trace'
*/
var ___propertyIntercept = function(property, oldValue, newValue) {
    //create trace entry object, add to our tracing history objects
	var o = {
		'property': property,
		'oldValue': oldValue,
		'newValue': newValue
	};
	___propertyTrace.push(o);
	___trace.push(o);
};

/*
    ___functionIntercept (Function):
        This function is called before the proxied function (with 
        name of 'fn') is called and adds a trace entry object in to 
        the tracing history objects '___functionTrace' and '___trace'
*/
var ___functionIntercept = function(fn, args) {
    //create trace entry object, add to our tracing history objects
	var o = {
		'function': fn,
		'arguments': args
	};
	___functionTrace.push(o);
	___trace.push(o);
};

/*
    ___stringy (Function):
        This function performs a JSON.stringify of 'p', while 
        preventing errors of circular dependencies
*/
function ___stringy(p) {
	var cache = []; //cache will hold seen property names
	return JSON.stringify(p, function(key, value) {
		if(typeof value === 'object' && value !== null) {
			if(cache.indexOf(value) !== -1) {
				// Circular reference, simply return
				return;
			}
			// Store value in our collection
			cache.push(value);
		}
		return value;
	});
}

/*
    ___addToWatchList (Function):
        This function adds the property with name 'i' from 'p' to
        the '___props' watch object (list), and create a function 
        proxy in the '___proxs' object (list) if 'p[i]' is a function
*/
function ___addToWatchList(i, p) {
    //Make sure we aren't trying to watch our own variables
    //and also ensure that we avoid any cyclical references.
    //Both the above prevent endless loops and general errors
	if(typeof i == "string" && 
		(i.indexOf("___") === 0 || 
		i == "self" || 
		i == "frames" || 
		i == "window" || 
		i == "parent" || 
		i == "top" || 
		i == "chrome"))
			return false;

    //crete proxies for all 'function' properties in 'p'
	if(typeof p[i] == "function") {
	    //set out proxy function
		___proxs[i.toString()] = p[i];
		
		//overwrite the original function
		p[i] = function() {
		    //call the intermediary function first...
            ___functionIntercept(i.toString(), arguments);
            
            //followed by the actual, proxied function after
			return ___proxs[i.toString()].apply(p, arguments);
		};
	}
	
	try {
	    //try to watch the actual value of the property (as json)
		___props[i] = ___stringy(p[i]);
		
		//return true (we're now watching the object's property)
		return true;
	} catch(e) {
	    //something went wrong converting the property to json
		console.error(e.message);
		
		//return false (we weren't able to watch the object's property)
		return false;
	}
}

/*
    ___startTrace (Function):
        This function starts the tracing loop '___watchLoop', 
        identifying any changes made to watched properties and  
        intercepting any watched functions called. When the above 
        two scenarios occur, the change(s)/call(s) is/are logged 
        to our trace via '___propertyIntercept' or 
        '___functionIntercept' respectively.
*/
function ___startTrace(traceObject) {
	//___watchOn will be a binary flag used to keep the
	//loop running at an interval of 'delay' seconds
	___watchOn = true;

	//add all properties in 'traceObject' to our watch list
	for(var ___i in traceObject)
		___addToWatchList(___i.toString(), traceObject);
	
	//___watchLoop will be our main loop
	(function ___watchLoop() {
		//cycle through the traceObject's properties
		for(var ___i in traceObject) {
			if(!___props.hasOwnProperty(___i)) {
				//IF: ___i is a new value (not watched yet)

				//add ___i to our watch list
				if(___addToWatchList(___i.toString(), traceObject)) {
					//report the newly-watched item if it was added
					___propertyIntercept(___i, undefined, traceObject[___i]);
				}
			} else {
				//ELSE: ___i is a property we're already watching

				//IF the property exists and is defined and if the
				//value of the property (traceObject[___i]) is different 
				//than our last recorded value (___props[___i])...
				if(___props[___i] && 
				    typeof ___props[___i] !== "undefined" &&
					___props[___i] !== ___stringy(traceObject[___i])) {
						//decode our alread-watched property
						var ___obj = JSON.parse(___props[___i]);

						//report the change
						___propertyIntercept(___i, ___obj, traceObject[___i]);

						//set the new value
						___props[___i] = ___stringy(traceObject[___i]);
				}
			}
		}
		
		if(___watchOn) //if we're still watching...
			___setTimeout(___watchLoop, ___delay); //loop
	})(); //start the loop right away
}

/*
    ___startTrace (Function):
        This function stops the tracing loop '___watchLoop' in 
        '___startTrace' by setting the boolean '___watchOn' value 
        to 'false'.
*/
function ___stopTrace() { ___watchOn = false; } //stop watching

/*
    ___startTrace (Function):
        This function displays our trace history object, '___trace',
        which shows a step-by-step (per '___delay' interval) sequence
        of property changes and/or function calls made while the tracing
        was turned on (as represented by '___watchOn' being 'true').
*/
function ___showTrace() {
	for(var h in ___trace)
		console.log("STEP "+h, ___trace[h]);
}

___startTrace(window); // initial call
___startTrace(document); // initial call
