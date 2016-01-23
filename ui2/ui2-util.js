/* ui2-util.js contains javascript functions that are considered complete and do not change often

Keeping these functions here helps keep ui2.js more tidy.
*/
/// <reference path="ui2.js" />
/// <reference path="ui2-local-overrides.js" />
/// <reference path="jquery-1.11.3.js" />
/// <reference path="jquery.ui2modal.js" />

///////////////////////////////////////////////////////////////
// Draggable Divider //////////////////////////////////////////
///////////////////////////////////////////////////////////////
var isDraggingDivider = false;
var isOverDivider = false;
// Chrome at the time of this writing won't detect the hover exit if the pointer leaves the side of the browser, so this timeout will handle hiding the layout divider.
var layoutDividerHideTimeout = null;
var layoutLeftOriginalWidth = 210;
var lastDividerMouseDownTime = new Date().getTime() - 9999;
var lastDoubleMouseDownStarted = new Date().getTime() - 9999;
var doubleClickTime = 750;
function EnableDraggableDivider()
{
	layoutLeftOriginalWidth = $("#layoutleft").outerWidth(true);
	$("#layoutleft").css("width", parseInt(settings.ui2_leftBarSize) + "px");
	$("#layoutdivider").hover(function ()
	{
		isOverDivider = true;
		if (!isDraggingDivider)
			ShowLayoutDivider();
	}, function ()
	{
		isOverDivider = false;
		if (!isDraggingDivider)
			HideLayoutDivider();
	});
	$("#layoutdivider").on("mousedown touchstart", function (e)
	{
		ShowLayoutDivider();
		if (e.which <= 1)
		{
			var thisTime = new Date().getTime();
			if (thisTime < lastDividerMouseDownTime + doubleClickTime)
				lastDoubleMouseDownStarted = lastDividerMouseDownTime;
			if (typeof e.pageX == "undefined")
				e.pageX = e.originalEvent.touches[0].pageX;
			lastDividerMouseDownTime = thisTime;
			dividerOffsetX = e.pageX - $("#layoutdivider").offset().left;
			isDraggingDivider = true;
			return stopDefault(e);
		}
	});
	$(document).on("mouseup touchend touchcancel", function (e)
	{
		if (new Date().getTime() < lastDoubleMouseDownStarted + doubleClickTime)
			dividerDblClick();
		if (e.which <= 1)
		{
			isDraggingDivider = false;
			if (!isOverDivider)
			{
				layoutDividerHideTimeout = setTimeout(HideLayoutDivider, 3000);
			}
		}
	});
	$(document).on("mousemove touchmove", function (e)
	{
		if (layoutDividerHideTimeout != null)
			clearTimeout(layoutDividerHideTimeout);
		if (isDraggingDivider)
		{
			if (typeof e.pageX == "undefined")
				e.pageX = e.originalEvent.touches[0].pageX;
			var newWidth = (e.pageX - dividerOffsetX);
			if (newWidth < 0)
				newWidth = 0;
			$('#layoutleft').css('width', newWidth + "px");
			resized();
		}
		else
		{
			layoutDividerHideTimeout = setTimeout(HideLayoutDivider, 3000);
		}
	});
}
function dividerDblClick(e)
{
	if (typeof e == "undefined" || e.which <= 1)
	{
		$("#layoutleft").css("width", layoutLeftOriginalWidth + "px");
		resized();
	}
}
function ShowLayoutDivider()
{
	$("#layoutdivider").stop(true);
	$("#layoutdivider").animate({ opacity: 0.8 });
}
function HideLayoutDivider()
{
	$("#layoutdivider").stop(true);
	$("#layoutdivider").animate({ opacity: 0 });
}
///////////////////////////////////////////////////////////////
// Asynchronous Image Downloading /////////////////////////////
///////////////////////////////////////////////////////////////
var asyncImageQueue = new Array();
var currentImageQueueGeneration = -1;
function RestartImageQueue()
{
	var numThreads = parseInt(settings.ui2_thumbnailLoadingThreads);
	if (numThreads < 1)
		numThread = 1;
	else if (numThreads > 5)
		numThreads = 5;
	currentImageQueueGeneration++;
	for (var i = 0; i < numThreads; i++)
		AsyncDownloadQueuedImage(currentImageQueueGeneration);
}
function AsyncDownloadQueuedImage(myGeneration)
{
	if (myGeneration != currentImageQueueGeneration)
		return;
	var obj = popHighestPriorityImage();
	if (obj == null)
		setTimeout("AsyncDownloadQueuedImage(" + myGeneration + ")", 250);
	else
	{
		var src = $(obj.img).attr('src');
		if (!src || src.length == 0 || src == "ui2/LoadingSmall.png")
		{
			$(obj.img).load(function ()
			{
				AsyncDownloadQueuedImage(myGeneration);
			});
			$(obj.img).error(function ()
			{
				$(obj.img).unbind("load");
				$(obj.img).unbind("error");
				$(obj.img).attr('src', 'ui2/nothumb.jpg');
				AsyncDownloadQueuedImage(myGeneration);
			});
			$(obj.img).attr('src', obj.path);
		}
		else // Image is already loaded
			AsyncDownloadQueuedImage(myGeneration);
	}
}
function popHighestPriorityImage()
{
	var highest = null;
	var highestIdx = -1;
	for (var i = 0; i < asyncImageQueue.length; i++)
	{
		if (i == 0)
		{
			highest = asyncImageQueue[i];
			highestIdx = i;
		}
	}
	if (highestIdx > -1)
		asyncImageQueue.splice(highestIdx, 1);
	return highest;
}
function enqueueAsyncImage(img, path)
{
	var newObj = new Object();
	newObj.img = img;
	newObj.path = path;
	asyncImageQueue.push(newObj);
}
function dequeueAsyncImage(img)
{
	for (var i = 0; i < asyncImageQueue.length; i++)
	{
		if (asyncImageQueue[i].img == img)
		{
			asyncImageQueue.splice(i, 1);
			return;
		}
	}
}
function emptyAsyncImageQueue()
{
	asyncImageQueue = new Array();
}

///////////////////////////////////////////////////////////////
// Appear / Disappear in clips body logic /////////////////////
///////////////////////////////////////////////////////////////
var aboveAllowance = 500;
var belowAllowance = 1000;
var appearDisappearRegisteredObjects = new Array();
$(function ()
{
	$(window).resize(appearDisappearCheck);
	$("#clipsbody").scroll(appearDisappearCheck);
});
function appearDisappearCheck()
{
	var scrollTop = $("#clipsbody").scrollTop();
	var yMin = scrollTop - aboveAllowance;
	var yMax = scrollTop + $("#clipsbody").height() + belowAllowance;
	for (var i = 0; i < appearDisappearRegisteredObjects.length; i++)
	{
		var obj = appearDisappearRegisteredObjects[i];
		if (obj.y >= yMin && obj.y <= yMax)
		{
			// obj is Visible (or nearly visible)
			if (!obj.isAppeared)
			{
				obj.isAppeared = true;
				if (obj.callbackOnAppearFunc)
					obj.callbackOnAppearFunc(obj);
			}
		}
		else
		{
			// obj is Not Visible
			if (obj.isAppeared)
			{
				obj.isAppeared = false;
				if (obj.callbackOnDisappearFunc)
					obj.callbackOnDisappearFunc(obj);
			}
		}
	}
}
function unregisterOnAppearDisappear(obj)
{
	for (var i = 0; i < appearDisappearRegisteredObjects.length; i++)
	{
		if (appearDisappearRegisteredObjects[i] == obj)
		{
			appearDisappearRegisteredObjects.splice(i, 1);
			return;
		}
	}
}
function registerOnAppearDisappear(obj, x, y, callbackOnAppearFunc, callbackOnDisappearFunc)
{
	obj.isAppeared = false;
	obj.x = x;
	obj.y = y;
	obj.callbackOnAppearFunc = callbackOnAppearFunc;
	obj.callbackOnDisappearFunc = callbackOnDisappearFunc;
	appearDisappearRegisteredObjects.push(obj);
}
function unregisterAllOnAppearDisappear()
{
	appearDisappearRegisteredObjects = new Array();
}
///////////////////////////////////////////////////////////////
// JSON ///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function ExecJSON(args, callbackSuccess, callbackFail, synchronous)
{
	ApplyLatestSessionIfNecessary();
	var isLogin = args.cmd == "login";
	var oldSession = $.cookie("session");
	if (typeof args.session == "undefined" && !isLogin)
		args.session = oldSession;
	$.ajax({
		type: 'POST',
		url: "json",
		data: JSON.stringify(args),
		dataType: "json",
		async: !synchronous,
		success: function (data)
		{
			if (isLogin)
				$.cookie("session", oldSession);
			else if (typeof data.session != "undefined" && data.session != $.cookie("session"))
				$.cookie("session", data.session, { path: "/" });
			if (callbackSuccess)
				callbackSuccess(data);
		},
		error: function (jqXHR, textStatus, errorThrown)
		{
			if (callbackFail)
				callbackFail(jqXHR, textStatus, errorThrown);
		}
	});
}
///////////////////////////////////////////////////////////////
// Jpeg-diff streaming ////////////////////////////////////////
// Requires UI2Service from https://ui2service.codeplex.com/ //
///////////////////////////////////////////////////////////////
//
// IMPORTANT NOTE: This feature did not meet performance goals, 
// so using it is not recommended. The code to enable jpeg-diff 
// streaming is commented out and will be removed in the future.
//
//var decoderArrayV1 = [-128, -127, -126, -125, -124, -123, -122, -121, -120, -119, -118, -117, -116, -115, -114, -113, -112, -111, -110, -109, -108, -107, -106, -105, -104, -103, -102, -101, -100, -99, -98, -97, -96, -95, -94, -93, -92, -91, -90, -89, -88, -87, -86, -85, -84, -83, -82, -81, -80, -79, -78, -77, -76, -75, -74, -73, -72, -71, -70, -69, -68, -67, -66, -65, -64, -63, -62, -61, -60, -59, -58, -57, -56, -55, -54, -53, -52, -51, -50, -49, -48, -47, -46, -45, -44, -43, -42, -41, -40, -39, -38, -37, -36, -35, -34, -33, -32, -31, -30, -29, -28, -27, -26, -25, -24, -23, -22, -21, -20, -19, -18, -17, -16, -15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127];
//var decoderArrayV2 = [-255, -253, -251, -249, -247, -245, -243, -241, -239, -237, -235, -233, -231, -229, -227, -225, -223, -221, -219, -217, -215, -213, -211, -209, -207, -205, -203, -201, -199, -197, -195, -193, -191, -189, -187, -185, -183, -181, -179, -177, -175, -173, -171, -169, -167, -165, -163, -161, -159, -157, -155, -153, -151, -149, -147, -145, -143, -141, -139, -137, -135, -133, -131, -129, -127, -125, -123, -121, -119, -117, -115, -113, -111, -109, -107, -105, -103, -101, -99, -97, -95, -93, -91, -89, -87, -85, -83, -81, -79, -77, -75, -73, -71, -69, -67, -65, -63, -61, -59, -57, -55, -53, -51, -49, -47, -45, -43, -41, -39, -37, -35, -33, -31, -29, -27, -25, -23, -21, -19, -17, -15, -13, -11, -9, -7, -5, -3, -1, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99, 101, 103, 105, 107, 109, 111, 113, 115, 117, 119, 121, 123, 125, 127, 129, 131, 133, 135, 137, 139, 141, 143, 145, 147, 149, 151, 153, 155, 157, 159, 161, 163, 165, 167, 169, 171, 173, 175, 177, 179, 181, 183, 185, 187, 189, 191, 193, 195, 197, 199, 201, 203, 205, 207, 209, 211, 213, 215, 217, 219, 221, 223, 225, 227, 229, 231, 233, 235, 237, 239, 241, 243, 245, 247, 249, 251, 253, 255];
//var decoderArrayV3 = [-255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -251, -243, -235, -227, -219, -211, -203, -195, -187, -179, -171, -163, -155, -147, -139, -131, -125, -122, -117, -114, -109, -106, -101, -98, -93, -90, -85, -82, -77, -74, -69, -66, -62, -59, -56, -53, -50, -47, -44, -41, -38, -35, -32, -29, -26, -23, -20, -17, -15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 67, 70, 75, 78, 83, 86, 91, 94, 99, 102, 107, 110, 115, 118, 123, 126, 132, 140, 148, 156, 164, 172, 180, 188, 196, 204, 212, 220, 228, 236, 244, 252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255];
//var decoderArrayV4 = [-255, -253, -250, -247, -244, -241, -238, -235, -232, -229, -226, -223, -220, -217, -214, -211, -208, -205, -202, -199, -196, -193, -190, -187, -184, -181, -178, -175, -172, -169, -166, -163, -160, -156, -153, -150, -147, -144, -141, -138, -135, -132, -129, -126, -123, -120, -117, -114, -111, -108, -105, -102, -99, -96, -93, -90, -87, -84, -81, -78, -75, -72, -69, -66, -64, -63, -62, -61, -60, -59, -58, -57, -56, -55, -54, -53, -52, -51, -50, -49, -48, -47, -46, -45, -44, -43, -42, -41, -40, -39, -38, -37, -36, -35, -34, -33, -32, -31, -30, -29, -28, -27, -26, -25, -24, -23, -22, -21, -20, -19, -18, -17, -16, -15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 67, 70, 73, 76, 79, 82, 85, 88, 92, 95, 98, 101, 104, 107, 110, 113, 116, 119, 122, 125, 128, 131, 134, 138, 141, 144, 147, 150, 153, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 187, 190, 193, 196, 199, 202, 205, 208, 211, 214, 217, 220, 223, 226, 229, 233, 236, 239, 242, 245, 248, 251, 254];

