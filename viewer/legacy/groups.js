/*

Groups setup has moved to a different file.

For groups.htm setup instructions, see groups_readme.txt

*/





///////////////////////////////////////////////////////////////
// Global settings and fields /////////////////////////////////
///////////////////////////////////////////////////////////////

var CamList = new Array();
$(function()
{
	if(typeof(GetCamList) == "function")
		CamList = GetCamList();
	else
	{
	  	$("body").css("background-color", "White");
	  	$("body").css("color", "Black");
	  	$("body").css("margin", "8px");
		var jqxhr = $.get( "legacy/groups_readme.txt")
		  .done(function(data)
		  {
		  	$("#rootDiv").append("<pre>" + data + "</pre>");
		  })
		  .fail(function() {
		  	$("#rootDiv").text("Please see groups_readme.txt in your Blue Iris /www/legacy/ directory for setup instructions.");
		  });
	}
});

var enableGroupCamerasCycle = false;
var camUrl = "image/";
var refreshTime;
var currentlyLoadingImage = ""; // ID of loading image.
var currentlyDesiredImage = ""; // ID of desired image.
var internetMode = false;
var startTime = 0;
var started = false;
var camIds;
var camData = null;
var indexImgId;
var currentGroupIndex = 0;
var gridWidth = 0;
var gridHeight = 0;
var setScreenSizeMobile = false;
var screenDimsMobile;
// timeHack is used to control the amount of data cached in the browser.
// timeHackStart is initialized to the page load time so that each page load will contain a unique set of timeHack values.
var timeHackStart = new Date().getTime();
var timeHack = timeHackStart;

var statusMessageTimeout;
var isFullScreen = false;
var supportFullScreen = false;
var mouseMoveTimeout;
var cameraIndex = -1;
var disableStatusAndButtonBar = false;
var allCamerasCycleActivated = false;

var isMobile = navigator.userAgent.indexOf('iPad') > -1 || navigator.userAgent.indexOf('iPhone') > -1 || navigator.userAgent.indexOf('Android') > -1;

var loadingInterval;
///////////////////////////////////////////////////////////////
// Parse parameters, initialize camera display ////////////////
///////////////////////////////////////////////////////////////

$(window).load(function ()
{
	if(!enableGroupCamerasCycle)
		$("#cyclebtn").hide();
	indexImgId = CamList[currentGroupIndex][0];

	$.post("json", JSON.stringify({ cmd: "camlist", session: $.cookie('session') }), function (response)
	{
		camData = response.data;
	}, "json");

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
		
		LoadCamIds(currentGroupIndex);
		
		currentlyLoadingImage = currentlyDesiredImage = indexImgId;
		
		$("#rootDiv").append('<img id="cam_img" myId="' + indexImgId + '" naturalWidth="960" naturalHeight="720" />');
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
		started=true;
		StartRefresh();
		
		$(document).keypress(function(event)
		{
			if (event.which == '='.charCodeAt(0) || event.which == '+'.charCodeAt(0))
			{
				navigateImage(+1);
			}
			else if (event.which == '-'.charCodeAt(0) || event.which == '_'.charCodeAt(0))
			{
				navigateImage(-1);
			}
			else if (event.which >= '0'.charCodeAt(0) && event.which <= '9'.charCodeAt(0) )
			{
				var newGroupIndex = parseInt(String.fromCharCode(event.which));
				if(newGroupIndex == 0)
					newGroupIndex = 9;
				else
					newGroupIndex--;
				LoadCamIds(newGroupIndex);
			}
			else if (event.which == '`'.charCodeAt(0) || event.which == '~'.charCodeAt(0))
			{
				cycle_toggle();
			}
		});

	}, 100);
	var ua = navigator.userAgent.toLowerCase();
	if(ua.indexOf("chrome") > 0 && ua.indexOf("webkit") > 0)
	{
		supportFullScreen = true;
		$("#fullscreenbtn").show();
	}
	
	$(document).mousemove(function()
	{	
		showButtonBar();
	});
	
	$(document).click(function()
	{	
		showButtonBar();
	});
});

///////////////////////////////////////////////////////////////
// Low Level functions ////////////////////////////////////////
///////////////////////////////////////////////////////////////

