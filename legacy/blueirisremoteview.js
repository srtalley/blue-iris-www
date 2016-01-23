var camUrl;
var camData = null;
var indexDimsX = -1;
var indexDimsY = -1;
var camIds = new Array();
var myIndexImage = "index"; // Some users may be limited to certain groups, so their index image won't be "index"
var refreshTime = 25;
var currentlySelectedImageId = "index";
var resizeTimeout = null;
var currentlyLoadingImage;
var dividerOffsetX = 0;
var isDraggingDivider = false;
var mouseX = 0;
var clipData = new Array();
var currentCameraFrameWidth = 1000000;
var currentCameraFrameHeight = 1000000;
var currentCameraFrameAspect = 1;
var lastClipDataRefresh = 0;
var clipListPage = 0;
var selectedRB = "0";
var autoRefresh = false;
var timeStart = 0;
var isLoadingLive = true;
var fullyLoadedCamInfo = false;
$(function ()
{
	autoRefresh = $.cookie('autorefresh') == "1";

	selectedRB = $.cookie('selectedAlertType');
	if (selectedRB != "0" && selectedRB != "1" && selectedRB != "2")
		selectedRB = "0";

	LoadCamIds();
	camList_Changed();
	resized();
	loadNewClipData();
	StartRefresh();
	EnableDraggableDivider();
	setInterval(refreshIntervalFunc, 1000);

	setupPtzStopActions();
	$("#rowptz").children("img").each(setupPtzButton);

	if (!isActiveXPage)
	{
		$('#cam_img').click(function (event)
		{
			ImgClick(event, this);
		});
	}
});
$(window).resize(function ()
{
	resized();
});
function resized(wasCausedByTrigger)
{
	var windowHeight = $(window).height();
	var windowWidth = $(window).width();
	$('#layoutmenu').css('height', windowHeight + "px");
	$('#layoutdivider').css('height', (windowHeight - 3) + "px");

	var headingHeight = $('#layouttop').height();
	var bodyHeight = windowHeight - headingHeight;
	$('#layoutbody').css('height', bodyHeight + 'px').css('top', headingHeight);

	var menuWidth = $('#layoutmenu').outerWidth(true);
	var dividerWidth = $('#layoutdivider').outerWidth(true);
	var newWidth = windowWidth - menuWidth - dividerWidth;
	$('#layoutdivider').css('left', menuWidth + "px");
	$('#layoutbody, #layouttop').css('left', (menuWidth + dividerWidth) + "px").css('width', newWidth + "px");

	if (isActiveXPage)
	{
		if (!bWM)
		{
			$("#MediaPlayer").css('display', 'none');
			$("#LiveVideo").css('display', 'inline');
		}
		else
		{
			$("#MediaPlayer").css('display', 'inline');
			$("#LiveVideo").css('display', 'none');
		}
		document.MediaPlayer.width = newWidth - 5;
		document.MediaPlayer.height = bodyHeight - 5;
		document.LiveVideo.width = newWidth - 5;
		document.LiveVideo.height = bodyHeight - 5;
	}
	else
	{
		$('#cam_img').css('max-height', bodyHeight + "px").css('max-width', newWidth + "px");
	}

	currentCameraFrameWidth = newWidth;
	currentCameraFrameHeight = menuWidth;
	currentCameraFrameAspect = $("#layoutbody").width() / $("#layoutbody").height();

	var clipsPanelHeight = windowHeight - ($("#logopanel").outerHeight(true) + $("#camerasheading").outerHeight(true) + $("#cameraspanel").outerHeight(true) + $("#thumbheading").outerHeight(true) + $("#thumbpanel").outerHeight(true) + $("#clipsheading").outerHeight(true));
	$("#clipspanel").css("height", clipsPanelHeight + "px");

	fixImgSize();
	if (!wasCausedByTrigger)
	{
		if (resizeTimeout != null)
			clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(function () { resized(true) }, 5);
	}
}