//var clientJpegDiffStreamVersion = 1;
//var serverJpegDiffStreamVersions = new Array();
//var diffJpegFrameNumber = 0;
//var myUID = generateUIDNotMoreThan1million();
//var startOverJpegDiff = true;
//var timeLastJpegDiffKeyframe = 0;
//function RestartJpegDiffStreamIfTimeForNewKeyframe()
//{
//	if (new Date().getTime() - parseInt(settings.ui2_jpegDiffKeyframeIntervalMs) > timeLastJpegDiffKeyframe)
//		RestartJpegDiffStream();
//}
//function RestartJpegDiffStream()
//{
//	diffJpegFrameNumber = 0;
//	startOverJpegDiff = true;
//	timeLastJpegDiffKeyframe = new Date().getTime();
//}
//function QueryJpegDiffCompatibility()
//{
//	$.ajax("jpegdiffversions")
//	.done(function (response)
//	{
//		try
//		{
//			var strs = response.split('|');
//			for (var i = 0; i < strs.length; i++)
//				serverJpegDiffStreamVersions.push(parseInt(strs[i]));
//			showSuccessToast("Server has jpegdiff versions " + serverJpegDiffStreamVersions.join(','));
//		}
//		catch (ex)
//		{
//		}
//	});
//}
//function HandleJpegDiffImage(applyFilter)
//{
//	if ($("#camimg").attr("jpegDiff") == "1")
//	{
//		if (diffJpegFrameNumber == 0)
//		{
//			// This is a keyframe, so the frame we just received goes straight to the invisible buffer, bypassing the diff frame calculations.
//			CopyImageToCanvas("camimg", "camimg_jpegdiff_canvas", false);
//		}
//		else
//		{
//			// We just received a diff frame.
//			CopyImageToCanvas("camimg", "camimg_jpegdiff_diffframe_canvas", false);
//			ApplyJpegDiffAlgorithm("camimg_jpegdiff_canvas", "camimg_jpegdiff_diffframe_canvas", parseInt($("#camimg").attr("jpegDiffVersion")));
//		}
//		// Copy invisible buffer to the displayed canvas, and apply any necessary filters.
//		CopyCanvasToCanvas("camimg_jpegdiff_canvas", "camimg_canvas", applyFilter);
//		if ($("#video_filter_preview_canvas").length == 1)
//			CopyCanvasToCanvas("camimg_canvas", "video_filter_preview_canvas", !applyFilter);
//		diffJpegFrameNumber++;
//		return true;
//	}
//	return false;
//}
//function ApplyJpegDiffAlgorithm(renderToCanvasId, diffFrameCanvasId, version)
//{
//	var renderToCanvas = $("#" + renderToCanvasId).get(0);
//	var renderToCanvas_context2d = renderToCanvas.getContext("2d");
//	var renderToCanvas_imgData = renderToCanvas_context2d.getImageData(0, 0, renderToCanvas.width, renderToCanvas.height);
//	var rgba = renderToCanvas_imgData.data;

//	var diffFrameCanvas = $("#" + diffFrameCanvasId).get(0);
//	var diffFrameCanvas_context2d = diffFrameCanvas.getContext("2d");
//	var diffFrameCanvas_imgData = diffFrameCanvas_context2d.getImageData(0, 0, diffFrameCanvas.width, diffFrameCanvas.height);
//	var diff_rgba = diffFrameCanvas_imgData.data;

//	//var ctr = -1;
//	// Apply algorithm
//	var decoderArray = decoderArrayV1;
//	if (version == 2)
//		decoder = decoderArrayV2;
//	else if (version == 3)
//		decoder = decoderArrayV3;
//	else if (version == 4)
//		decoder = decoderArrayV4;
//	for (var i = 0; i < rgba.length; i++)
//	{
//		if (rgba[i] == 255 && diff_rgba[i] == 255)
//			continue;
//		var newVal = rgba[i] + decoderArrayV1[diff_rgba[i]]
//		if (newVal < 0)
//			rgba[i] = 0;
//		else if (newVal > 255)
//			rgba[i] = 255;
//		else
//			rgba[i] = newVal;
//	}

//	renderToCanvas_context2d.putImageData(renderToCanvas_imgData, 0, 0);
//}
///////////////////////////////////////////////////////////////
// Canvas Drawing /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
// Contains a selector string for the currently visible img or canvas element being used for live rendering.  The value is either "#camimg" or "#camimg_canvas"
var camImgElementSelector = "#camimg";
var customVideoFilter = null;
var video_filter_preview_canvas_cleared = false;
function DrawToCanvas()
{
	if (settings.ui2_enableCanvasDrawing == "1")
	{
		//if (!HandleJpegDiffImage(settings.ui2_enableVideoFilter == "1"))
		//{
		CopyImageToCanvas("camimg", "camimg_canvas", settings.ui2_enableVideoFilter == "1");
		if ($("#video_filter_preview_canvas").length == 1)
		{
			CopyImageToCanvas("camimg", "video_filter_preview_canvas", true);
			video_filter_preview_canvas_cleared = false;
		}
		//}
	}
	else
	{
		if ($("#video_filter_preview_canvas").length == 1 && !video_filter_preview_canvas_cleared)
		{
			video_filter_preview_canvas_cleared = true;
			ClearCanvas("video_filter_preview_canvas");
		}
	}
}
function ClearCanvas(canvasId)
{
	var canvas = $("#" + canvasId).get(0);
	var context2d = canvas.getContext("2d");
	context2d.clearRect(0, 0, canvas.width, canvas.height);
}
function CopyImageToCanvas(imgId, canvasId, applyVideoFilter)
{
	var camimg = $("#" + imgId).get(0);
	var canvas = $("#" + canvasId).get(0);
	canvas.width = camimg.naturalWidth;
	canvas.height = camimg.naturalHeight;

	var context2d = canvas.getContext("2d");
	context2d.drawImage(camimg, 0, 0);
	if (applyVideoFilter)
		ApplyVideoFilter(context2d, canvas);
}
function CopyCanvasToCanvas(canvasSourceId, canvasTargetId, applyVideoFilter)
{
	var canvasSource = $("#" + canvasSourceId).get(0);
	var canvasTarget = $("#" + canvasTargetId).get(0);
	canvasTarget.width = canvasSource.width;
	canvasTarget.height = canvasSource.height;

	var canvasTarget_context2d = canvasTarget.getContext("2d");
	canvasTarget_context2d.drawImage(canvasSource, 0, 0);
	if (applyVideoFilter)
		ApplyVideoFilter(canvasTarget_context2d, canvasTarget);
}
///////////////////////////////////////////////////////////////
// Video Filters //////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function ReloadCustomVideoFilter()
{
	try
	{
		eval("customVideoFilter = function(rgba) { " + settings.ui2_preferredVideoFilter + " }");
		if (loadingFinished)
		{
			if (!isCamimgElementBusy)
				DrawToCanvas();
			showSuccessToast("Filter set");
		}
	}
	catch (ex) { showErrorToast(ex); }
}
function ApplyVideoFilter(context2d, canvas)
{
	var imgData = context2d.getImageData(0, 0, canvas.width, canvas.height);
	var rgba = imgData.data;
	applyCustomVideoFilter(rgba);
	context2d.putImageData(imgData, 0, 0);
}
function applyCustomVideoFilter(rgba)
{
	if (customVideoFilter)
		try
		{
			customVideoFilter(rgba);
		}
		catch (ex)
		{
			showErrorToast(ex);
			customVideoFilter = null;
		}
}
var preservedCustomFilterUserInput = "";
var preservedCustomFilterUserInputToast = null;
function loadPredefinedFilter(filterName)
{
	var textarea = $("#optionDialog_option_ui2_preferredVideoFilter");
	preservedCustomFilterUserInput = textarea.val();
	settings.ui2_preferredVideoFilter = eval("predefined_filter_" + filterName);
	textarea.val(settings.ui2_preferredVideoFilter);
	ReloadCustomVideoFilter();
	dismissPreviousUndoToasts();
	showInfoToast('<div onclick="undoCustomVideoFilterChange(this)" class="customVideoFilterUndoToast">The Custom Video Filter script has been replaced. '
		+ 'Click this message to UNDO.</div>', 15000, true);
}
function dismissPreviousUndoToasts()
{
	$(".customVideoFilterUndoToast").parents(".toast").children(".toast-close-button").click();
}
function undoCustomVideoFilterChange(ele)
{
	$(ele).parents(".toast").children(".toast-close-button").click();
	var textarea = $("#optionDialog_option_ui2_preferredVideoFilter");
	settings.ui2_preferredVideoFilter = preservedCustomFilterUserInput;
	textarea.val(settings.ui2_preferredVideoFilter);
	ReloadCustomVideoFilter();
}
var predefined_filter_red1 = "// predefined_filter_red1\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	rgba[i + 1] = 0;\n\
	rgba[i + 2] = 0;\n\
}";
var predefined_filter_red2 = "// predefined_filter_red2\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	if (rgba[i] < rgba[i + 1])\n\
		rgba[i] = rgba[i + 1];\n\
	if (rgba[i] < rgba[i + 2])\n\
		rgba[i] = rgba[i + 2];\n\
	rgba[i + 1] = 0;\n\
	rgba[i + 2] = 0;\n\
}";
var predefined_filter_red3 = "// predefined_filter_red3\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	rgba[i] = (rgba[i] + rgba[i + 1] + rgba[i + 2]) / 3;\n\
	rgba[i + 1] = 0;\n\
	rgba[i + 2] = 0;\n\
}";
var predefined_filter_ghost = "// predefined_filter_ghost\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	rgba[i + 3] = (rgba[i] + rgba[i + 1] + rgba[i + 2]) / 3;\n\
}";
var predefined_filter_invert = "// predefined_filter_invert\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	rgba[i] = 255 - rgba[i];\n\
	rgba[i + 1] = 255 - rgba[i + 1];\n\
	rgba[i + 2] = 255 - rgba[i + 2];\n\
}";
var predefined_filter_invert_red3 = "// predefined_filter_invert_red3\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	rgba[i] = 255 - (rgba[i] + rgba[i + 1] + rgba[i + 2]) / 3;\n\
	rgba[i + 1] = 0;\n\
	rgba[i + 2] = 0;\n\
}";
///////////////////////////////////////////////////////////////
// Image Digital Zoom / Mouse Handlers ////////////////////////
///////////////////////////////////////////////////////////////
var zoomHintTimeout = null;
var digitalZoom = 0;
var zoomTable = [0, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 23, 26, 30, 35, 40, 45, 50];
var imageIsDragging = false;
var imageIsLargerThanAvailableSpace = false;
var mouseX = 0;
var mouseY = 0;
var imgDigitalZoomOffsetX = 0;
var imgDigitalZoomOffsetY = 0;
var previousImageDraw = new Object();
previousImageDraw.x = -1;
previousImageDraw.y = -1;
previousImageDraw.w = -1;
previousImageDraw.h = -1;
previousImageDraw.z = 10;