function ImgClick(event, ele)
{
	if (camData == null)
		return;
	if(allCamerasCycleActivated)
		return;
	if(currentlyDesiredImage != indexImgId)
	{
		currentlyDesiredImage = indexImgId;
		cameraIndex = -1;
		GetNewImage();
		return;
	}

	var camObj = $("#cam_img");
	if (camObj.attr("myId") != indexImgId)
	{
		currentlyDesiredImage = indexImgId;
		cameraIndex = -1;
		GetNewImage();
		return;
	}

	// Find out which camera was clicked.
	var x;
	var y;
	if (typeof (event.offsetX) != 'undefined')
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
	var xScale = w / parseFloat(camObj.attr("naturalWidth"));
	var yScale = h / parseFloat(camObj.attr("naturalHeight"));
	if (xScale <= 0)
		xScale = 0.001;
	if (yScale <= 0)
		yScale = 0.001;
	x /= xScale;
	y /= yScale;

	var oldCurrentlyDesiredImage = currentlyDesiredImage;
	var success = false;
	for (var i = 0; i < camData.length; i++)
	{
		if (indexImgId.toLowerCase() == camData[i].optionValue.toLowerCase())
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
	{
		currentlyDesiredImage = oldCurrentlyDesiredImage;
		return; // User didn't click on an image
	}

	success = false;
	for (var i = 0; i < camIds.length; i++)
	{
		if (camIds[i] == currentlyDesiredImage)
		{
			success = true;
			cameraIndex = i;
		}
	}
	if (!success)
	{
		currentlyDesiredImage = oldCurrentlyDesiredImage;
		return; // User's configuration does not match group's configuration closely enough
	}

	LoadCameraIndex();
	GetNewImage();
}
function LoadCameraIndex()
{
	ShowTemporaryStatus("Group " + (currentGroupIndex + 1) + ": " + CamList[currentGroupIndex][0] + "<br/>Camera " + (cameraIndex + 1) + ": " + camIds[cameraIndex]);
	if(cameraIndex < camIds.length)
		currentlyDesiredImage = camIds[cameraIndex];
	else
	{
		currentlyDesiredImage = indexImgId; // There was an error! Load index image.
		cameraIndex = -1;
	}
}
function LoadCamIds(indexToLoad)
{
	currentGroupIndex = indexToLoad % CamList.length;

	ShowTemporaryStatus("Group " + (currentGroupIndex + 1) + ": " + CamList[currentGroupIndex][0]);
	
	camIds = new Array();
	for(var i = 0; i < CamList[currentGroupIndex].length; i++)
	{
		if(i == 0)
			indexImgId = CamList[currentGroupIndex][i];
		else
			camIds.push(CamList[currentGroupIndex][i]);
	}
	// Figure out the size of the image grid based on the number of cameras we have.
	gridWidth = gridHeight = 1;
	while(true)
	{
		if(camIds.length <= gridWidth * gridHeight )
			break;

		gridWidth ++;

		if(camIds.length <= gridWidth * gridHeight )
			break;

		gridHeight ++;
	}
	currentlyDesiredImage = indexImgId;
	cameraIndex = -1;
}

///////////////////////////////////////////////////////////////
// Button Bar /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

function navigateImage(direction)
{
	if(cameraIndex < 0)
	{
		if(direction < 0)
		{
			var indexToLoad = currentGroupIndex - 1;
			if(indexToLoad < 0)
				indexToLoad += CamList.length;
			LoadCamIds(indexToLoad);
		}
		else if(direction > 0)
		{
			var indexToLoad = currentGroupIndex + 1;
			LoadCamIds(indexToLoad);
		}
	}
	else
	{
		cameraIndex += direction;
		if(cameraIndex < 0)
			cameraIndex += camIds.length;
		else if(cameraIndex >= camIds.length)
			cameraIndex -= camIds.length;
		LoadCameraIndex();
		GetNewImage();
	}
}

function fullscreen()
{
	if (supportFullScreen && fullScreenApi.supportsFullScreen)
	{
		if(isFullScreen)
			fullScreenApi.cancelFullScreen(document.body);
		else
			fullScreenApi.requestFullScreen(document.body);
		isFullScreen = !isFullScreen;
	}
}
function autocycle()
{
	cycle_toggle();
}
function showButtonBar()
{
	if(disableStatusAndButtonBar)
		return;
	$("#buttonbar").show();
	if(mouseMoveTimeout)
		clearTimeout(mouseMoveTimeout);
	mouseMoveTimeout = setTimeout(FadeButtonBar, 2500);
}
function FadeButtonBar()
{
	$("#buttonbar").fadeOut();
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
		disableStatusAndButtonBar = true;
		PopupMessage('This window has been open for 10 minutes. Images have stopped loading. <a href="javascript:top.location.reload();">Click here</a> to reload this page.<br/>');
		return;
	}
	//if(timeHack - timeHackStart > 30)
	//	timeHack = timeHackStart;
	var cam_img = $("#cam_img");
	var desired = currentlyDesiredImage;
	if(allCamerasCycleActivated)
		desired = "@" + indexImgId;
	currentlyLoadingImage = desired;
	cam_img.attr('src', camUrl + currentlyLoadingImage + '?time=' + new Date().getTime()/*timeHack++*/);
}