function camList_Changed()
{
	if (isActiveXPage)
	{
		box = document.getElementById('CamList');
		if (box.selectedIndex < 0)
			return;

		destination = box.options[box.selectedIndex].value;

		if (!destination || destination == "off")
			SetMediaUrl("", 640, 480, false);
		else
		{
			parts = destination.split(";");

			if (parts[0] == "wmv")
				SetMediaUrl(parts[3], Number(parts[1]), Number(parts[2]), true);
			else if (parts[0] == "jpg")
			{
				SetMediaUrl("", Number(parts[1]), Number(parts[2]), false);
				try
				{
					segments = parts[3].split('/');
					currentlySelectedImageId = segments[3];
					loadNewClipData();
					document.LiveVideo.changeURL(parts[3] + ";" + parts[5] + ";" + $.cookie('session'));
				}
				catch (er)
				{
					alert(er + " Please note this page is for Internet Explorer only. Install/update the Blue Iris ActiveX component then refresh this page.");
				}
			}
		}

		resized();
	}
	else
	{
		var camdata = $("#CamList option:selected").val();
		var parts = camdata.split(';');
		var pieces = parts[3].split("/");
		currentlySelectedImageId = pieces[3];
		camUrl = "/image/" + currentlySelectedImageId;
		isLoadingLive = true;
		$("#rowptz").css("display", (parseInt(parts[5]) & 2) ? "block" : "none");
		loadNewClipData();
	}
}
function SetMediaUrl(url, width, height, bwmflag)
{
	bWM = bwmflag;
	try
	{
		document.MediaPlayer.URL = url;
	}
	catch (er)
	{
		alert("Media Player ActiveX component is not installed.");
	}
	mediaWidth = width;
	mediaHeight = height;
}
function loadNewClipData()
{
	lastClipDataRefresh = new Date().getTime();
	$("#clipspanel, #thumbpanel").prepend(getAjaxLoaderMarkup());
	$.get("cliplist2.htm?cam=" + currentlySelectedImageId + "&alerts=" + selectedRB + "&days=" + clipListPage).done(clipDataLoaded).fail(clipDataFailed);
}
function clipDataLoaded(data)
{
	$("#cliplistcontainer").html(data);
	// Set Auto Refresh checkbox
	if (autoRefresh)
		$("#cbAutoRefresh").attr('checked', 'checked');
	else
		$("#cbAutoRefresh").removeAttr('checked');
	// Set Alert Type Radio Button
	$("#R" + selectedRB).attr('checked', 'checked');
	$("#pagenumber").html(clipListPage + 1);
	$("#ClipData").children("option").each(function (idx, ele)
	{
		var txt = $(ele).html();
		var trimmed = txt.match(/^(.*?)(&nbsp;| )+\([a-zA-Z0-9]+\)$/);
		txt = trimmed[1];
		txt = txt.replace(/&nbsp;&nbsp;/, "&nbsp;");
		$(ele).html(txt);
	});
	// Handle sizing of panels
	resized();
	//AddClipListData();
	//UpdateClipListDisplay();
}
function clipDataFailed()
{
	setTimeout(loadNewClipData, 1000);
}
///////////////////////////////////////////////////////////////
// Image Refreshing ///////////////////////////////////////////
///////////////////////////////////////////////////////////////
function StartRefresh()
{
	if (isActiveXPage)
		return;
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
			camObj.attr("aspect", this.naturalWidth / this.naturalHeight);
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
	currentlyLoadingImage = camUrl;
	var timeValue = new Date().getTime();
	if (!isLoadingLive)
		timeValue -= timeStart;
	$("#cam_img").attr('src', currentlyLoadingImage + '?time=' + timeValue + "&w=" + currentCameraFrameWidth);
}
///////////////////////////////////////////////////////////////
// Image Resizing /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function fixImgSize()
{
	var imgval = $("#cam_img").attr("aspect");
	if (imgval < currentCameraFrameAspect)
	{
		$("#cam_img").css("height", "100%").css("width", "auto");
	}
	else
	{
		$("#cam_img").css("width", "100%").css("height", "auto");
	}
}
///////////////////////////////////////////////////////////////
// Draggable Divider //////////////////////////////////////////
///////////////////////////////////////////////////////////////
function EnableDraggableDivider()
{
	$("#layoutdividerglow").hide();
	$("#layoutdivider").hover(function ()
	{
		$("#layoutdividerglow").fadeIn();
	}, function ()
	{
		$("#layoutdividerglow").stop();
		$("#layoutdividerglow").fadeOut();
	});
	$("#layoutdivider").mousedown(function (e)
	{
		dividerOffsetX = e.pageX - $("#layoutdivider").offset().left;
		isDraggingDivider = true;
		stopDefault(e);
	});
	$(document).mouseup(function ()
	{
		isDraggingDivider = false;
	});
	$(document).mousemove(function (e)
	{
		if (isDraggingDivider)
		{
			var newWidth = (e.pageX - dividerOffsetX);
			if (newWidth > $(window).width() - 50)
				newWidth = $(window).width() - 50;
			if (newWidth < 0)
				newWidth = 0;
			$('#layoutmenu').css('width', newWidth + "px");
			resized();
		}
	});
}
///////////////////////////////////////////////////////////////
// Clip Handling //////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function AddClipListData()
{
	clipData.length = 0;
	$("#clipdatacontainer option").each(function (idx, ele)
	{
		var clip = new Object();
		clip.name = $(ele).text();
		clip.rawurl = $(ele).val();
		var parts = clip.rawurl.split('/');
		var path = "";
		for (var i = 3; i < parts.length; i++)
			path += "/" + parts[i];
		clip.path = path;
		clipData.push(clip);
	});
}
function UpdateClipListDisplay()
{
	var htmlArray = new Array();
	for (var i = 0; i < clipData.length; i++)
	{
		var clip = clipData[i];
		var html = '<div>' + clip.name + '</div>'; // <img style="float:left;max-width:100px;max-height:100px;" src="/file' + clip.path + '?time=3800&w=100" />
		htmlArray.push(html);
	}
	$("#clipspanel").html(htmlArray.join(""));
}
function btnRefresh_Click()
{
	clipListPage = 0;
	loadNewClipData();
}
function cbAutoRefresh_Click()
{
	autoRefresh = $("#cbAutoRefresh").is(":checked");
	$.cookie('autorefresh', autoRefresh ? "1" : "0", { expires: 1000 })
}
function btnNavLeft_Click()
{
	clipListPage--;
	if (clipListPage < 0)
		clipListPage = 0;
	loadNewClipData();
}
function btnNavRight_Click()
{
	clipListPage++;
	loadNewClipData();
}
function refreshIntervalFunc()
{
	if ($("#cbAutoRefresh").is(":checked") && lastClipDataRefresh + 3000 < new Date().getTime())
		loadNewClipData();
}
function rbAlertType_Change(newSelectedValue)
{
	selectedRB = newSelectedValue;
	$.cookie('selectedAlertType', newSelectedValue, { expires: 1000 });
	loadNewClipData();
}
function clipchosen()
{
	var url = $("#ClipData option:selected").val();
	openclip(url);
}
function thumbchosen(url)
{
	if (url == 'na')
	{
		alert("No recording found");
		return;
	}
	openclip(url);
}
function openclip(url)
{
	if (isActiveXPage)
	{
		$("#CamList").get(0).selectedIndex = -1;

		SetMediaUrl("", 640, 480, false);

		try
		{
			document.LiveVideo.changeURL(url + ";0;" + $.cookie('session'));
		}
		catch (er)
		{
			alert("Please install the Blue Iris ActiveX component then refresh this page.");
		}

		resized();
	}
	else
	{
		$("#CamList").get(0).selectedIndex = -1;
		var parts = url.split("/");
		var path = "";
		for (var i = 3; i < parts.length; i++)
			path += "/" + parts[i];
		camUrl = "/file" + path;
		isLoadingLive = false;
		timeStart = new Date().getTime();
	}
}
///////////////////////////////////////////////////////////////
// Click-to-select ////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function ImgClick(event, ele)
{
	if (!isLoadingLive || !fullyLoadedCamInfo)
		return;

	var currentlyDesiredImage;
	if (currentlySelectedImageId != myIndexImage)
	{
		currentlyDesiredImage = myIndexImage;
	}
	else
	{
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
			x = event.clientX - $(ele).offset().left;
			y = event.clientY - $(ele).offset().top;
		}
		// Adjust for the size of the drawn image
		var xScale = $(ele).width() / parseFloat(indexDimsX);
		var yScale = $(ele).height() / parseFloat(indexDimsY);
		if (xScale <= 0)
			xScale = 0.001;
		if (yScale <= 0)
			yScale = 0.001;
		x /= xScale;
		y /= yScale;
		var success = false;
		for(var i = 0; i < camData.length; i++)
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
	}
	// Find this element in CamList
	var options = $("#CamListSimple").children("option");
	for (var i = 0; i < options.length; i++)
		if (options.eq(i).val() == currentlyDesiredImage)
		{
			$("#CamList").get(0).selectedIndex = i;
			camList_Changed();
			return;
		}
}
function LoadCamIds()
{
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
		$("body").append('<img id="tempImageToMeasureIndexSize" onload="tempImageToMeasureIndexSizeLoaded()" style="display:none" src="image/' + myIndexImage + '?' + new Date().getTime() + '" />');
	}, "json");
}
function tempImageToMeasureIndexSizeLoaded()
{
	indexDimsX = $(tempImageToMeasureIndexSize)[0].naturalWidth;
	indexDimsY = $(tempImageToMeasureIndexSize)[0].naturalHeight;
	fullyLoadedCamInfo = true;
	$(tempImageToMeasureIndexSize).remove();
}
///////////////////////////////////////////////////////////////
// Misc ///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function stopDefault(e)
{
	if (e && e.preventDefault)
	{
		e.preventDefault();
	}
	else
	{
		window.event.returnValue = false;
	}
	return false;
}