function ImgResized()
{
	var imgAvailableWidth = $("#layoutbody").width();
	var imgAvailableHeight = $("#layoutbody").height();

	// Calculate new size based on zoom levels
	var imgDrawWidth = currentlyLoadedImage.fullwidth * (zoomTable[digitalZoom]);
	var imgDrawHeight = currentlyLoadedImage.fullheight * (zoomTable[digitalZoom]);
	if (imgDrawWidth == 0)
	{
		imgDrawWidth = imgAvailableWidth;
		imgDrawHeight = imgAvailableHeight;

		var newRatio = imgDrawWidth / imgDrawHeight;
		if (newRatio < currentlyLoadedImage.aspectratio)
			imgDrawHeight = imgDrawWidth / currentlyLoadedImage.aspectratio;
		else
			imgDrawWidth = imgDrawHeight * currentlyLoadedImage.aspectratio;
	}
	$("#camimg,#camimg_canvas").css("width", imgDrawWidth + "px");
	$("#camimg,#camimg_canvas").css("height", imgDrawHeight + "px");

	imageIsLargerThanAvailableSpace = imgDrawWidth > imgAvailableWidth || imgDrawHeight > imgAvailableHeight;

	if (previousImageDraw.z > -1 && previousImageDraw.z != digitalZoom)
	{
		// We just experienced a zoom change
		// Find the mouse position percentage relative to the center of the image at its old size
		var imgPos = $(camImgElementSelector).position();
		var leftMenuWidth = $("#layoutleft").outerWidth(true);
		var topMenuHeight = $("#layouttop").outerHeight(true);
		var mouseRelX = -0.5 + (parseFloat((mouseX - leftMenuWidth) - imgPos.left) / previousImageDraw.w);
		var mouseRelY = -0.5 + (parseFloat((mouseY - topMenuHeight) - imgPos.top) / previousImageDraw.h);
		// Get the difference in image size
		var imgSizeDiffX = imgDrawWidth - previousImageDraw.w;
		var imgSizeDiffY = imgDrawHeight - previousImageDraw.h;
		// Modify the zoom offsets by % of difference
		imgDigitalZoomOffsetX -= mouseRelX * imgSizeDiffX;
		imgDigitalZoomOffsetY -= mouseRelY * imgSizeDiffY;
	}

	// Enforce digital panning limits
	var maxOffsetX = (imgDrawWidth - imgAvailableWidth) / 2;
	if (maxOffsetX < 0)
		imgDigitalZoomOffsetX = 0;
	else if (imgDigitalZoomOffsetX > maxOffsetX)
		imgDigitalZoomOffsetX = maxOffsetX;
	else if (imgDigitalZoomOffsetX < -maxOffsetX)
		imgDigitalZoomOffsetX = -maxOffsetX;

	var maxOffsetY = (imgDrawHeight - imgAvailableHeight) / 2;
	if (maxOffsetY < 0)
		imgDigitalZoomOffsetY = 0;
	else if (imgDigitalZoomOffsetY > maxOffsetY)
		imgDigitalZoomOffsetY = maxOffsetY;
	else if (imgDigitalZoomOffsetY < -maxOffsetY)
		imgDigitalZoomOffsetY = -maxOffsetY;

	// Calculate new image position
	var proposedX = (((imgAvailableWidth - imgDrawWidth) / 2) + imgDigitalZoomOffsetX);
	var proposedY = (((imgAvailableHeight - imgDrawHeight) / 2) + imgDigitalZoomOffsetY);

	$("#camimg,#camimg_canvas").css("left", proposedX + "px");
	$("#camimg,#camimg_canvas").css("top", proposedY + "px");

	// Store new image position for future calculations
	previousImageDraw.x = proposedX;
	previousImageDraw.x = proposedY;
	previousImageDraw.w = imgDrawWidth;
	previousImageDraw.h = imgDrawHeight;
	previousImageDraw.z = digitalZoom;
}
function DigitalZoomNow(deltaY)
{
	if (deltaY < 0)
		digitalZoom -= 1;
	else if (deltaY > 0)
		digitalZoom += 1;
	if (digitalZoom < 0)
		digitalZoom = 0;
	else if (digitalZoom >= zoomTable.length)
		digitalZoom = zoomTable.length - 1;

	$("#zoomhint").stop(true, true);
	$("#zoomhint").show();
	$("#zoomhint").html(digitalZoom == 0 ? "Fit" : (zoomTable[digitalZoom] + "x"))
	RepositionZoomHint();
	if (zoomHintTimeout != null)
		clearTimeout(zoomHintTimeout);
	zoomHintTimeout = setTimeout(function () { $("#zoomhint").fadeOut() }, 200);

	ImgResized();

	SetCamCellCursor();
}
$(function ()
{
	$('#layoutbody').mousewheel(function (e, delta, deltaX, deltaY)
	{
		if (settings.ui2_enableDigitalZoom != "1")
			return;
		e.preventDefault();
		DigitalZoomNow(deltaY);
	});
	$('#layoutbody,#zoomhint').mousedown(function (e)
	{
		if (e.which == 1)
		{
			mouseX = e.pageX;
			mouseY = e.pageY;
			imageIsDragging = true;
			SetCamCellCursor();
			e.preventDefault();
		}
	});
	$(document).mouseup(function (e)
	{
		if (e.which == 1)
		{
			if (camImgClickState.mouseDown)
			{
				if (Math.abs(camImgClickState.mouseX - e.pageX) <= mouseMoveTolerance
			 || Math.abs(camImgClickState.mouseY - e.pageY) <= mouseMoveTolerance)
				{
					camImgClickState.mouseDown = false;
					ImgClick(e);
				}
			}
			imageIsDragging = false;
			SetCamCellCursor();

			mouseX = e.pageX;
			mouseY = e.pageY;
		}
	});
	$('#layoutbody').mouseleave(function (e)
	{
		camImgClickState.mouseDown = false;
		var ofst = $("#layoutbody").offset();
		if (e.pageX < ofst.left || e.pageY < ofst.top || e.pageX >= ofst.left + $("#layoutbody").width() || e.pageY >= ofst.top + $("#layoutbody").height())
		{
			imageIsDragging = false;
			isDraggingSeekbar = false;
			SetCamCellCursor();
		}
		mouseX = e.pageX;
		mouseY = e.pageY;
	});
	$(document).mouseleave(function (e)
	{
		camImgClickState.mouseDown = false;
		imageIsDragging = false;
		isDraggingSeekbar = false;
		SetCamCellCursor();
	});
	$(document).on("mousemove touchmove", function (e)
	{
		if (typeof e.pageX == "undefined")
			e.pageX = e.originalEvent.touches[0].pageX;
		if (typeof e.pageY == "undefined")
			e.pageY = e.originalEvent.touches[0].pageY;

		if (camImgClickState.mouseDown)
		{
			if ((Math.abs(camImgClickState.mouseX - e.pageX) > mouseMoveTolerance
			 || Math.abs(camImgClickState.mouseY - e.pageY) > mouseMoveTolerance))
			{
				camImgClickState.mouseDown = false;
			}
			else
				return;
		}
		var requiresImgResize = false;
		if (imageIsDragging && imageIsLargerThanAvailableSpace)
		{
			imgDigitalZoomOffsetX += (e.pageX - mouseX);
			imgDigitalZoomOffsetY += (e.pageY - mouseY);
			requiresImgResize = true;
		}

		mouseX = e.pageX;
		mouseY = e.pageY;

		if (requiresImgResize)
			ImgResized();

		if ($("#zoomhint").is(":visible"))
			RepositionZoomHint();

		HandleSeekbarMouseMove();

		PositionPlaybackControls();
	});
});
var mouseMoveTolerance = 5;
var camImgClickState = new Object();
camImgClickState.mouseDown = false;
camImgClickState.mouseX = 0;
camImgClickState.mouseY = 0;
function RegisterCamImgClickHandler()
{
	$('#camimg').mousedown(function (e)
	{
		camImgClickState.mouseDown = true;
		camImgClickState.mouseX = e.pageX;
		camImgClickState.mouseY = e.pageY;
	});
	$('#camimg_canvas').mousedown(function (e)
	{
		camImgClickState.mouseDown = true;
		camImgClickState.mouseX = e.pageX;
		camImgClickState.mouseY = e.pageY;
	});
}
function RepositionZoomHint()
{
	$("#zoomhint").css("left", (mouseX - $("#zoomhint").outerWidth(true)) + "px").css("top", (mouseY - $("#zoomhint").outerHeight(true)) + "px");
}
function SetCamCellCursor()
{
	var outerObjs = $('#layoutbody,#camimg,#camimg_canvas,#zoomhint');
	if (imageIsLargerThanAvailableSpace)
	{
		if (imageIsDragging)
		{
			outerObjs.removeClass("grabcursor");
			outerObjs.addClass("grabbingcursor");
		}
		else
		{
			outerObjs.removeClass("grabbingcursor");
			outerObjs.addClass("grabcursor");
		}
	}
	else
	{
		outerObjs.removeClass("grabcursor");
		outerObjs.removeClass("grabbingcursor");
		var innerObjs = $('#camimg,#camimg_canvas,#zoomhint');
		innerObjs.css("cursor", "default");
	}
}
///////////////////////////////////////////////////////////////
// Seek bar stuff /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var isDraggingSeekbar = false;
var currentSeekBarPositionRelative = 0.0;
var lastSeekBarMouseDownStarted = new Date().getTime() - 9999;
var lastSeekBarDoubleMouseDownStarted = new Date().getTime() - 9999;
$(function ()
{
	$("#playback_seekbar").on("mousedown touchstart", function (e)
	{
		if (e.which <= 1 && !currentlyLoadingImage.isLive && settings.ui2_clipPlaybackSeekBarEnabled == "1")
		{
			var thisTime = new Date().getTime();
			if (thisTime < lastSeekBarMouseDownStarted + doubleClickTime)
				lastSeekBarDoubleMouseDownStarted = lastSeekBarMouseDownStarted;
			if (typeof e.pageX == "undefined")
			{
				e.pageX = e.originalEvent.touches[0].pageX;
				e.pageY = e.originalEvent.touches[0].pageY;
			}
			lastSeekBarMouseDownStarted = thisTime;
			setMousePosVars(e);
			isDraggingSeekbar = true;
			HandleSeekbarMouseMove();
			return stopDefault(e);
		}
	});
	$(document).on("mouseup touchend touchcancel", function (e)
	{
		setMousePosVars(e);
		HandleSeekbarMouseMove();
		isDraggingSeekbar = false;
		if (new Date().getTime() < lastSeekBarDoubleMouseDownStarted + doubleClickTime)
			seekBarDblClick();
	});
});
function setMousePosVars(e)
{
	if (typeof e.pageX == "undefined" || typeof e.pageY == "undefined")
	{
		if (e.originalEvent.touches.length == 0)
			return;
		else
		{
			e.pageX = e.originalEvent.touches[0].pageX;
			e.pageY = e.originalEvent.touches[0].pageY;
		}
	}
	if (typeof e.pageX == "undefined" || typeof e.pageY == "undefined")
		return;
	mouseX = e.pageX;
	mouseY = e.pageY;
}
function HandleSeekbarMouseMove()
{
	if (isDraggingSeekbar)
	{
		Playback_Pause();
		var seekbarX = $("#playback_seekbar").offset().left;
		var seekbarW = $("#playback_seekbar").width();
		if (seekbarW < 1)
			seekbarW = 1;
		var newSeekHandlePos = mouseX - seekbarX;
		if (newSeekHandlePos < 0)
			newSeekHandlePos = 0;
		else if (newSeekHandlePos >= seekbarW)
			newSeekHandlePos = seekbarW;
		currentSeekBarPositionRelative = newSeekHandlePos / seekbarW;
		if (currentSeekBarPositionRelative < 0)
			currentSeekBarPositionRelative = 0;
		else if (currentSeekBarPositionRelative > 1)
			currentSeekBarPositionRelative = 1;
		$("#playback_seekbar_handle").css("left", newSeekHandlePos - 10 + "px");
		SetPlaybackPositionRelative(currentSeekBarPositionRelative);
		PositionPlaybackControls();
	}
}
function SetPlaybackPositionRelative(positionRelative)
{
	if (currentlyLoadingImage.msec == 1)
		clipPlaybackPosition = 0;
	else
		clipPlaybackPosition = parseInt(positionRelative * (currentlyLoadingImage.msec - 1));
}
function SetSeekbarPositionByPlaybackTime(timeValue)
{
	if (settings.ui2_clipPlaybackSeekBarEnabled == "1")
	{
		if (currentlyLoadingImage.msec == 1)
			currentSeekBarPositionRelative = 1;
		else
			currentSeekBarPositionRelative = parseFloat(timeValue / (currentlyLoadingImage.msec - 1));
		var seekbarW = $("#playback_seekbar").width();
		var newSeekHandlePos = currentSeekBarPositionRelative * seekbarW;
		$("#playback_seekbar_handle").css("left", newSeekHandlePos - 10 + "px");
		$("#playback_position").text(msToTime(timeValue));
		$("#playback_remaining").text("-" + msToTime(currentlyLoadingImage.msec - 1 - timeValue));
	}
}
function seekBarDblClick()
{
	Playback_Play();
}
///////////////////////////////////////////////////////////////
// Click-to-select ////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function ImgClick(event)
{
	if (!currentlyLoadingImage.isLive || hasOnlyOneCamera)
		return;
	var camData = GetCameraUnderMousePointer(event);
	if (camData != null)
	{
		ImgClick_Camera(camData);
	}
}
function ImgClick_Camera(camData)
{
	if (camData.optionValue == currentlyLoadedImage.id)
		camData = GetGroupCamera(currentlySelectedHomeGroupId);
	LoadLiveCamera(camData);
}
function GetCameraUnderMousePointer(event)
{
	// Find out which camera is under the mouse pointer, if any.
	mouseX = event.pageX;
	mouseY = event.pageY;

	var imgPos = $(camImgElementSelector).position();
	var leftMenuWidth = $("#layoutleft").outerWidth(true);
	var topMenuHeight = $("#layouttop").is(":visible") ? $("#layouttop").outerHeight(true) : 0;
	var mouseRelX = parseFloat((mouseX - leftMenuWidth) - imgPos.left) / previousImageDraw.w;
	var mouseRelY = parseFloat((mouseY - topMenuHeight) - imgPos.top) / previousImageDraw.h;

	var x = currentlyLoadedImage.fullwidth * mouseRelX;
	var y = currentlyLoadedImage.fullheight * mouseRelY;
	var camData = lastCameraListResponse.data;
	for (var i = 0; i < camData.length; i++)
	{
		if (currentlyLoadedImage.id == camData[i].optionValue)
		{
			if (typeof camData[i].group != "undefined")
			{
				for (var j = 0; j < camData[i].rects.length; j++)
				{
					if (x > camData[i].rects[j][0] && y > camData[i].rects[j][1] && x < camData[i].rects[j][2] && y < camData[i].rects[j][3])
						return GetCameraWithId(camData[i].group[j]);
				}
			}
			else
			{
				return camData[i];
			}
		}
	}
	return null;
}
function GetCameraWithId(cameraId)
{
	var camData = lastCameraListResponse.data;
	for (var i = 0; i < camData.length; i++)
	{
		if (cameraId == camData[i].optionValue)
			return camData[i];
	}
	return null;
}
function LoadLiveCamera(camData)
{
	currentlyLoadingCamera = camData;
	UpdateSelectedLiveCameraFields();
}
function LoadClipWithPath(clipPath, camId, msec)
{
	var camData = lastCameraListResponse.data;
	for (var i = 0; i < camData.length; i++)
	{
		if (camId == camData[i].optionValue)
		{
			currentlyLoadingCamera = camData[i];
			UpdateSelectedClipFields(clipPath, msec);
			Playback_Play();
			break;
		}
	}
}
var allPtzControlsSelector = "#ptz_pt_wrapper,#ptz_z_wrapper,#ptz_presets_1_wrapper,#ptz_presets_2_wrapper";
var isFirstUpdateSelectedLiveCameraFields = true;
function UpdateSelectedLiveCameraFields()
{
	digitalZoom = 0;
	currentlyLoadingImage.id = currentlyLoadingCamera.optionValue;
	currentlyLoadingImage.fullwidth = currentlyLoadingCamera.width;
	currentlyLoadingImage.fullheight = currentlyLoadingCamera.height;
	currentlyLoadingImage.aspectratio = currentlyLoadingImage.fullwidth / currentlyLoadingImage.fullheight;
	currentlyLoadingImage.path = currentlyLoadingCamera.optionValue;
	currentlyLoadingImage.isLive = true;
	currentlyLoadingImage.ptz = currentlyLoadingCamera.ptz;
	currentlyLoadingImage.audio = currentlyLoadingCamera.audio;
	clipPlaybackPosition = timeLastClipFrame = 0;
	if ($("#btnGoLive").is(":visible"))
	{
		$("#btnGoLive").hide();
		DisableGoLiveButtonFlashing();
		$("#btnGoLive").removeClass("flashing");
	}
	$("#playback_controls").hide();
	if (currentlyLoadingImage.ptz)
	{
		LoadPtzPresetThumbs();
		$(allPtzControlsSelector).show();
	}
	else
		$(allPtzControlsSelector).hide();
	audioStop();
	if (currentlyLoadingImage.audio)
	{
		$("#audio_icon").show();
		if (settings.ui2_audioAutoPlay == "1")
			audioPlay();
	}
	else
		$("#audio_icon").hide();

	$("#selectedCameraName").show();
	$("#selectedCameraName").text(CleanUpGroupName(currentlyLoadingCamera.optionDisplay));
	$("#clipsCameraName").show();
	if (settings.ui2_autoLoadClipList == "1" && !isFirstUpdateSelectedLiveCameraFields)
	{
		LoadClips(settings.ui2_preferredClipList, currentlyLoadingCamera.optionValue);
	}
	if (!isFirstUpdateSelectedLiveCameraFields)
	{
		//RestartJpegDiffStream();
		GetNewImage();
	}
	isFirstUpdateSelectedLiveCameraFields = false;
}
var isFirstUpdateSelectedClipFields = true;
function UpdateSelectedClipFields(clipPath, msec)
{
	digitalZoom = 0;
	currentlyLoadingImage.id = currentlyLoadingCamera.optionValue;
	currentlyLoadingImage.fullwidth = currentlyLoadingCamera.width;
	currentlyLoadingImage.fullheight = currentlyLoadingCamera.height;
	currentlyLoadingImage.aspectratio = currentlyLoadingImage.fullwidth / currentlyLoadingImage.fullheight;
	currentlyLoadingImage.path = clipPath;
	currentlyLoadingImage.isLive = false;
	currentlyLoadingImage.ptz = false;
	currentlyLoadingImage.audio = false;
	currentlyLoadingImage.msec = parseInt(msec);
	timeLastClipFrame = new Date().getTime();
	clipPlaybackPosition = 0;
	if (!$("#btnGoLive").is(":visible"))
	{
		$("#btnGoLive").fadeIn();
		EnableGoLiveButtonFlashing();
		$("#btnGoLive").addClass("flashing");
	}
	$("#playback_controls").show();
	$(allPtzControlsSelector).hide();
	$("#clipsCameraName").hide();
	if (!isFirstUpdateSelectedClipFields)
	{
		//RestartJpegDiffStream();
		GetNewImage();
	}
	isFirstUpdateSelectedClipFields = false;
}
function GetGroupCamera(groupId)
{
	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		if (CameraIsGroupOrCycle(lastCameraListResponse.data[i]))
		{
			if (lastCameraListResponse.data[i].optionValue == groupId)
			{
				return lastCameraListResponse.data[i];
			}
		}
	}
	return null;
}
function CameraIsGroupOrCycle(cameraObj)
{
	return cameraObj.group || cameraObj.optionValue.startsWith("@");
}
function CameraIsGroupOrCamera(cameraObj)
{
	return cameraObj.group || !cameraObj.optionValue.startsWith("@");
}
///////////////////////////////////////////////////////////////
// On-screen Toast Messages ///////////////////////////////////
///////////////////////////////////////////////////////////////
function showToastInternal(type, message, showTime, closeButton)
{
	var overrideOptions = {};

	if (showTime)
		overrideOptions.timeOut = showTime;

	if (closeButton)
	{
		overrideOptions.closeButton = true;
		overrideOptions.tapToDismiss = false;
		overrideOptions.extendedTimeOut = 60000;
	}

	toastr[type](message, null, overrideOptions);
}
function showSuccessToast(message, showTime, closeButton)
{
	showToastInternal('success', message, showTime, closeButton);
}
function showInfoToast(message, showTime, closeButton)
{
	showToastInternal('info', message, showTime, closeButton);
}
function showWarningToast(message, showTime, closeButton)
{
	showToastInternal('warning', message, showTime, closeButton);
}
function showErrorToast(message, showTime, closeButton)
{
	showToastInternal('error', message, showTime, closeButton);
}
$(function ()
{
	toastr.options = {
		"closeButton": false,
		"debug": false,
		"positionClass": "toast-bottom-right",
		"onclick": null,
		"showDuration": "300",
		"hideDuration": "1000",
		"timeOut": "3000",
		"extendedTimeOut": "3000",
		"showEasing": "swing",
		"hideEasing": "linear",
		"showMethod": "fadeIn",
		"hideMethod": "fadeOut"
	}
});

