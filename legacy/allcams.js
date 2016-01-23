///////////////////////////////////////////////////////////////
// Global settings and fields /////////////////////////////////
///////////////////////////////////////////////////////////////

var myIndexImage = "index"; // Some users may be limited to certain groups, so their index image won't be "index"
var currentlyLoadingImage = ""; // ID of loading image.
var currentlyDesiredImage = ""; // ID of desired image.
var internetMode = false;
var startTime = 0;
var started = false;
var camIds;
var camData = null;
var indexDimsX = -1;
var indexDimsY = -1;
var setScreenSizeMobile = false;
var screenDimsMobile;
// timeHack is used to control the amount of data cached in the browser.
// timeHackStart is initialized to the page load time so that each page load will contain a unique set of timeHack values.
var timeHackStart = new Date().getTime();
var timeHack = timeHackStart;

var isMobile = navigator.userAgent.indexOf('iPad') > -1 || navigator.userAgent.indexOf('iPhone') > -1 || navigator.userAgent.indexOf('Android') > -1;

var loadingInterval;
///////////////////////////////////////////////////////////////
// Parse parameters, initialize camera display ////////////////
///////////////////////////////////////////////////////////////

$(window).load(function ()
{
	LoadCamIds();

	loadingInterval = setInterval(function ()
	{
		if (camData == null)
			return;
		clearInterval(loadingInterval);
		var internetModeVal = getURLParameter("internetmode");
		if (internetModeVal)
		{
			refreshTime = parseInt(internetModeVal);
			internetMode = true;
			startTime = new Date().getTime();
		}
		else
			refreshTime = 25;

		currentlyLoadingImage = currentlyDesiredImage = myIndexImage;

		$("#rootDiv").append('<img id="cam_img" myId="' + myIndexImage + '" naturalWidth="960" naturalHeight="720" />');
		var cam_img = $("#cam_img");
		//if(isMobile)
		//{
		cam_img.click(function (event)
		{
			ImgClick(event, this);
		});
		//}
		//else
		//{
		//	cam_img.dblclick(function (event)
		//	{
		//		ImgClick(event, this);
		//	});
		//}
		started = true;
		StartRefresh();
	}, 100);
});

///////////////////////////////////////////////////////////////
// Low Level functions ////////////////////////////////////////
///////////////////////////////////////////////////////////////

function ImgClick(event, ele)
{
	if (camData == null)
		return;
	if (currentlyDesiredImage != myIndexImage)
	{
		currentlyDesiredImage = myIndexImage;
		GetNewImage();
		return;
	}
	
	// Find out which camera was clicked.
	var x;
	var y;
	if (typeof(event.offsetX) != 'undefined')
	{
		x = event.offsetX;
		y = event.offsetY;
	}
	else
	{
		x = event.clientX - ele.offsetLeft;
		y = event.clientY - ele.offsetTop;
	}
	var w = $(ele).width();
	var h = $(ele).height();
	// Adjust for the size of the drawn image
	var xScale = w / parseFloat(indexDimsX);
	var yScale = h / parseFloat(indexDimsY);
	if (xScale <= 0)
		xScale = 0.001;
	if (yScale <= 0)
		yScale = 0.001;
	x /= xScale;
	y /= yScale;

	var success = false;
	for (var i = 0; i < camData.length; i++)
	{
		if (myIndexImage == camData[i].optionValue)
		{
			if (typeof (camData[i].group) != "undefined")
			{
				for (var j = 0; j < camData[i].rects.length; j++)
				{
					if (x > camData[i].rects[j][0] && y > camData[i].rects[j][1] && x < camData[i].rects[j][2] && y < camData[i].rects[j][3])
					{
						currentlyDesiredImage = camData[i].group[j];
						success = true;
						break;
					}
				}
			}
			else
				continue;
		}
	}
	if (!success)
		return; // User didn't click on an image
	GetNewImage();
}

function LoadCamIds()
{
	camIds = new Array();
	$.post("json", JSON.stringify({ cmd: "camlist", session: $.cookie('session') }), function (response)
	{
		camData = response.data;
		for (var i = 0; i < camData.length; i++)
		{
			if (i == 0 && typeof (camData[i].group) != "undefined" && camData[i].optionValue != "index")
				myIndexImage = camData[i].optionValue;
			if (typeof (camData[i].group) == "undefined")
			{
				var camId = camData[i].optionValue;
				if (camId != "index")
					camIds.push(camId);
			}
		}
	}, "json");
}

///////////////////////////////////////////////////////////////
// Image Resizing /////////////////////////////////////////////
///////////////////////////////////////////////////////////////

$(window).resize(fixImgSize);
function fixImgSize()
{
	if(!started)
		return;
	
	var cam_img = $("#cam_img");

	var screenDims;
	if(isMobile)
	{
		if(!setScreenSizeMobile)
		{
			// Store the current viewport dimensions and always use them.
			screenDimsMobile = GetViewportDims();
			setScreenSizeMobile = true;
		}
		screenDims = screenDimsMobile;
	}
	else
		screenDims = GetViewportDims();	
	
	var availableWidth = parseInt(screenDims.width);
	var availableHeight = parseInt(screenDims.height);

	var newSize = fitImageInto(availableWidth, availableHeight);

	cam_img.css("position", "absolute");
	cam_img.css("top", Math.max(0, parseInt((availableHeight - newSize.height) / 2)) + "px");
	cam_img.css("left", Math.max(0, parseInt((availableWidth - newSize.width) / 2)) + "px");

	cam_img.height(newSize.height);
	cam_img.width(newSize.width);
}

