/*
Name: clear_view_cameras.js
Version: 1.0
Author: Steve Talley (steve@talleyservices.com)
Website: TalleyServices.com

Description: This is the main JavaScript file that loads the BlueIris
cameras via Ajax calls.
*/


//Global Variables

//Begin outer anonymous wrapping function
jQuery(function($) {

//Begin here Blue Iris cameras

//set this to the http:// URL of the Blue Iris server if it's a different machine
var blueIrisServerGlobal = 'http://sol.home';
var selectedCameraGlobal;
var previousCameraGlobal;
var selectedCameraWidthGlobal;
var selectedCameraHeightGlobal;
var scaledCameraWidthGlobal;
var scaledCameraHeightGlobal;
var selectedGroupGlobal;

//img HTML ID tag where the image will be refreshed
var cameraImgTagGlobal = '#cameraImg';
var cameraImgIDGlobal = 'cameraImg';
var canvasWrapperTagGlobal = '#outerViewportWrapper';
var canvasViewportTagGlobal = '#cameraViewport';
var cameraSelectionTagGlobal = '#cameraSelection';
var camArrayGlobal = [];
var camGroupArrayGlobal = [];
var currentCamArray;
var refreshRateGlobal = 200;

//Global var for the setTimeout stream so that it can be stopped
var refreshImageTimer;

//Global var for the update camera promise
var updateCameraPromise;

//Zooming vars
var imageScale = 1;
var previousScale;
var imageX = 0;
var imageY = 0;
var prevOrigX = 0;
var prevOrigY = 0;
var newOrigX = 0;
var newOrigY = 0;
var translateX = 0;
var translateY = 0;

//Detect safari
var isSafari = navigator.vendor.indexOf("Apple")==0 && /\sSafari\//.test(navigator.userAgent); // true or false

//Create an array for the camera refresh times
var cameraRefreshRatesGlobal = [];
cameraRefreshRatesGlobal.push(
	{rateMS: 50, rateDesc: 'Fastest' },
	{rateMS: 200, rateDesc: 'Faster' },
	{rateMS: 1000, rateDesc: 'Medium' },
	{rateMS: 5000, rateDesc: 'Slow' }

);

/* ==============================================================
    CONTROLLER
   ============================================================== */


window.onload = function()
{

	AddZoomListener(this);

} //end $(window).onload(function()

function AddZoomListener( zoomEvent )
{

	//Get the element and add the listeners
	var camImg = document.getElementById(cameraImgIDGlobal);

  var maxZoomMultiplier = 4;

	if (camImg.addEventListener){
		camImg.addEventListener("mousewheel", MouseWheelHandler, false);
		camImg.addEventListener("wheel", MouseWheelHandler, false);
	} else {
		camImg.attachEvent("onmousewheel", MouseWheelHandler);
	}


	//Zooming functions
	function MouseWheelHandler(e){

		//Get the mouse direction
		var mouseDirection = Math.max(-1, Math.min(1, (e.wheelDelta || -e.deltaY)));


		var newScale;
		newScale = imageScale + (0.2 * mouseDirection);

		//save the previous scale
		previousScale = imageScale;

		//Increase the scale but don't go below 1
		if(newScale < 1)
		{
			imageScale = 1;
		} else if (newScale >= maxZoomMultiplier) {
			imageScale = maxZoomMultiplier;
		} else {
			imageScale = newScale;
		}

		// Get the previous screen location and increase it by the previous scale
		prevOrigX = newOrigX * previousScale;
		prevOrigY = newOrigY * previousScale;

		// find current location on screen
    imageX = e.pageX - $(cameraImgTagGlobal).offset().left;
    imageY = e.pageY - $(cameraImgTagGlobal).offset().top;


	  // find actual location on the image at the current scale
		newOrigX = imageX / previousScale;
	  newOrigY = imageY / previousScale;

		//See if the mouse has moved, and if so, update the X origin and translation
		if((Math.abs(imageX - prevOrigX)>1 || Math.abs(imageY-prevOrigY)>1) && previousScale < 4) {
			translateX = translateX + (imageX - prevOrigX)*(1-1/previousScale);
			translateY = translateY + (imageY - prevOrigY)*(1-1/previousScale);
		}	else if (previousScale != 1 || imageX != prevOrigX && imageY != prevOrigY) {
			newOrigX = prevOrigX / previousScale;
			newOrigY = prevOrigY / previousScale;
		}

		//Prevent the image from moving in its container
		if( mouseDirection <= 0 ) {

			if( translateX + newOrigX + ( scaledCameraWidthGlobal - newOrigX ) * imageScale <= scaledCameraWidthGlobal) {
				translateX = 0;
				newOrigX = scaledCameraWidthGlobal;
			} else if( translateX + newOrigX * ( 1 - imageScale ) >= 0 ) {
				translateX = 0;
				newOrigX = 0;
			}

			if( translateY + newOrigY + ( scaledCameraHeightGlobal - newOrigY ) * imageScale <= scaledCameraHeightGlobal) {
				translateY = 0;
				newOrigY = scaledCameraHeightGlobal;
			} else if( translateY + newOrigY * ( 1 - imageScale ) >= 0 ) {
				translateY = 0;
				newOrigY = 0;
			}

		} // end if( mouseDirection <= 0 )

		//Apply the CSS to the object
		$( cameraImgTagGlobal ).css( {
			'transform': 'matrix(' + imageScale + ', 0 , 0, ' + imageScale + ', '+translateX+', '+translateY+')',
			'transform-origin': newOrigX + 'px ' + newOrigY + 'px'
		});

		//function to prevent scroll
		e.preventDefault();
		return false;

	} //end function MouseWheelHandler

} //end function AddZoomListener()



$(document).ready(function()
{
		ClearViewCamerasHandler();
}); //end $(document).ready(function()


//Window resize function
window.onresize = function(event)
{
	//Call the resize event when the window size is changed
	ResizeViewport( selectedCameraGlobal, camArrayGlobal );
} //end window.onresize = function(event)
/* ==============================================================
    MAIN FUNCTIONS
   ============================================================== */

function ClearViewCamerasHandler( )
{
	//Get the session key
	var initialLogin = GetSessionKey();

	//Make an initial request of the Blue Iris server to get the session key.
	//Assign the returned session key to a cookie
	initialLogin.done( setCookieSession );

	//when the initial async login is done, access the server a second time with the MD5 response
	$.when( initialLogin ).done( function() {

		var secondaryLogin = LoginToBlueIris();

		//Once the second login is successful, get the camera list
		$.when(secondaryLogin).done( function() {

			//Assign the refresh rate to a cookie
			setCookieRefreshRate( refreshRateGlobal );

			//Get a listing of the cameras
			var camListPopulate = GetCamList();

			//var groupArray = [];
			camListPopulate.done( function( listOfCams )
			{

				//loop through the returned array
				for( var i = 0; i < listOfCams.data.length; i++)
				{
					//create a new CameraData object
					camArrayGlobal[i] = new CameraData( listOfCams.data[i] );
				}//end for( var i = 0; i < listOfCams.data.length; i++)

				//loop through the newly created CameraData array and create a CameraGroupData object
				for( var i = 0; i < camArrayGlobal.length; i++)
				{
					if(camArrayGlobal[i].isGroup == true)
					{
						camGroupArrayGlobal[i] = new CameraGroupData( camArrayGlobal[i] );
					} //end if(camArrayGlobal[i].isGroup == true){
				} //end for( var i = 0; i < camArrayGlobal.length; i++)

				//Set the first camera element returned to the selectedCameraGlobal value
				selectedCameraGlobal = camArrayGlobal[0].camName;
				//And save this element to a global array
				currentCamArray = camArrayGlobal[0];
				//Save the height and width to global values
				selectedCameraWidthGlobal = currentCamArray.camWidth;
				selectedCameraHeightGlobal = currentCamArray.camHeight;


				//If there is at least one camera group, set the global var
				if(typeof camGroupArrayGlobal[0] != "undefined") selectedGroupGlobal = camGroupArrayGlobal[0].groupName;

				//Call the function to load the camera stream
				BeginCameraStream( blueIrisServerGlobal, "index" );
				//Listen for clicks
				$( cameraImgTagGlobal ).click( function( imagePos ) {
					//Send the image position, camera array, and img object to the function
					GetClickedCamera( imagePos, camArrayGlobal, cameraImgTagGlobal);
				}); //end $( cameraImgTagGlobal ).click( function( imagePos )

			});//end camListPopulate.done( function( listOfCams )

		}); //end $.when(secondaryLogin).done

	}); // end $.when( initialLogin ).done

} //end function ClearViewCamerasHandler


/* ===================================================================================
		COOKIE GET AND SET FUNCTIONS
   =================================================================================== */

//Set the session value in a cookie
function setCookieSession( setSessionValue )
{
	//console.log( setSessionValue.session );
	$.cookie( 'session', setSessionValue.session, { expires: 7, path: '/' } );
} //end function setCookieSession

//Get the session from a cookie previously set
function getCookieSession( getSessionValue )
{
	return $.cookie( 'session' );
} //end function getCookieSession


//Set the refresh rate value in a cookie
function setCookieRefreshRate( setRefreshValue )
{
	//console.log( setRefreshValue );
	$.cookie( 'refresh_rate', setRefreshValue, { expires: 7, path: '/' } );
} //end function setCookieRefreshRate

//Get the session from a cookie previously set
function getCookieRefreshRate( getRefreshValue )
{
	return $.cookie( 'refresh_rate' );
} //end function getCookieRefreshRate

/* ===================================================================================
		JSON GET AND SET FUNCTIONS
   =================================================================================== */

//Initial request to Blue Iris server to retrieve the session key
function GetSessionKey()
{
	return $.ajax({

		url: blueIrisServerGlobal + '/json',
		type: 'POST',
		data: JSON.stringify({ 'cmd': 'login'}),
		dataType: "json"
	}); //end return ajax

} //end function getSessionKey

 //Second request that passes the MD5 hash to login to the Blue Iris server
function LoginToBlueIris()
{
	var loginSessionCookie = getCookieSession();
	//console.log(loginSessionCookie);
	// loginSessionKeyMD5 = $.md5("username:" + loginSessionCookie + ":password");

	loginSessionKeyMD5 = $.md5(":" + loginSessionCookie + ":");
	//console.log(loginSessionKeyMD5);

	return $.ajax({

		url: blueIrisServerGlobal + '/json',
		type: 'POST',
		data: JSON.stringify({'cmd': 'login',	'session': loginSessionCookie, 'response': loginSessionKeyMD5 }),
		dataType: "json"
	}); //end return ajax

}; //end function loginToBlueIris

//Retrieve a listing of camera names - this includes all cameras and not just groups
//You must access the data array for the actual camera info
function GetCamList()
{
	var currentSessionKey = getCookieSession();
	return $.ajax({

		url: blueIrisServerGlobal + '/json',
		type: 'POST',
		data: JSON.stringify({'cmd': 'camlist',	'session' : currentSessionKey }),
		dataType: "json"
	}); //end return ajax

} //end function GetCamList


function ResizeViewport( rvCurrentCam, rvCameraArray )
{

	var viewportWidth = $(window).innerWidth();
	var viewportHeight = $(window).innerHeight();

	var viewportRatio = viewportHeight / viewportWidth;
	var selectedCameraWidthGlobal = currentCamArray.camWidth;
	var selectedCameraHeightGlobal = currentCamArray.camHeight;
	var camRatio = selectedCameraHeightGlobal / selectedCameraWidthGlobal;
	var camScaledWidth = Math.round(viewportHeight / camRatio);
	var camScaledHeight = Math.round(viewportWidth * camRatio);

	if (viewportRatio <= camRatio) {
		scaledCameraWidthGlobal = camScaledWidth;
		scaledCameraHeightGlobal = viewportHeight;

		$( cameraImgTagGlobal ).css({
			'width': 'auto',
			'height': scaledCameraHeightGlobal + "px",
		});
		//reset the wrapper viewport margin
		$(canvasViewportTagGlobal).css({
			'margin-top': 'auto',
		});
		//reset the viewport wrapper height since we don't need to center
		$( canvasWrapperTagGlobal ).css({
			'height': 'auto',
		});
	} else if ( viewportRatio > camRatio ) {
		scaledCameraWidthGlobal = viewportWidth;
		scaledCameraHeightGlobal = camScaledHeight;
		var camScale = scaledCameraWidthGlobal / selectedCameraWidthGlobal;

		$( cameraImgTagGlobal ).css({
			'width': scaledCameraWidthGlobal + "px",
			'height': 'auto',
		});
		//Set the margin-top of the camera div to the height of the cameraSelection div
		//this looks better visually and prevents the container from overflowing
		//the top of the screen

		//Get the height of the camera selection div. This will be our new margin top
		var camSelHeight = $(cameraSelectionTagGlobal).outerHeight(includeMargin=true);

		//Get the content height without the margin-top applied
		var contentHeight = scaledCameraHeightGlobal + $(cameraSelectionTagGlobal).outerHeight(includeMargin=true);

		//Check to see if the content plus our proposed new margin top are greater
		//than the available space in the viewport.
		if (contentHeight + camSelHeight > viewportHeight) {
			var viewportSetting = ( viewportHeight - contentHeight ) / 2;

			//Make sure we didn't get a negative number - only set our custom
			//margin top if the calculation is greater or equal to 0
			if( viewportSetting >= 0 ) {

				// viewportMarginTop = viewportSetting;
				var viewportMarginTop = 0;

			} else if ( viewportSetting < 0 ) {

				//this section is for an almost, but not quite, full height cam window
				//see if there will be any space below the window and divide it accordingly

				var viewportAndContentLeftover = viewportHeight - scaledCameraHeightGlobal;

				if( viewportAndContentLeftover > 40 )
				{
					viewportAndContentLeftover = 0;
				}

				viewportMarginTop = viewportAndContentLeftover + Math.round(Math.abs(viewportSetting * 2));
			}

		} else {
			viewportMarginTop = (viewportHeight - (scaledCameraHeightGlobal + camSelHeight)) / 8;
		}
		if(isSafari){
			viewportMarginTop = 0;
		}
		$(canvasViewportTagGlobal).css({
			'margin-top': viewportMarginTop,
		});
		//set the viewport wrapper height to center the cams
		$( canvasWrapperTagGlobal ).css({
			'height': viewportHeight + 'px',
		});
	} //end if (contentHeight + camSelHeight > viewportHeight)
} //end function ResizeViewport

/* ===================================================================================
		OBJECTS
   =================================================================================== */

function CameraData( camListJSON )
{
	//assign the various options to properties for the object
  this.camName = camListJSON.optionValue;
	this.camDescription = camListJSON.optionDisplay;
	this.camWidth = camListJSON.width;
	this.camHeight = camListJSON.height;
	this.imageRatio = camListJSON.height / camListJSON.width;

	//Check if this is an index/group image or just cameras
	if(typeof camListJSON.group != "undefined" )
	{
		//This is an index/group. Get the cameras listed in the group
		this.isGroup = true;
		this.groups = camListJSON.group;

		//Get the dimensions/positions for each camera in the group
		this.dimensions = [];
		for( var i=0; i < this.groups.length; i++ )
		{
			//assign the dimensions to easy to read names
			this.dimensions[i] = {
				camLeftX: camListJSON.rects[i][0],
				camTopY: camListJSON.rects[i][1],
				camRightX: camListJSON.rects[i][2],
				camBottomY: camListJSON.rects[i][3]
			}; //end this.dimensions[i]

		} //end for( var i=0; i < this.groups.length; i++ )

	} else {
		this.isGroup = false;
	}//end if(typeof camListJSON.group != "undefined" )

} //end function CameraData

//Create an object with for camera groups
function CameraGroupData( cgdCamListJSON )
{
	//console.log(cgdCamListJSON);
	//We only want combined group images (Blue Iris can have multiple)
	if(typeof cgdCamListJSON.group != false ) //!= "undefined" )
	{
		//Assign the current camera name to the groupName
		this.groupName = cgdCamListJSON.camName;

		this.groupDescription = cgdCamListJSON.camDescription;
		//Remove the first character, which is a +, from the names returned
		this.groupDescription = this.groupDescription.substr(1);
		//change underscores to spaces
		this.groupDescription = this.groupDescription.replace(/_/g, ' ');
		//capitalize all words
		this.groupDescription = this.groupDescription.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
		//Make and, or, or the lowercase
		this.groupDescription = this.groupDescription.replace("And", "and");
		this.groupDescription = this.groupDescription.replace("The", "the");
		this.groupDescription = this.groupDescription.replace("Of", "of");

		//Get the groups
		this.cameras = cgdCamListJSON.groups;

	}//end if(typeof cgdCamListJSON.group != "undefined" )

} //end function CameraGroupData


/* ===================================================================================
		CAMERA LIST FUNCTIONS
   =================================================================================== */

function PrepareCameraStream( sclCamName, sclImgElement, sclCameraArray )
{
	//Set the img element tag to the global var if undefined
	if(typeof sisImgElement == "undefined" ) sclImgElement = cameraImgTagGlobal;
	if(typeof sclCameraArray == "undefined" ) sclCameraArray = camArrayGlobal;

	//Clear the current timeout by calling a local function
	function clearCurrentTimeout(){
		var clearedCameraStream = clearTimeout(refreshImageTimer);
		window.stop();
		// set our promise to null otherwise the $.when statement might wait for a promise we aborted
		updateCameraPromise = null;
	}
		clearCurrentTimeout();
	//set the globalvariables
	selectedCameraGlobal = sclCamName;

	for(var i = 0; i < camArrayGlobal.length; i++ )
	{
		if( sclCamName == camArrayGlobal[i].camName )
		{
			selectedCameraWidthGlobal = camArrayGlobal[i].camWidth;
			selectedCameraHeightGlobal = camArrayGlobal[i].camHeight;
			currentCamArray = camArrayGlobal[i];
		} //end if( sisCamName == sisCameraArray[i].camName )
	}


	BeginCameraStream( blueIrisServerGlobal, sclCamName );


	//scroll to the top of the image
	$(document).scrollTop( $(sclImgElement).offset().top );

} //end function PrepareCameraStream

//Call the actual setTimeout function to set the image stream
function BeginCameraStream( cameraServer, cameraSelection, displayRefreshMS, bcsCameraArray, bcsImageElement )
{
	if(typeof bcsCameraArray == "undefined" ) bcsCameraArray = camArrayGlobal;
	if(typeof bcsImageElement == "undefined" ) bcsImageElement = cameraImgTagGlobal;

	//Check if we were passed a MS argument. If not, use the cookie value
	if( typeof displayRefreshMS === 'undefined' )
	{
		displayRefreshMS = getCookieRefreshRate();
	}

  //do the actual drawing
	function UpdateCamScreen() {

		var UpdateCam_dfd = jQuery.Deferred();

		var cameraImage = document.getElementById(cameraImgIDGlobal);
		var cameraImageContext = cameraImage.getContext('2d');

		var currentCamImage = new Image();
		var cameraImageUpdate = currentCamImage.src = blueIrisServerGlobal + "/image/" + selectedCameraGlobal  + '?time=' + Math.random();
		currentCamImage.onload = function() {
			cameraImageContext.drawImage(this, 0,0);
			UpdateCam_dfd.resolve();
			$.when(updateCameraPromise).then(function() {
				refreshImageTimer = setTimeout(function() {
					updateCameraPromise =	UpdateCamScreen();
				}, displayRefreshMS);
			});
		};

		return UpdateCam_dfd.promise();
	}
	$( cameraImgTagGlobal ).attr({
			'width': selectedCameraWidthGlobal + "px",
			'height': selectedCameraHeightGlobal + "px",
		});
	//Call resize viewport twice to get everything correct
	ResizeViewport( cameraSelection, bcsCameraArray );
	updateCameraPromise = UpdateCamScreen();

	//slightly delay our second call. This will fix any scroll bar issues at points
	//where the camRatio and ViewportRatio are close. There is a slight flash where
	//the scrollbars appear.
	setTimeout(function(){
		ResizeViewport( cameraSelection, bcsCameraArray );
	},50);

	CreateCameraLinks( blueIrisServerGlobal, camArrayGlobal, camGroupArrayGlobal, selectedGroupGlobal, cameraRefreshRatesGlobal );

}

//Change the refresh rate. Relies on a global var for the camera selection
function ChangeCameraRefreshRate( desiredMS )
{
	//Get the global server
	currentServer = blueIrisServerGlobal;

	//Get the global camera
	currentCamera = selectedCameraGlobal;

	//Set the desired refresh in the cookie
	setCookieRefreshRate( desiredMS );

	PrepareCameraStream(currentCamera);

}//end function ChangeCameraRefreshRate

function GetClickedCamera( mousePos, cameraArray, imgElement )
{
	//Get the current dimensions
	//Create a scaling factor for the width and height
	scaleFactorWidth = scaledCameraWidthGlobal / selectedCameraWidthGlobal;
	scaleFactorHeight = scaledCameraHeightGlobal / selectedCameraHeightGlobal;

	//Get the mouse position
	var mouseX = mousePos.pageX - $(imgElement).offset().left;
	var mouseY = mousePos.pageY - $(imgElement).offset().top;

	// Also divide by the imageScale in case we're zoomed in
	mouseXScaled = mouseX / scaleFactorWidth / imageScale;
	mouseYScaled = mouseY / scaleFactorHeight / imageScale;

	//Get the current camera
	var currentCam = selectedCameraGlobal;

	//The var we will return with the destination camera
	var desiredCam = selectedGroupGlobal;

	//Loop through the array and see if this is a camera group
	for(var i = 0; i < cameraArray.length; i++ )
	{
		if( currentCam == cameraArray[i].camName )
		{
			if(cameraArray[i].isGroup == true)
			{
				//store the current group in the group global variable so we can come back to this group
				selectedGroupGlobal = cameraArray[i].camName;

				//loop through the dimensions
				for( var j = 0; j < cameraArray[i].dimensions.length; j++)
				{
						if( mouseXScaled >= cameraArray[i].dimensions[j].camLeftX && mouseXScaled <= cameraArray[i].dimensions[j].camRightX
							&& mouseYScaled >= cameraArray[i].dimensions[j].camTopY && mouseYScaled <= cameraArray[i].dimensions[j].camBottomY 	)
						{
							//Get the camera based on the dimensions
							desiredCam = cameraArray[i].groups[j];
						}
				} //end for( var indexDimensions = 0; indexDimensions < cameraArray[i].dimensions.length; indexDimensions++)

			} else {
				// Do not map coordinates
				desiredCam = selectedGroupGlobal;
			} //end if(cameraArray[i].isGroup == true)
		} //end if( currentCam == cameraArray[i].camName )

	}//end for(var i = 0; i < cameraArray.length; i++ )

	PrepareCameraStream( desiredCam );

} //end function GetClickedCamera

function CreateCameraLinks( cclCameraServer, cclCameraArray, cclCameraGroupArray, cclSelectedGroup, cclRefreshRates )
{

	//Clear anything in the div
	// $('div#cameraSelection').empty();

	//Begin a div for the camera group names, if they exist
	$('#cameraLinks ul').empty();

	for( var j=0; j < cclCameraGroupArray.length; j++ )
	{
			if(cclCameraGroupArray[j].groupName == cclSelectedGroup)
			{
					//highlight the current camera
					$('#cameraLinks ul').append($('<li><a href="#" class="selectedItem cameraGroupLink" name="' + cclCameraGroupArray[j].groupName + '">' + cclCameraGroupArray[j].groupDescription + '</a></li>'));

			} else {

				//Create the camera group links
				$('#cameraLinks ul').append($('<li><a href="#" class="cameraGroupLink" name="' + cclCameraGroupArray[j].groupName + '">' + cclCameraGroupArray[j].groupDescription + '</a></li>'));

			} //end if(cclCameraGroupArray[j].groupName == cclSelectedGroup)

	} //end for( var j=0; j < cclCameraArray.length; j++ )

	//Begin a div for the refresh rates

	$('#refreshRates ul').empty();

	for( var i=0; i < cclRefreshRates.length; i++ )
	{
		if( getCookieRefreshRate() == cclRefreshRates[i].rateMS )
		{
			$('#refreshRates ul').append($('<li><a href="#" class="selectedItem cameraRefreshLink" rate="' + cclRefreshRates[i].rateMS + '">' + cclRefreshRates[i].rateDesc + '</a></li>'));
		} else {
			$('#refreshRates ul').append($('<li><a href="#" class="cameraRefreshLink" rate="' + cclRefreshRates[i].rateMS + '">' + cclRefreshRates[i].rateDesc + '</a></li>'));
	}//end if(getRefreshValue() == cclRefreshRates[i].rateMS )

	} //end for( var i=0; i < cclRefreshRates.length; i++ )

	//Add a click event for these newly created links
	$('a.cameraGroupLink').click( function() {
		//Set this to the global group var
		selectedGroupGlobal = $(this).attr("name");
		//Get the name from the anchor tag of the clicked link
		PrepareCameraStream( $(this).attr("name") );
	});
	//Add a click event for these newly created links
	$('a.cameraRefreshLink').click( function() {
			//Get the rate from the anchor tag of the clicked link
			ChangeCameraRefreshRate( $(this).attr("rate") );
	}); //end $('a.cameraRefreshLink').click( function()

} //end function CreateCameraLinks

//end outer anonymous wrapping function
});