///////////////////////////////////////////////////////////////
// Context Menus //////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var lastLiveContextMenuSelectedCamera = null;
function LoadContextMenus()
{
	var optionLive =
	{
		alias: "cmroot_live", width: 150, items:
		  [
			  { text: "<span id=\"contextMenuCameraName\">Camera Name</span>", icon: "", alias: "cameraname" }
			  , { text: "Trigger Now", icon: "ui2/lightning32.png", alias: "trigger", action: onLiveContextMenuAction }
			  , { text: "<span title=\"Toggle Manual Recording\" id=\"manRecBtnLabel\">Toggle Recording</span>", icon: "ui2/record32.png", alias: "record", action: onLiveContextMenuAction }
			  , { text: "Restart Camera", icon: "ui2/reset32.png", alias: "restart", action: onLiveContextMenuAction }
			  , { type: "splitLine" }
			  , { text: "<span id=\"contextMenuMaximize\">Maximize</span>", icon: "ui2/fullscreen32.png", alias: "maximize", action: onLiveContextMenuAction }
			  , { type: "splitLine" }
			  , { text: "Properties", icon: "ui2/show32.png", alias: "properties", action: onLiveContextMenuAction }
		  /*,	{ text: "Group Three", icon: "sample-css/wi0062-16.gif", alias: "1-6", type: "group", width: 180, items:
		  [
		  { text: "Item One", icon: "sample-css/wi0096-16.gif", alias: "4-1", action: menuAction },
		  { text: "Item Two", icon: "sample-css/wi0122-16.gif", alias: "4-2", action: menuAction }
		  ]
		  }*/
		  ]
		, onContextMenu: onTriggerLiveContextMenu
		, onCancelContextMenu: onCancelContextMenu
		, onShow: onShowLiveContextMenu
	};
	var optionRecord =
	{
		alias: "cmroot_record", width: 150, items:
		  [
			  { text: "Go Live", icon: "ui2/live32.png", alias: "golive", action: onRecordContextMenuAction }
		  ]
		, onContextMenu: onTriggerRecordContextMenu
		, onCancelContextMenu: onCancelContextMenu
	};
	$("#camimg").contextmenu(optionRecord);
	$("#camimg").contextmenu(optionLive);
	$("#camimg_canvas").contextmenu(optionRecord);
	$("#camimg_canvas").contextmenu(optionLive);

	var optionHeading =
	{
		alias: "cmroot_heading", width: 150, items:
		  [
			  { text: "Log Out", icon: "ui2/door32.png", alias: "logout", action: onHeadingContextMenuAction }
		  ]
	};
	$("#logo").contextmenu(optionHeading);
}
function onTriggerLiveContextMenu(e)
{
	if (currentlyLoadingImage.isLive)
	{
		var camData = lastLiveContextMenuSelectedCamera = GetCameraUnderMousePointer(e);
		if (camData != null)
		{
			if (!CameraIsGroupOrCycle(camData))
				LoadDynamicManualRecordingButtonState(camData.optionValue);
			$("#contextMenuCameraName").text(CleanUpGroupName(camData.optionDisplay));
			$("#contextMenuCameraName").attr("title", "The buttons in this menu are specific to the camera: " + camData.optionDisplay);
			$("#contextMenuMaximize").text(camData.optionValue == currentlyLoadedImage.id ? "Back to Group" : "Maximize");
		}
		camImgClickState.mouseDown = false;
		return true;
	}
	return false;
}
function onShowLiveContextMenu(menu)
{
	//	if (lastLiveContextMenuSelectedCamera.optionValue == currentlyLoadedImage.id)
	//		menu.applyrule(
	//		{
	//			name: "disable_cameraname_maximize",
	//			disable: true,
	//			items: ["cameraname", "maximize"]
	//		});
	//	else
	if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
	{
		menu.applyrule(
			{
				name: "disable_camera_buttons",
				disable: true,
				items: ["cameraname", "trigger", "record", "maximize", "restart"]
			});
	}
	else
	{
		menu.applyrule(
			{
				name: "disable_cameraname",
				disable: true,
				items: ["cameraname"]
			});
	}
}
function onTriggerRecordContextMenu(e)
{
	if (!currentlyLoadingImage.isLive)
	{
		camImgClickState.mouseDown = false;
		return true;
	}
	return false;
}
function onLiveContextMenuAction()
{
	switch (this.data.alias)
	{
		case "maximize":
			if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
				showWarningToast("Function is unavailable.");
			else
				ImgClick_Camera(lastLiveContextMenuSelectedCamera);
			break;
		case "trigger":
			if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
				showWarningToast("You cannot trigger cameras that are part of an auto-cycle.");
			else
				TriggerCamera(lastLiveContextMenuSelectedCamera.optionValue);
			break;
		case "record":
			if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
				showWarningToast("You cannot toggle recording of cameras that are part of an auto-cycle.");
			else
				ManualRecordCamera(lastLiveContextMenuSelectedCamera.optionValue, $("#manRecBtnLabel").attr("start"));
			break;
		case "restart":
			if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
				showWarningToast("You cannot restart cameras that are part of an auto-cycle.");
			else
				ResetCamera(lastLiveContextMenuSelectedCamera.optionValue);
			break;
		case "properties":
		default:
			showErrorToast(this.data.alias + " is not implemented!");
			break;
	}
}
function onRecordContextMenuAction()
{
	switch (this.data.alias)
	{
		case "golive":
			goLive();
			break;
	}
}
function onHeadingContextMenuAction()
{
	switch (this.data.alias)
	{
		case "logout":
			logout();
			break;
		default:
			showErrorToast(this.data.alias + " is not implemented!");
			break;
	}
}
function onCancelContextMenu()
{
	//camImgClickState.mouseDown = false;
}
///////////////////////////////////////////////////////////////
// Options Dialog /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var optionDialogModal = null;
function openOptionsDialog(category)
{
	optionDialog_Close();
	var $optionsDialog = $("#optionsDialog");
	$optionsDialog.remove();
	$("body").append('<div id="optionsDialog" style="display: none"></div>');
	$optionsDialog = $("#optionsDialog");
	for (var i = 0; i < defaultSettings.length; i++)
	{
		var s = defaultSettings[i];
		if (s.preLabel)
		{
			if (typeof s.category == "undefined")
			{
				s.category = "Uncategorized";
				if (!OptionsCategoryExists(s.category))
					settingsCategoryList.push(s.category);
			}
			if (!OptionsCategoryExists(s.category))
			{
				showWarningToast("Category " + s.category + " does not exist in the category list!");
				settingsCategoryList.push(s.category);
			}
		}
	}
	var categoryLinks = new Array();
	for (var i = 0; i < settingsCategoryList.length; i++)
	{
		if (settingsCategoryList[i] == category)
			categoryLinks.push('<span style="text-decoration: underline">' + settingsCategoryList[i] + '</span>');
		else
			categoryLinks.push('<a href="javascript:openOptionsDialog(\'' + settingsCategoryList[i] + '\')">' + settingsCategoryList[i] + '</a>');
	}
	var heading = '<div class="optionsDialogHeading">UI2 Configuration</div>'
	+ '<div class="categoryLinks">' + categoryLinks.join(" | ") + '</div>';

	$optionsDialog.append(heading);

	if (category)
	{
		var styleCounter = 0;
		for (var i = 0; i < defaultSettings.length; i++)
		{
			var s = defaultSettings[i];
			if (s.preLabel && s.category == category && (typeof s.displayCondition != "function" || s.displayCondition()))
			{
				var markup = '<div style="' + (++styleCounter % 2 == 1 ? 'background-color: #505050;' : 'background-color: #707070;') + '"><div class="optionbox inlineblock">' + s.preLabel;
				if (s.inputType == "textarea")
					markup += '<br/><textarea style="min-width:98%;max-width:98%;height:200px;"';
				else
					markup += ' <input type="' + (s.inputType ? s.inputType : "text") + '"';
				markup += ' id="optionDialog_option_' + s.key + '" onchange="optionDialog_OptionChanged(\'' + s.key + '\')" />';
				if (s.postLabel)
					markup += s.postLabel;
				markup += '</div>';
				if (s.hint)
					markup += '<div class="hintbox inlineblock">' + s.hint + '</div>';
				markup += '<div style="clear:both;width:0px;height:0px;padding:0px;"></div></div>';
				$optionsDialog.append(markup);

				var $input = $("#optionDialog_option_" + s.key);
				var currentValue = settings[s.key];
				if ($input.get(0).tagName.toLowerCase() == "textarea")
				{
					$input.val(currentValue);
					$input.on('keydown', TextAreaKeyHandler);
				}
				else if ($input.attr('type') == "checkbox")
					$input.prop("checked", currentValue == "1");
				else if (s.hotkey)
				{
					$input.attr("hotkeyId", s.key);
					$input.bind("keydown", HandleHotkeyChange);
					var parts = currentValue.split("|");
					if (parts.length != 5)
						$input.val("unset");
					else
						$input.val((parts[0] == "1" ? "CTRL + " : "")
							+ (parts[1] == "1" ? "ALT + " : "")
							+ (parts[2] == "1" ? "SHIFT + " : "")
							+ parts[4]);
				}
				else
					$input.val(currentValue);
				if (typeof s.minValue != "undefined")
					$input.attr("min", s.minValue);
				if (typeof s.maxValue != "undefined")
					$input.attr("max", s.maxValue);
				if (typeof s.stepSize != "undefined")
					$input.attr("step", s.stepSize);
				if (s.inputWidth)
					$input.css("width", s.inputWidth + "px");

				if (s.onchange)
					$input.bind("change", s.onchange);
			}
		}
	}
	else
	{
		$optionsDialog.append("<div>Please select a category above.</div>");
	}
	optionDialogModal = $optionsDialog.modal();
}
function optionDialog_Close()
{
	if (optionDialogModal != null)
	{
		optionDialogModal.close();
		optionDialogModal = null;
	}
}
function OptionsCategoryExists(category)
{
	for (var i = 0; i < settingsCategoryList.length; i++)
		if (category == settingsCategoryList[i])
			return true;
	return false;
}
function optionDialog_OptionChanged(optionKey)
{
	var $input = $("#optionDialog_option_" + optionKey);
	var newValue;
	if ($input.get(0).tagName.toLowerCase() == "textarea")
		newValue = $input.val();
	else if ($input.attr('type') == "checkbox")
		newValue = $input.is(":checked") ? "1" : "0";
	else
		newValue = $input.val();

	var min = $input.attr("min");
	if (min)
	{
		if (parseInt(min) > parseInt(newValue))
		{
			showWarningToast("Value " + parseInt(newValue) + " is smaller than the minimum allowed value of " + parseInt(min));
			newValue = parseInt(min);
		}
	}
	var max = $input.attr("max");
	if (max)
	{
		if (parseInt(max) < parseInt(newValue))
		{
			showWarningToast("Value " + parseInt(newValue) + " is larger than the maximum allowed value of " + parseInt(max));
			newValue = parseInt(max);
		}
	}

	settings[optionKey] = newValue;
}
function onui2_showSystemNameChanged()
{
	if (settings.ui2_showSystemName == "1")
	{
		if ($("#system_name").text().length <= 9)
			$("#system_name").addClass("bigtext");
		$("#system_name").show();
		$("#fallback_logo").hide();
	}
	else
	{
		$("#system_name").hide();
		$("#fallback_logo").show();
	}
}
function onui2_showStoplightChanged()
{
	if (settings.ui2_showStoplight == "1")
		$("#stoplight").show();
	else
		$("#stoplight").hide();
}
function onui2_enableStoplightButtonChanged()
{
	if (settings.ui2_enableStoplightButton == "1")
		$("#stoplight").removeClass("disabled");
	else
		$("#stoplight").addClass("disabled");
}
function onui2_showCpuMemChanged()
{
	if (settings.ui2_showCpuMem == "1")
		$("#cpumem").show();
	else
		$("#cpumem").hide();
}
function onui2_showProfileChanged()
{
	if (settings.ui2_showProfile == "1")
		$("#profile_wrapper,#schedule_lock_wrapper").show();
	else
		$("#profile_wrapper,#schedule_lock_wrapper").hide();
}
function onui2_enableProfileButtonsChanged()
{
	if (settings.ui2_enableProfileButtons == "1")
	{
		$("#schedule_lock_button,.profilebtn").removeClass("disabled");
	}
	else
	{
		$("#schedule_lock_button,.profilebtn").addClass("disabled");
	}
}
function onui2_showScheduleChanged()
{
	if (settings.ui2_showSchedule == "1")
		$("#schedule_wrapper").show();
	else
		$("#schedule_wrapper").hide();
}
function onui2_enableScheduleButtonChanged()
{
}
function onui2_showDiskInfoChanged()
{
	if (settings.ui2_showDiskInfo == "1")
		$("#diskinfo").show();
	else
		$("#diskinfo").hide();
}
function onui2_diskInfoWidthChanged()
{
	$("#diskinfo").css("width", parseInt(settings.ui2_diskInfoWidth) + "px");
}
function onui2_enableFrameRateCounterChanged()
{
	if (settings.ui2_enableFrameRateCounter == "1")
		$("#fpsCounter").show();
	else
		$("#fpsCounter").hide();
}
function onui2_showSaveSnapshotButtonChanged()
{
	if (settings.ui2_showSaveSnapshotButton == "1")
		$("#save_snapshot_wrapper").show();
	else
		$("#save_snapshot_wrapper").hide();
}
function onui2_thumbnailLoadingThreadsChanged()
{
	RestartImageQueue();
}
function onui2_adminremembermeChanged()
{
	if (settings.ui2_adminrememberme == "1")
	{
		settings.ui2_adminusername = SimpleTextGibberize($("#txtUserName").val());
		settings.ui2_adminpassword = SimpleTextGibberize($("#txtPassword").val());
	}
	else
		settings.ui2_adminusername = settings.ui2_adminpassword = "";
}
function onui2_showQualityButtonChanged()
{
	if (settings.ui2_showQualityButton == "1")
		$("#quality").show();
	else
		$("#quality").hide();
}
function onui2_clipPlaybackSeekBarEnabledChanged()
{
	if (settings.ui2_clipPlaybackSeekBarEnabled == "0")
		$("#playback_position,#playback_remaining").text("");
}
function onui2_doAutoUpdateCheckChanged()
{
	if (settings.ui2_doAutoUpdateCheck == "1")
	{
		CheckForUpdates_Automatic();
	}
}
function onui2_enableCanvasDrawingChanged()
{
	if (settings.ui2_enableCanvasDrawing == "1")
	{
		camImgElementSelector = "#camimg_canvas";
		$("#camimg").hide();
		$("#camimg_canvas").show();
	}
	else
	{
		camImgElementSelector = "#camimg";
		$("#camimg_canvas").hide();
		$("#camimg").show();
	}
}
function onui2_enableVideoFilterChanged()
{
	if (!isCamimgElementBusy)
		DrawToCanvas();
}
function onui2_preferredVideoFilterChanged()
{
	ReloadCustomVideoFilter();
}
///////////////////////////////////////////////////////////////
// About Dialog ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function openAboutDialog()
{
	$("#aboutDialog").modal({ maxWidth: 500, maxHeight: 500 });
}
///////////////////////////////////////////////////////////////
// Login Dialog ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var loginModal = null;
function openLoginDialog()
{
	if (settings.ui2_adminrememberme == "1")
	{
		$("#txtUserName").val(SimpleTextGibberize(settings.ui2_adminusername));
		$("#txtPassword").val(SimpleTextGibberize(settings.ui2_adminpassword));
		$("#cbRememberMe").prop("checked", true);
	}
	else
		$("#cbRememberMe").prop("checked", false);
	loginModal = $("#loginDialog").modal({ maxWidth: 500, maxHeight: 300 });
}
function closeLoginDialog()
{
	if (loginModal != null)
	{
		loginModal.close();
		loginModal = null;
	}
}
//////////////////////////////////////////////////////////////////////
// GoLive Button Flashing ////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
var btnGoLiveFlashingEnabled = false;
function EnableGoLiveButtonFlashing()
{
	btnGoLiveFlashingEnabled = true;
	DoGoLiveButtonFlash();
}
function DoGoLiveButtonFlash()
{
	if (!btnGoLiveFlashingEnabled)
		return;
	setTimeout(function ()
	{
		$("#btnGoLive").css("background-color", "#3A3A3A");
		setTimeout(function ()
		{
			$("#btnGoLive").css("background-color", "#666666");
			DoGoLiveButtonFlash();
		}, 1000);
	}, 1000);
}
function DisableGoLiveButtonFlashing()
{
	btnGoLiveFlashingEnabled = false;
}
//////////////////////////////////////////////////////////////////////
// Hotkeys ///////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
function EnableHotkeys()
{
	$(document).keydown(function (e)
	{
		var retVal = true;
		if (settings.ui2_enableHotkeys == "1" && $(".ui2modal").length == 0)
		{
			for (var i = 0; i < defaultSettings.length; i++)
			{
				var s = defaultSettings[i];
				if (s.hotkey)
				{
					var parts = settings[s.key].split("|");
					if (parts.length == 5)
					{
						var charCode = e.which ? e.which : event.keyCode
						if ((e.ctrlKey ? "1" : "0") == parts[0]
							&& (e.altKey ? "1" : "0") == parts[1]
							&& (e.shiftKey ? "1" : "0") == parts[2]
							&& (charCode == parts[3]))
						{
							s.hotkeyAction();
							retVal = false;
						}
					}
				}
			}
		}
		if (!retVal)
			return retVal;
	});
}
function HandleHotkeyChange(e)
{
	var textBox = $(e.target);
	var charCode = e.which ? e.which : event.keyCode
	var modifiers = "";

	if (e.ctrlKey)
		modifiers += "CTRL + ";
	if (e.altKey)
		modifiers += "ALT + ";
	if (e.shiftKey)
		modifiers += "SHIFT + ";

	var keyName = String.fromCharCode(charCode);

	if (charCode == 8) keyName = "backspace"; //  backspace
	else if (charCode == 9) keyName = "tab"; //  tab
	else if (charCode == 13) keyName = "enter"; //  enter
	else if (charCode == 16) keyName = ""; //  shift
	else if (charCode == 17) keyName = ""; //  ctrl
	else if (charCode == 18) keyName = ""; //  alt
	else if (charCode == 19) keyName = "pause/break"; //  pause/break
	else if (charCode == 20) keyName = "caps lock"; //  caps lock
	else if (charCode == 27) keyName = "escape"; //  escape
	else if (charCode == 32) keyName = "space"; // space         
	else if (charCode == 33) keyName = "page up"; // page up, to avoid displaying alternate character and confusing people	         
	else if (charCode == 34) keyName = "page down"; // page down
	else if (charCode == 35) keyName = "end"; // end
	else if (charCode == 36) keyName = "home"; // home
	else if (charCode == 37) keyName = "left arrow"; // left arrow
	else if (charCode == 38) keyName = "up arrow"; // up arrow
	else if (charCode == 39) keyName = "right arrow"; // right arrow
	else if (charCode == 40) keyName = "down arrow"; // down arrow
	else if (charCode == 45) keyName = "insert"; // insert
	else if (charCode == 46) keyName = "delete"; // delete
	else if (charCode == 91) keyName = "left window"; // left window
	else if (charCode == 92) keyName = "right window"; // right window
	else if (charCode == 93) keyName = "select key"; // select key
	else if (charCode == 96) keyName = "numpad 0"; // numpad 0
	else if (charCode == 97) keyName = "numpad 1"; // numpad 1
	else if (charCode == 98) keyName = "numpad 2"; // numpad 2
	else if (charCode == 99) keyName = "numpad 3"; // numpad 3
	else if (charCode == 100) keyName = "numpad 4"; // numpad 4
	else if (charCode == 101) keyName = "numpad 5"; // numpad 5
	else if (charCode == 102) keyName = "numpad 6"; // numpad 6
	else if (charCode == 103) keyName = "numpad 7"; // numpad 7
	else if (charCode == 104) keyName = "numpad 8"; // numpad 8
	else if (charCode == 105) keyName = "numpad 9"; // numpad 9
	else if (charCode == 106) keyName = "multiply"; // multiply
	else if (charCode == 107) keyName = "add"; // add
	else if (charCode == 109) keyName = "subtract"; // subtract
	else if (charCode == 110) keyName = "decimal point"; // decimal point
	else if (charCode == 111) keyName = "divide"; // divide
	else if (charCode == 112) keyName = "F1"; // F1
	else if (charCode == 113) keyName = "F2"; // F2
	else if (charCode == 114) keyName = "F3"; // F3
	else if (charCode == 115) keyName = "F4"; // F4
	else if (charCode == 116) keyName = "F5"; // F5
	else if (charCode == 117) keyName = "F6"; // F6
	else if (charCode == 118) keyName = "F7"; // F7
	else if (charCode == 119) keyName = "F8"; // F8
	else if (charCode == 120) keyName = "F9"; // F9
	else if (charCode == 121) keyName = "F10"; // F10
	else if (charCode == 122) keyName = "F11"; // F11
	else if (charCode == 123) keyName = "F12"; // F12
	else if (charCode == 144) keyName = "num lock"; // num lock
	else if (charCode == 145) keyName = "scroll lock"; // scroll lock
	else if (charCode == 186) keyName = ";"; // semi-colon
	else if (charCode == 187) keyName = "="; // equal-sign
	else if (charCode == 188) keyName = ","; // comma
	else if (charCode == 189) keyName = "-"; // dash
	else if (charCode == 190) keyName = "."; // period
	else if (charCode == 191) keyName = "/"; // forward slash
	else if (charCode == 192) keyName = "tilde (~`)"; // grave accent
	else if (charCode == 219) keyName = "["; // open bracket
	else if (charCode == 220) keyName = "\\"; // back slash
	else if (charCode == 221) keyName = "]"; // close bracket
	else if (charCode == 222) keyName = "'"; // single quote

	textBox.val(modifiers + keyName);

	var hotkeyValue = (e.ctrlKey ? "1" : "0") + "|" + (e.altKey ? "1" : "0") + "|" + (e.shiftKey ? "1" : "0") + "|" + charCode + "|" + keyName;
	settings.setItem(textBox.attr("hotkeyId"), hotkeyValue);

	return false;
}
function Hotkey_ToggleFullscreen()
{
	toggleFullScreen();
}
function Hotkey_ToggleSidebar()
{
	if ($("#layoutleft").outerWidth(true) == 0)
		$("#layoutleft").css("width", layoutLeftOriginalWidth + "px");
	else
		$("#layoutleft").css("width", "0px");
	resized();
}
function Hotkey_DownloadFrame()
{
	$("#save_snapshot_btn").get(0).click();
}
function Hotkey_PlayPause()
{
	Playback_PlayPause();
}
function Hotkey_NextClip()
{
	Playback_NextClip();
}
function Hotkey_PreviousClip()
{
	Playback_PreviousClip();
}
function Hotkey_SkipAhead()
{
	Playback_Skip(1000 * parseInt(settings.ui2_skipAmount));
}
function Hotkey_SkipBack()
{
	Playback_Skip(-1000 * parseInt(settings.ui2_skipAmount));
}
function Hotkey_PlayFaster()
{
	Playback_SpeedUp();
}
function Hotkey_PlaySlower()
{
	Playback_SlowDown();
}
function Hotkey_PlayForwardReverse()
{
	Playback_Reverse();
}
function Hotkey_DigitalZoomIn()
{
	DigitalZoomNow(1);
}
function Hotkey_DigitalZoomOut()
{
	DigitalZoomNow(-1);
}
function Hotkey_PtzUp()
{
	PTZ_async_noguarantee(currentlyLoadingImage.id, 2);
}
function Hotkey_PtzDown()
{
	PTZ_async_noguarantee(currentlyLoadingImage.id, 3);
}
function Hotkey_PtzLeft()
{
	PTZ_async_noguarantee(currentlyLoadingImage.id, 0);
}
function Hotkey_PtzRight()
{
	PTZ_async_noguarantee(currentlyLoadingImage.id, 1);
}
function Hotkey_PtzIn()
{
	PTZ_async_noguarantee(currentlyLoadingImage.id, 5);
}
function Hotkey_PtzOut()
{
	PTZ_async_noguarantee(currentlyLoadingImage.id, 6);
}
function Hotkey_PtzPreset(num)
{
	PTZ_async_noguarantee(currentlyLoadingImage.id, 100 + parseInt(num));
}
///////////////////////////////////////////////////////////////
// Update Notifications ///////////////////////////////////////
///////////////////////////////////////////////////////////////
var hoursBetweenAutomaticUpdateChecks = 12;
var showMessageIfNoUpdateAvailable = false;
function CheckForUpdates_Automatic()
{
	if (settings.ui2_doAutoUpdateCheck == "1")
	{
		var lastUpdateCheck = parseInt(settings.ui2_lastUpdateCheck);
		var timeNow = new Date().getTime();
		if (timeNow - lastUpdateCheck > (1000 * 60 * 60 * hoursBetweenAutomaticUpdateChecks))
		{
			CheckForUpdates(false);
		}
	}
}
function CheckForUpdates(manuallyTriggered)
{
	showMessageIfNoUpdateAvailable = manuallyTriggered;
	var timeMs = new Date().getTime();
	settings.ui2_lastUpdateCheck = timeMs;
	$.getScript("http://www.ipcamtalk.com/bp08/ui2_version.js?nocache=" + timeMs)
	.fail(function (jqxhr, settings, exception)
	{
		showMessageIfNoUpdateAvailable = false;
		showWarningToast("Unable to check for updates at this time.", 5000);
	});
}
function CompareVersions(v1, v2)
{
	var v1Parts = v1.split(".");
	var v2Parts = v2.split(".");
	for (var i = 0; i < v1Parts.length && i < v2Parts.length; i++)
	{
		var v1Num = parseInt(v1Parts[i]);
		var v2Num = parseInt(v2Parts[i]);
		if (v1Num > v2Num)
			return -1;
		else if (v1Num < v2Num)
			return 1;
	}
	if (v1Parts.length > v2Parts.length)
	{
		for (var i = v2Parts.length; i < v1Parts.length; i++)
		{
			var v1Num = parseInt(v1Parts[i]);
			if (v1Num > 0)
				return -1;
			else if (v1Num < 0)
				return 1;
		}
	}
	else if (v1Parts.length < v2Parts.length)
	{
		for (var i = v1Parts.length; i < v2Parts.length; i++)
		{
			var v2Num = parseInt(v2Parts[i]);
			if (v2Num > 0)
				return 1;
			else if (v2Num < 0)
				return -1;
		}
	}
	return 0;
}
function ui2_version_file_loaded()
{
	if (typeof ui2_version_latest != "undefined" && ui2_version_latest)
	{
		if (ui2_version_latest == settings.ui2_lastIgnoredVersion)
		{
			if (!showMessageIfNoUpdateAvailable)
				return;
		}
		if (CompareVersions(ui2_version, ui2_version_latest) > 0)
		{
			var downloadLink = "http://www.ipcamtalk.com/showthread.php/93-I-made-a-better-remote-live-view-page";
			if (typeof ui2_download_link != "undefined" && ui2_download_link)
				downloadLink = ui2_download_link;

			var changesHtml = "";
			if (typeof ui2_version_changes != "undefined" && ui2_version_changes)
				changesHtml = '<div style="margin: 5px 0px; padding:5px;border:1px dotted white;">'
					+ '<div style="margin:5px 0px;">Changes:</div>'
					+ '<div style="margin:5px 0px;">' + ui2_version_changes + '</div>'
					+ '</div>';

			showInfoToast('<div class="updateAvailableBox">'
				+ '<div>UI2 Update Available!</div>'
				+ '<div style="margin-top:4px;">New Version: <span style="font-weight:bold">' + ui2_version_latest + "</span></div>"
				+ '<div style="margin:10px 0px;"><input type="button" class="simpleTextButton btnBlue" onclick="window.open(\'' + downloadLink + '\')" value="Download" /> '
				+ 'or <input type="button" class="simpleTextButton btnYellow" onclick="ui2_ignore_update(this)" value="Ignore" title="If you click Ignore, you will not be notified again about this version." /> update.</div>'
				+ changesHtml
				+ '<div>You are running <span style="color:#FFFF00">' + ui2_version + "</span></div>"
				+ '<div style="margin-top:10px;"><input type="button" class="simpleTextButton btnRed" onclick="ui2_disable_updates(this)" value="Disable update checks" /></div>'
				+ '</div>'
				, 360000, true);
		}
		else
		{
			if (showMessageIfNoUpdateAvailable)
				showInfoToast("No update is available.", 5000);
		}
	}
	else
	{
		if (showMessageIfNoUpdateAvailable)
			showErrorToast("Unexpected server response.", 5000);
	}
	showMessageIfNoUpdateAvailable = false;
}
function ui2_ignore_update(ele)
{
	$(ele).parents(".toast").children(".toast-close-button").click();
	settings.ui2_lastIgnoredVersion = ui2_version_latest;
	showInfoToast("You will not be notified again about version " + ui2_version_latest + ".", 30000);
}
function ui2_disable_updates(ele)
{
	$(ele).parents(".toast").children(".toast-close-button").click();
	$("#optionDialog_option_ui2_doAutoUpdateCheck").removeAttr("checked");
	settings.ui2_doAutoUpdateCheck = "0";
	showInfoToast("Automatic update checks have been disabled. You may re-enable them in the settings menu.", 30000);
}
///////////////////////////////////////////////////////////////
// Frame rate counter /////////////////////////////////////////
///////////////////////////////////////////////////////////////
var fps =
{
	startTime: 0,
	frameNumber: 0,
	getFPS: function ()
	{
		this.frameNumber++;
		var d = new Date().getTime(),
			currentTime = (d - this.startTime) / 1000,
			result = (this.frameNumber / currentTime).toFixed(2);

		if (currentTime > 1)
		{
			this.startTime = new Date().getTime();
			this.frameNumber = 0;
		}
		return result;

	}
};
///////////////////////////////////////////////////////////////
// Misc ///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
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
function makeUnselectable($target)
{
	$target
		.addClass('unselectable') // All these attributes are inheritable
		.attr('unselectable', 'on') // For IE9 - This property is not inherited, needs to be placed onto everything
		.attr('draggable', 'false') // For moz and webkit, although Firefox 16 ignores this when -moz-user-select: none; is set, it's like these properties are mutually exclusive, seems to be a bug.
		.on('dragstart', function () { return false; });  // Needed since Firefox 16 seems to ingore the 'draggable' attribute we just applied above when '-moz-user-select: none' is applied to the CSS 

	$target // Apply non-inheritable properties to the child elements
		.find('*')
		.attr('draggable', 'false')
		.attr('unselectable', 'on');
};
function SetLoadedStatus(selector)
{
	var loadingStatusObj = $(selector);
	if (loadingStatusObj.length > 0)
	{
		loadingStatusObj.html("OK");
		loadingStatusObj.css("color", "#00CC00");
	}
	FinishLoadingIfConditionsMet();
}
function SetErrorStatus(selector, errorMessage)
{
	var loadingStatusObj = $(selector);
	if (loadingStatusObj.length > 0)
	{
		loadingStatusObj.html("FAIL");
		loadingStatusObj.css("color", "#CC0000");
	}
	showErrorToast(errorMessage, 600000);
}