function getAjaxLoaderMarkup()
{
	return '<img id="ajaxloader" width="16" height="16" title="" alt="" style=\"position:absolute\" src="data:image/gif;base64,R0lGODlhEAAQAPQAACEjJTd+wCEkKDFpnStObzV7uzJwqCMwPSdBWTR2sixTdy1ZgCIrNClGYyU2RjBjky9eigAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH+GkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAEAAQAAAFUCAgjmRpnqUwFGwhKoRgqq2YFMaRGjWA8AbZiIBbjQQ8AmmFUJEQhQGJhaKOrCksgEla+KIkYvC6SJKQOISoNSYdeIk1ayA8ExTyeR3F749CACH5BAAKAAEALAAAAAAQABAAAAVoICCKR9KMaCoaxeCoqEAkRX3AwMHWxQIIjJSAZWgUEgzBwCBAEQpMwIDwY1FHgwJCtOW2UDWYIDyqNVVkUbYr6CK+o2eUMKgWrqKhj0FrEM8jQQALPFA3MAc8CQSAMA5ZBjgqDQmHIyEAIfkEAAoAAgAsAAAAABAAEAAABWAgII4j85Ao2hRIKgrEUBQJLaSHMe8zgQo6Q8sxS7RIhILhBkgumCTZsXkACBC+0cwF2GoLLoFXREDcDlkAojBICRaFLDCOQtQKjmsQSubtDFU/NXcDBHwkaw1cKQ8MiyEAIfkEAAoAAwAsAAAAABAAEAAABVIgII5kaZ6AIJQCMRTFQKiDQx4GrBfGa4uCnAEhQuRgPwCBtwK+kCNFgjh6QlFYgGO7baJ2CxIioSDpwqNggWCGDVVGphly3BkOpXDrKfNm/4AhACH5BAAKAAQALAAAAAAQABAAAAVgICCOZGmeqEAMRTEQwskYbV0Yx7kYSIzQhtgoBxCKBDQCIOcoLBimRiFhSABYU5gIgW01pLUBYkRItAYAqrlhYiwKjiWAcDMWY8QjsCf4DewiBzQ2N1AmKlgvgCiMjSQhACH5BAAKAAUALAAAAAAQABAAAAVfICCOZGmeqEgUxUAIpkA0AMKyxkEiSZEIsJqhYAg+boUFSTAkiBiNHks3sg1ILAfBiS10gyqCg0UaFBCkwy3RYKiIYMAC+RAxiQgYsJdAjw5DN2gILzEEZgVcKYuMJiEAOwAAAAAAAAAAAA==" />';
}
///////////////////////////////////////////////////////////////
// IE / ActiveX ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var bWM = false;
var mediaWidth = 640;
var mediaHeight = 480;
window.onbeforeunload = function ()
{
	if (!isActiveXPage)
		return;
	try
	{
		document.LiveVideo.Shutdown();
	}
	catch (er)
	{
	}
}
///////////////////////////////////////////////////////////////
// PTZ ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var ptzBtnIsDown = false;
var currentPtz = "0";

function setupPtzButton(idx, ele)
{
	$(ele).mousedown(function (e)
	{
		OnPTZ($(this).attr("ptzpos"), true);
		e.preventDefault();
	});
	$(ele).mouseleave(function (e)
	{
		OnPTZ($(this).attr("ptzpos"), false);
	});
}
function setupPtzStopActions()
{
	$(document).mouseup(function (e)
	{
		OnPTZ(currentPtz, false);
	});
}
function OnPTZ(pos, isDown)
{
	if (!ptzBtnIsDown && isDown)
	{
		currentPtz = pos;
		ptzBtnIsDown = true;
		$.get("/cam/" + currentlySelectedImageId + "/pos=" + pos + "?updown=1&" + new Date().getTime());
	}
	else if (ptzBtnIsDown)
	{
		ptzBtnIsDown = false;
		$.get("/cam/" + currentlySelectedImageId + "/pos=" + pos + "?updown=2&" + new Date().getTime());
	}
}

function logout()
{
	$.get('logout.htm')
	.done(function ()
	{
		location.href = "login.htm?page=" + encodeURIComponent(location.pathname);
	})
	.fail(function ()
	{
		location.href = 'logout.htm';
	});
}
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