///////////////////////////////////////////////////////////////
// Helper functions ///////////////////////////////////////////
///////////////////////////////////////////////////////////////

function ShowTemporaryStatus(msg)
{	
	if(disableStatusAndButtonBar)
		return;
	$("#temporaryStatusFrame").remove();
	
	$("#rootDiv").after('<span id="temporaryStatusFrame"><span id="temporaryStatusMessage">' + msg + '</span></span>');
	
	if(statusMessageTimeout)
		clearTimeout(statusMessageTimeout);
	statusMessageTimeout = setTimeout(FadeTemporaryStatus, 400);
}
function FadeTemporaryStatus()
{
	$("#temporaryStatusFrame").fadeOut(750);
}

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


///////////////////////////////////////////////////////////////
// Full Screen API ////////////////////////////////////////////
///////////////////////////////////////////////////////////////

(function() {
    var
        fullScreenApi = {
            supportsFullScreen: false,
            isFullScreen: function() { return false; },
            requestFullScreen: function() {},
            cancelFullScreen: function() {},
            fullScreenEventName: '',
            prefix: ''
        },
        browserPrefixes = 'webkit moz o ms khtml'.split(' ');
 
    // check for native support
    if (typeof document.cancelFullScreen != 'undefined') {
        fullScreenApi.supportsFullScreen = true;
    } else {
        // check for fullscreen support by vendor prefix
        for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
            fullScreenApi.prefix = browserPrefixes[i];
 
            if (typeof document[fullScreenApi.prefix + 'CancelFullScreen' ] != 'undefined' ) {
                fullScreenApi.supportsFullScreen = true;
 
                break;
            }
        }
    }
 
    // update methods to do something useful
    if (fullScreenApi.supportsFullScreen) {
        fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';
 
        fullScreenApi.isFullScreen = function() {
            switch (this.prefix) {
                case '':
                    return document.fullScreen;
                case 'webkit':
                    return document.webkitIsFullScreen;
                default:
                    return document[this.prefix + 'FullScreen'];
            }
        }
        fullScreenApi.requestFullScreen = function(el) {
            return (this.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen']();
        }
        fullScreenApi.cancelFullScreen = function(el) {
            return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
        }
    }
 
    // jQuery plugin
    if (typeof jQuery != 'undefined') {
        jQuery.fn.requestFullScreen = function() {
 
            return this.each(function() {
                if (fullScreenApi.supportsFullScreen) {
                    fullScreenApi.requestFullScreen(this);
                }
            });
        };
    }
 
    // export api
    window.fullScreenApi = fullScreenApi;
})();

///////////////////////////////////////////////////////////////
// Group Cameras Cycle ////////////////////////////////////////
///////////////////////////////////////////////////////////////

function cycle_toggle()
{
	if(!enableGroupCamerasCycle)
		return;
	if(allCamerasCycleActivated)
	{
		allCamerasCycleActivated = false;
		allCamerasCycleCurrentCamera = 0;
		$("#cyclebtn").attr("src", "legacy/cycle_gray.png");
	}
	else
	{
		allCamerasCycleActivated = true;
		$("#cyclebtn").attr("src", "legacy/cycle.png");
	}
}