function BlueIrisColorToCssColor(biColor)
{
	var colorHex = biColor.toString(16).padLeft(8, '0').substr(2);
	return colorHex.substr(4, 2) + colorHex.substr(2, 2) + colorHex.substr(0, 2);
}
function GetReadableTextColorHexForBackgroundColorHex(c)
{
	var r = parseInt(c.substr(0, 2), 16);
	var g = parseInt(c.substr(2, 2), 16);
	var b = parseInt(c.substr(4, 2), 16);
	var o = Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000);
	return o > 125 ? "222222" : "DDDDDD";
}
String.prototype.padLeft = function (len, c)
{
	var str = this;
	while (str.length < len)
		str = (c || "&nbsp;") + str;
	return str;
};
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
function JavaScriptStringEncode(str)
{
	return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
function CleanUpGroupName(groupName)
{
	while (groupName.indexOf("+") == 0)
		groupName = groupName.substr(1);
	return groupName;
}
String.prototype.startsWith = function (prefix)
{
	return this.indexOf(prefix) === 0;
}

String.prototype.endsWith = function (suffix)
{
	return this.match(suffix + "$") == suffix;
};
function SimpleTextGibberize(plainGibberish)
{
	var sbuilder = "";
	for (var i = 0; i < plainGibberish.length; i++)
	{
		sbuilder += String.fromCharCode(((plainGibberish.charCodeAt(i) % 100) * 100) + (plainGibberish.charCodeAt(i) / 100));
	}
	return sbuilder;
}
function msToTime(s)
{
	var ms = s % 1000;
	s = (s - ms) / 1000;
	var secs = s % 60;
	s = (s - secs) / 60;
	var mins = s % 60;
	var hrs = (s - mins) / 60;

	var retVal;
	if (hrs != 0)
		retVal = hrs + ":" + mins.toString().padLeft(2, "0");
	else
		retVal = mins;

	retVal += ":" + secs.toString().padLeft(2, "0");

	retVal += "." + parseInt(ms).toString().padLeft(3, "0");

	return retVal;
}
function GetDateStr(date, includeMilliseconds)
{
	var ampm = "AM";
	var hour = date.getHours();
	if (hour == 0)
	{
		hour = 12;
	}
	else if (hour == 12)
	{
		ampm = "PM";
	}
	else if (hour > 12)
	{
		hour -= 12;
		ampm = "PM";
	}
	var ms = includeMilliseconds ? ("." + date.getMilliseconds()) : "";

	var str = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + " " + hour + ":" + date.getMinutes().toString().padLeft(2, '0') + ":" + date.getSeconds().toString().padLeft(2, '0') + ms + " " + ampm;
	return str;
}

function toggleFullScreen()
{
	if (!isFullScreen())
		requestFullScreen();
	else
		exitFullScreen();
}
function isFullScreen()
{
	return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
}
function requestFullScreen()
{
	if (document.documentElement.requestFullscreen)
		document.documentElement.requestFullscreen();
	else if (document.documentElement.msRequestFullscreen)
		document.documentElement.msRequestFullscreen();
	else if (document.documentElement.mozRequestFullScreen)
		document.documentElement.mozRequestFullScreen();
	else if (document.documentElement.webkitRequestFullscreen)
		document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
}
function exitFullScreen()
{
	if (document.exitFullscreen)
		document.exitFullscreen();
	else if (document.msExitFullscreen)
		document.msExitFullscreen();
	else if (document.mozCancelFullScreen)
		document.mozCancelFullScreen();
	else if (document.webkitExitFullscreen)
		document.webkitExitFullscreen();
}
function TextAreaKeyHandler(e)
{
	var keyCode = e.keyCode || e.which;

	if (keyCode == 9)
	{
		e.preventDefault();
		var start = $(this).get(0).selectionStart;
		var end = $(this).get(0).selectionEnd;
		var thisText = $(this).val();
		if (start == end)
		{
			if (e.shiftKey)
			{
				if (start > 0 && thisText.charAt(start - 1) == "\t")
				{
					$(this).val(thisText.substring(0, start - 1) + thisText.substring(start));
					$(this).get(0).selectionStart = $(this).get(0).selectionEnd = start - 1;
				}
			}
			else
			{
				$(this).val(thisText.substring(0, start)
							+ "\t"
							+ thisText.substring(start));
				$(this).get(0).selectionStart = $(this).get(0).selectionEnd = start + 1;
			}
		}
		else
		{
			// Some text is selected.  Does it contain any line feeds?
			var selectedText = thisText.substring(start, end);
			if (selectedText.indexOf('\n') == -1)
			{
				// No line feeds.
				if (!e.shiftKey)
				{
					//Replace selected text with tab character
					$(this).val(thisText.substring(0, start) + '\t' + thisText.substring(end));
					$(this).get(0).selectionStart = start + 1;
					$(this).get(0).selectionEnd = start + 1;
				}
			}
			else
			{
				// Selection contains line feeds.  Add or remove a tab from the start of each line that contains selected text.
				var lines = thisText.split('\n');
				var idxCurrent = 0;
				var idxNext = 0;
				var insideSelection = false;
				var startOffset = e.shiftKey ? 0 : 1;
				var endOffset = 0;
				for (var i = 0; i < lines.length; i++)
				{
					idxCurrent = idxNext;
					idxNext += lines[i].length + 1;
					if (start >= idxCurrent && start < idxNext)
						insideSelection = true;
					if (insideSelection)
					{
						if (e.shiftKey)
						{
							if (lines[i].indexOf('\t') == 0)
							{
								if (idxCurrent < start)
									startOffset--;
								endOffset--;
								lines[i] = lines[i].substring(1);
							}
						}
						else
						{
							endOffset++;
							lines[i] = '\t' + lines[i];
						}
					}
					if (end > idxCurrent && end <= idxNext)
						break;
				}
				$(this).val(lines.join('\n'));
				$(this).get(0).selectionStart = start + startOffset;
				$(this).get(0).selectionEnd = end + endOffset;
			}
		}
	}
}
function generateUIDNotMoreThan1million()
{
	return ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4)
}
function Clamp(i, min, max)
{
	if (i < min)
		return min;
	if (i > max)
		return max;
	return i;
}
///////////////////////////////////////////////////////////////
// Dynamic CSS Rule Modification //////////////////////////////
///////////////////////////////////////////////////////////////
function getCSSRule(ruleName, deleteFlag)
{               // Return requested style object
	ruleName = ruleName.toLowerCase();                       // Convert test string to lower case.
	if (document.styleSheets)
	{                            // If browser can play with stylesheets
		for (var i = 0; i < document.styleSheets.length; i++)
		{ // For each stylesheet
			var styleSheet = document.styleSheets[i];          // Get the current Stylesheet
			var ii = 0;                                        // Initialize subCounter.
			var cssRule = false;                               // Initialize cssRule. 
			do
			{                                             // For each rule in stylesheet
				if (styleSheet.cssRules)
				{                    // Browser uses cssRules?
					cssRule = styleSheet.cssRules[ii];         // Yes --Mozilla Style
				} else
				{                                      // Browser usses rules?
					cssRule = styleSheet.rules[ii];            // Yes IE style. 
				}                                             // End IE check.
				if (cssRule)
				{                               // If we found a rule...
					if (cssRule.selectorText.toLowerCase() == ruleName)
					{ //  match ruleName?
						if (deleteFlag == 'delete')
						{             // Yes.  Are we deleteing?
							if (styleSheet.cssRules)
							{           // Yes, deleting...
								styleSheet.deleteRule(ii);        // Delete rule, Moz Style
							} else
							{                             // Still deleting.
								styleSheet.removeRule(ii);        // Delete rule IE style.
							}                                    // End IE check.
							return true;                         // return true, class deleted.
						} else
						{                                // found and not deleting.
							return cssRule;                      // return the style object.
						}                                       // End delete Check
					}                                          // End found rule name
				}                                             // end found cssRule
				ii++;                                         // Increment sub-counter
			} while (cssRule)                                // end While loop
		}                                                   // end For loop
	}                                                      // end styleSheet ability check
	return false;                                          // we found NOTHING!
}                                                         // end getCSSRule 

function killCSSRule(ruleName)
{                          // Delete a CSS rule   
	return getCSSRule(ruleName, 'delete');                  // just call getCSSRule w/delete flag.
}                                                         // end killCSSRule

function addCSSRule(ruleName)
{                           // Create a new css rule
	if (document.styleSheets)
	{                            // Can browser do styleSheets?
		if (!getCSSRule(ruleName))
		{                        // if rule doesn't exist...
			if (document.styleSheets[0].addRule)
			{           // Browser is IE?
				document.styleSheets[0].addRule(ruleName, null, 0);      // Yes, add IE style
			} else
			{                                         // Browser is IE?
				document.styleSheets[0].insertRule(ruleName + ' { }', 0); // Yes, add Moz style.
			}                                                // End browser check
		}                                                   // End already exist check.
	}                                                      // End browser ability check.
	return getCSSRule(ruleName);                           // return rule we just created.
}