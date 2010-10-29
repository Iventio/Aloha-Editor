/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

GENTICS.Aloha.LinkChecker = new GENTICS.Aloha.Plugin('com.gentics.aloha.plugins.LinkChecker');

/**
 * Configure the available languages
 * http://en.wikipedia.org/wiki/List_of_HTTP_status_codes
 */
GENTICS.Aloha.LinkChecker.languages = ['en'];

/**
 * All error codes that have an explanation.
 */
GENTICS.Aloha.LinkChecker.errorCodes = [400, 401, 402, 403, 404, 405,
                                        406, 407, 408, 409, 410, 411,
                                        412, 413, 414, 415, 416, 417,
                                        418, 422, 423, 424, 425, 426,
                                        449, 450, 500, 501, 502, 503,
                                        504, 505, 506, 507, 509, 510];
/**
 * This codes are asumed temporary errors.
 */
GENTICS.Aloha.LinkChecker.warningCodes = [404, 411, 412, 413, 426, 449,
                                          450, 500, 503, 504, 505, 507,
                                          509, 510];


/**
 * Initialize the plugin and set initialize flag on true
 */
GENTICS.Aloha.LinkChecker.init = function () {
	
	this.proxyUrl = null;
	
    if (GENTICS.Aloha.LinkChecker.settings.proxyUrl != undefined) {
        this.proxyUrl = GENTICS.Aloha.LinkChecker.settings.proxyUrl;
    }

	// initialize the timer
	this.timer = {};
	
	// remember reference to this class for callback
	var that = this;

	// mark active Editable with a css class
	GENTICS.Aloha.EventRegistry.subscribe(
			GENTICS.Aloha, 
			"editableActivated", 
			function (jEvent, aEvent) {
				// find all link tags
				aEvent.editable.obj.find('a').each(function() {
					that.checkLink(this, 0);
				});
			} 
	);

	// remove active Editable ccs class
	GENTICS.Aloha.EventRegistry.subscribe(
			GENTICS.Aloha, 
			"editableDeactivated", 
			function (jEvent, aEvent) {
				// remove link marks
				that.makeClean(aEvent.editable.obj);
			}
	);

	// remove active Editable ccs class
	GENTICS.Aloha.EventRegistry.subscribe(
			GENTICS.Aloha, 
			"hrefChanged", 
			function (jEvent, aEvent) {
				that.checkLink(aEvent.obj, 700);
			}
	);

};

GENTICS.Aloha.LinkChecker.checkLink = function (obj, delay, timeout) {
	
	var that = this;
	
	// extract url from link object
	var url = jQuery(obj).attr('href');
	
	// i probably an internal link
	if ( !/^http/.test( url.toLowerCase() ) ) {
		this.makeCleanLink(obj);
		return;
	}
	
	if ( this.proxyUrl ) {
//		url = this.proxyUrl + this.urlencode(url);
		url = this.proxyUrl + url;
	}
	
	this.timer[url] = this.urlExists(
		url, 
		// success
		function(xhr) {
			that.makeCleanLink(obj);
		},
		//failure
		function(xhr) {
			if ( obj ) {
				if ( jQuery.inArray(xhr.status, that.errorCodes) >= 0 ) {
					var e = xhr.status;
				} else {
					var e = '0';
				}
				var o = jQuery(obj);
				if ( o.attr('title') ) {
					o.attr('data-title', o.attr('title'));
				}
				o.attr('title', url+'. '+that.i18n('error.'+e));
				if ( jQuery.inArray(xhr.status, that.warningCodes) >= 0 ) {					
					o.addClass('GENTICS_link_warn');
				} else {
					o.addClass('GENTICS_link_error');
				}
			}
		}, 
		this.timer[url], 
		timeout, 
		delay
	);
};

GENTICS.Aloha.LinkChecker.urlExists = function (url, successFunc, failureFunc, timer, timeout, delay) {
	
	// abort timer for that request
	clearTimeout(timer);
	
	delay = (delay != null && delay != undefined ) ? delay : 700;

	// start timer for delayed request
    var newTimer = setTimeout( function() {
    	
    	// start request 
		var myXHR = jQuery.ajax({
			url: url,
			timeout: timeout ? 10000 : timeout,
			type: 'HEAD',
			complete: function(xhr) {
				// abort timer for that request
				clearTimeout(newTimer);
				try {
					// if response HTTP status 200 link is ok
					// this implementation does NOT cover redirects!
				    if (xhr.status == 200) {
				    	successFunc.call(this, xhr); 
				    } else {
						failureFunc.call(this, xhr);
				  	}
				} catch(e) {
					failureFunc.call(this, {'status':0});
				}
			}
		}); 
		
	}, delay);
    
	return newTimer;
};

GENTICS.Aloha.LinkChecker.makeCleanLink = function (obj) {
	if ( obj ) {
		var o = jQuery(obj);
		if ( o.attr('data-title') ) {
			o.attr('title', o.attr('data-title'));
		}
		o.removeAttr('data-title');
		o.removeClass('GENTICS_link_error');
		o.removeClass('GENTICS_link_warn');
	}
};

GENTICS.Aloha.LinkChecker.makeClean = function (editable) {
	var that = this;
	// find all link tags
	editable.find('a').each(function() {
		that.makeCleanLink(this);
	});
};

GENTICS.Aloha.LinkChecker.urlencode = function (str) {
    // URL-encodes string  
    // 
    // version: 1008.1718
    // discuss at: http://phpjs.org/functions/urlencode
    // +   original by: Philip Peterson
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: AJ
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: travc
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Lars Fischer
    // +      input by: Ratheous
    // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Joris
    // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
    // %          note 1: This reflects PHP 5.3/6.0+ behavior
    // %        note 2: Please be aware that this function expects to encode into UTF-8 encoded strings, as found on
    // %        note 2: pages served as UTF-8
    // *     example 1: urlencode('Kevin van Zonneveld!');
    // *     returns 1: 'Kevin+van+Zonneveld%21'
    // *     example 2: urlencode('http://kevin.vanzonneveld.net/');
    // *     returns 2: 'http%3A%2F%2Fkevin.vanzonneveld.net%2F'
    // *     example 3: urlencode('http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a');
    // *     returns 3: 'http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a'
    str = (str+'').toString();
    
    // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
    // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
    return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
                                                                    replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
};