function fitImageInto(availableWidth, availableHeight)
{
	var newHeight;
	var newWidth;
	var cam_img = $("#cam_img");
	if (cam_img.length != 1)
		return;
	var originwidth = parseInt(cam_img.attr("naturalWidth"));
	var originheight = parseInt(cam_img.attr("naturalHeight"));
	if (isNaN(originwidth) || isNaN(originheight))
	{
		newWidth = availableWidth;
		newHeight = availableHeight;
	}
	else
	{
		// Take into consideration the original width and height for the image
		newHeight = availableHeight;
		newWidth = availableWidth;
		// Calculate ratios
		var originRatio = originwidth / originheight;
		var newRatio = newWidth / newHeight;
		if (newRatio < originRatio)
			newHeight = newWidth / originRatio;
		else
			newWidth = newHeight * originRatio;
	}
	// Return new size
	return { width: newWidth, height: newHeight };
}

///////////////////////////////////////////////////////////////
// Image Refreshing ///////////////////////////////////////////
///////////////////////////////////////////////////////////////

function StartRefresh()
{
	var camObj = $("#cam_img");
	camObj.load(function ()
	{
		if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0)
		{
			// Failed
		}
		else if (typeof camObj.attr("myId") != currentlyLoadingImage)
		{
			if (currentlyLoadingImage == myIndexImage && indexDimsX < 0)
			{
				indexDimsX = this.naturalWidth;
				indexDimsY = this.naturalHeight;
			}
			camObj.attr("myId", currentlyLoadingImage);
			camObj.attr("naturalWidth", this.naturalWidth);
			camObj.attr("naturalHeight", this.naturalHeight);
			fixImgSize();
		}
		setTimeout("GetNewImage();", refreshTime);
	});
	camObj.error(function ()
	{
		setTimeout("GetNewImage();", refreshTime);
	});
	GetNewImage();
}
function GetNewImage()
{
	if (internetMode && new Date().getTime() > startTime + 600000)
	{
		PopupMessage('This window has been open for 10 minutes. Images have stopped loading. <a href="javascript:top.location.reload();">Click here</a> to reload this page.<br/>');
		return;
	}
	//if(timeHack - timeHackStart > 30)
	//	timeHack = timeHackStart;
	var cam_img = $("#cam_img");
	var currentlyLoadingImage = currentlyDesiredImage;
	cam_img.attr('src', camUrl + currentlyLoadingImage + '?time=' + new Date().getTime()/*timeHack++*/);
}

///////////////////////////////////////////////////////////////
// Helper functions ///////////////////////////////////////////
///////////////////////////////////////////////////////////////

function PopupMessage(msg)
{
	var pm = $("#popupMessage");
	if (pm.length < 1)
		$("#rootDiv").after('<div id="popupFrame"><div id="popupMessage">' + msg + '</div><center><input type="button" value="Close Message" onclick="CloseMessage()"/></center></div>');
	else
		pm.append(msg);
}
function CloseMessage()
{
	$("#popupFrame").remove();
}

function GetViewportDims()
{
	var w;
	var h;
	if (typeof (window.innerWidth) != 'undefined')
	{
		w = window.innerWidth;
		h = window.innerHeight;
	}
	else if (typeof (document.documentElement) != 'undefined' && typeof (document.documentElement.clientWidth) != 'undefined' && document.documentElement.clientWidth != 0)
	{
		w = document.documentElement.clientWidth;
		h = document.documentElement.clientHeight;
	}
	else
	{
		w = document.getElementsByTagName('body')[0].clientWidth;
		h = document.getElementsByTagName('body')[0].clientHeight;
	}
	return { width: w, height: h };
}

function getURLParameter(name)
{
	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)', 'i').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
}

// This StringBuilder is from http://www.codeproject.com/KB/scripting/stringbuilder.aspx
// ***************************
// Initializes a new instance of the StringBuilder class
// and appends the given value if supplied
function StringBuilder(value)
{
	this.strings = new Array("");
	this.Append(value);
}

// Appends the given value to the end of this instance.
StringBuilder.prototype.Append = function (value)
{
	if (value)
	{
		this.strings.push(value);
	}
	return this;
}

// Clears the string buffer
StringBuilder.prototype.Clear = function ()
{
	this.strings.length = 1;
}

StringBuilder.prototype.StrCount = function ()
{
	return this.strings.length;
}

// Converts this instance to a String.
StringBuilder.prototype.ToString = function ()
{
	return this.strings.join("");
}
// ***************************

///////////////////////////////////////////////////////////////
// External Libraries /////////////////////////////////////////
///////////////////////////////////////////////////////////////
/**
* jQuery Cookie plugin
*
* Copyright (c) 2010 Klaus Hartl (stilbuero.de)
* Dual licensed under the MIT and GPL licenses:
* http://www.opensource.org/licenses/mit-license.php
* http://www.gnu.org/licenses/gpl.html
*
*/
jQuery.cookie = function (key, value, options)
{

	// key and at least value given, set cookie...
	if (arguments.length > 1 && String(value) !== "[object Object]")
	{
		options = jQuery.extend({}, options);

		if (value === null || value === undefined)
		{
			options.expires = -1;
		}

		if (typeof options.expires === 'number')
		{
			var days = options.expires, t = options.expires = new Date();
			t.setDate(t.getDate() + days);
		}

		value = String(value);

		return (document.cookie = [
			encodeURIComponent(key), '=',
			options.raw ? value : encodeURIComponent(value),
			options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
			options.path ? '; path=' + options.path : '',
			options.domain ? '; domain=' + options.domain : '',
			options.secure ? '; secure' : ''
		].join(''));
	}

	// key and possibly options given, get cookie...
	options = value || {};
	var result, decode = options.raw ? function (s) { return s; } : decodeURIComponent;
	return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
};