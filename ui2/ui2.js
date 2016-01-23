/// <reference path="ui2-util.js" />
/// <reference path="ui2-local-overrides.js" />
/// <reference path="jquery-1.11.3.js" />
/// <reference path="jquery.ui2modal.js" />
var settings = typeof (Storage) !== "undefined" ? localStorage : GetDummyLocalStorage();
var allowUserToChangeSettings = true;
var settingsCategoryList = ["Video Streaming", "UI Behavior", "Top Bar", "Hotkeys", "HTML5 Canvas", "Misc"]
var defaultSettings =
[
	{
		key: "ui2_timeBetweenJpegImageUpdates"
		, value: 0
		, preLabel: "Jpeg refresh delay (ms):"
		, inputType: "number"
		, inputWidth: 80
		, minValue: 0
		, maxValue: 60000
		, hint: "[0-60000] A value of 0 will result in the highest frame rate, but also the highest bandwidth usage."
		, category: "Video Streaming"
	}
	, {
		key: "ui2_thumbnailLoadingThreads"
		, value: 3
		, inputType: "number"
		, inputWidth: 40
		, minValue: 1
		, maxValue: 5
		, preLabel: "Thumbnail loading concurrency:"
		, hint: "[1-5] (default: 3)<br/>Maximum number of connections for loading clip/alert thumbnails. Higher values will make thumbnails load faster, but may reduce video frame rate while thumbnails are loading."
		, onchange: onui2_thumbnailLoadingThreadsChanged
		, category: "Misc"
	}
	, {
		key: "ui2_hideTopBar"
		, value: "1"
		, preLabel: "Hide top bar when left bar is collapsed."
		, inputType: "checkbox"
		, hint: "If enabled, the top bar will be hidden when the left bar is fully collapsed."
		, onchange: resized
		, category: "Top Bar"
	}
	, {
		key: "ui2_audioAutoPlay"
		, value: "0"
		, preLabel: "Automatically play camera audio:"
		, inputType: "checkbox"
		, hint:
			'<div style="float:right;vertical-align:top;width:50px;">Audio Icons: '
			+ '<img src="ui2/high96.png" style="width:48px;height:48px;background-color:#377EC0" />'
			+ '<img src="ui2/mute96.png" style="width:48px;height:48px;background-color:#377EC0" />'
			+ "</div>"
			+ "Currently available only for live video streams.<br/><br/>"
			+ "Browser support varies:<br/>"
			+ "&bull; Chrome: Audio may be delayed<br/>"
			+ "&bull; Firefox: Good<br/>"
			+ "&bull; Internet Explorer: Not supported"
		, category: "Top Bar"
	}
	, {
		key: "ui2_safeptz"
		, value: "1"
		/*, preLabel: "Safe PTZ:"*/
		, inputType: "checkbox"
		, hint: "<b>IMPORTANT: It is currently not safe to uncheck this box.</b><br/><br/>If you disable Safe PTZ, then you can hold the PTZ buttons down to move the camera smoothly (supported cameras only).  "
			+ "This is considered less safe, because if you lose your connection to Blue Iris while you are moving the camera, the camera may continue moving until you are able to log back in and stop it."
		, category: "Top Bar"
	}
	, {
		key: "ui2_timeBetweenStatusUpdates"
		, value: 5000
		, preLabel: "Server status update interval (ms):"
		, inputType: "number"
		, inputWidth: 80
		, minValue: 1000
		, maxValue: 300000
		, hint: "[1000-300000] Server status includes the Stoplight, CPU, Memory, Profile, and Schedule information."
		, category: "Top Bar"
	}
	, {
		key: "ui2_enableDigitalZoom"
		, value: "1"
		, preLabel: "Digital Zoom:"
		, inputType: "checkbox"
		, hint: "If enabled, rolling the mouse wheel causes the video to zoom in and out."
		, category: "UI Behavior"
	}
	, {
		key: "ui2_showSystemName"
		, value: "1"
		, preLabel: "System name in upper left:"
		, inputType: "checkbox"
		, hint: '<img src="ui2/logo.png" style="float:right;height:48px" />'
			+ "If enabled, the upper left corner of UI2 will show the system name from Blue Iris Options - About - System name. If disabled, the Blue Iris logo and the name \"UI2\" will be shown instead."
		, onchange: onui2_showSystemNameChanged
		, category: "Top Bar"
	}
	, {
		key: "ui2_showStoplight"
		, value: "1"
		, preLabel: "Show Stoplight:"
		, inputType: "checkbox"
		, hint: '<div style="float:right;"><img alt="G" src="ui2/GreenLight96.png" style="height: 48px;" /></div>'
			+ "Shows a stoplight button similar to the one in the official Blue Iris apps."
		, onchange: onui2_showStoplightChanged
		, category: "Top Bar"
	}
	, {
		key: "ui2_enableStoplightButton"
		, value: "1"
		, preLabel: "Enable Stoplight Button:"
		, inputType: "checkbox"
		, hint: '<div style="float:right;"><img alt="G" src="ui2/GreenLight96.png" style="height: 48px;" /> '
			+ '<img alt="Y" src="ui2/YellowLight96.png" style="height: 48px;" /> '
			+ '<img alt="R" src="ui2/RedLight96.png" style="height: 48px;" /></div>'
			+ "If checked, clicking the Stoplight will toggle its state.<br/>"
			+ "Requires &quot;Show Stoplight&quot; to be checked.<br/>"
			+ "Requires administrator account."
		, onchange: onui2_enableStoplightButtonChanged
		, category: "Top Bar"
	}
	, {
		key: "ui2_showQualityButton"
		, value: "1"
		, preLabel: "Show Quality Button:"
		, hint: '<div style="float:right;">'
			+ '<img src="ui2/scenery_high96.png" style="height:48px;background-color:#377EC0;" title="Indicates the quality is high (normal)" /> '
			+ '<img src="ui2/scenery_low96.png" style="height:48px;background-color:#C03737;" title="Indicates the quality is low (faster refresh)" /></div>'
			+ "Enables a button you can click to reduce image quality and improve frame rate.  Best used only on slow networks."
		, inputType: "checkbox"
		, onchange: onui2_showQualityButtonChanged
		, category: "Top Bar"
	}
	, {
		key: "ui2_currentImageQuality"
		, value: 1
	}
	, {
		key: "ui2_showCpuMem"
		, value: "1"
		, preLabel: "Show CPU/Memory:"
		, inputType: "checkbox"
		, onchange: onui2_showCpuMemChanged
		, hint: '<div style="float:right;font-style:normal;background-color:#373737">'
			+ 'CPU: <span style="color:#00CC00">40%</span><br/>'
			+ "MEM: 1.39G"
			+ "</div>"
			+ "Shows the Blue Iris server's CPU and Memory usage in a readout like this:"
		, category: "Top Bar"
	}
	, {
		key: "ui2_showProfile"
		, value: "1"
		, preLabel: "Show Profile Status:"
		, inputType: "checkbox"
		, onchange: onui2_showProfileChanged
		, hint: '<img src="ui2/ProfileExample.png" style="float:right" />'
			+ "Shows your current profile status in a readout like this:"
		, category: "Top Bar"
	}
	, {
		key: "ui2_enableProfileButtons"
		, value: "1"
		, preLabel: "Allow Profile Changes:"
		, inputType: "checkbox"
		, hint: "Enables you to click the profile status buttons to change profiles.<br/>Requires administrator account.<br/>Requires &quot;Show Profile Status&quot; to be checked."
		, onchange: onui2_enableProfileButtonsChanged
		, category: "Top Bar"
	}
	, {
		key: "ui2_showSchedule"
		, value: "1"
		, preLabel: "Show Schedule Status:"
		, inputType: "checkbox"
		, hint: '<div style="float:right;font-style:normal;background-color:#373737;font-size:12px;line-height:18px">'
			+ '<span style="color:#999999;">Schedule:</span><br/>&nbsp;Default</div>'
			+ "Shows the currently selected schedule in a readout like this:"
		, onchange: onui2_showScheduleChanged
		, category: "Top Bar"
	}
	, {
		key: "ui2_enableScheduleButton"
		, value: "1"
		, preLabel: "Allow Schedule Changes:"
		, inputType: "checkbox"
		, hint: "Requires administrator account.<br/>Requires &quot;Show Schedule Status&quot; to be checked."
		, onchange: onui2_enableScheduleButtonChanged
		, category: "Top Bar"
	}
	, {
		key: "ui2_showDiskInfo"
		, value: "0"
		, preLabel: "Show Disk Info:"
		, inputType: "checkbox"
		, hint: '<div style="float:right;font-style:normal;background-color:#373737;width:250px;">'
			+ 'Clips: 53197 files, 406.6G/1.00T; D: +864.4G</div>'
			+ "Shows the server's disk info in a readout like this:"
		, onchange: onui2_showDiskInfoChanged
		, category: "Top Bar"
	}
	, {
		key: "ui2_diskInfoWidth"
		, value: 250
		, preLabel: "Disk Info Width:"
		, inputType: "number"
		, inputWidth: 80
		, minValue: 10
		, maxValue: 999
		, stepSize: 1
		, hint: "[10-9999] (default: 250)<br/>Every system's Disk Info text can be a different size, so this option lets you resize the box."
		, onchange: onui2_diskInfoWidthChanged
		, category: "Top Bar"
	}
	, {
		key: "ui2_enableFrameRateCounter"
		, value: "0"
		, preLabel: "Show FPS"
		, inputType: "checkbox"
		, hint: 'Shows the current frames per second of the streaming video. This is not compatible with the experimental Frame Rate Boost option.'
		, onchange: onui2_enableFrameRateCounterChanged
		, category: "Top Bar"
	}
	, {
		key: "ui2_showSaveSnapshotButton"
		, value: "1"
		, preLabel: "Show \"Save Snapshot\" Button:"
		, hint: '<div style="float:right;">'
			+ '<img style="height:48px;background-color:#377EC0;" alt="Save Snapshot" src="ui2/save_snapshot96.png" title="Download a frame to disk" /></div>'
			+ "Enables a button you can click to download the current frame to disk. Requires a browser with HTML5 canvas support."
		, inputType: "checkbox"
		, onchange: onui2_showSaveSnapshotButtonChanged
		, category: "Top Bar"
	}
	, {
		key: "ui2_preferredClipList"
		, value: "cliplist"
	}
	, {
		key: "ui2_dpiScalingFactor"
		, value: 1
		, preLabel: "DPI scaling factor:"
		, inputType: "number"
		, inputWidth: 60
		, minValue: 0.1
		, maxValue: 10
		, stepSize: 0.1
		, hint: "[0.1-10] (default: 1.0)<br/>UI2 saves bandwidth by requesting video frames that will fit your screen.  "
			+ "However, <b>if your system uses DPI scaling</b>, UI2 may not be making good use of your extra pixels!  "
			+ "You may fix that here.<br/><br/>For example, if you use a typical Apple Retina Display (which has twice the standard DPI), "
			+ "then a value of 2 would be appropriate here.  If you aren't sure what to put here, try adjusting the number up and down in "
			+ "increments of 0.1 until you find a suitable balance between image quality and frame rate."
		, category: "Video Streaming"
	}
	, {
		key: "ui2_maxImageWidth"
		, value: 20000
		, preLabel: "Maximum image width to request:"
		, inputType: "number"
		, inputWidth: 80
		, minValue: 80
		, maxValue: 20000
		, category: "Video Streaming"
	}
	, {
		key: "ui2_maxImageHeight"
		, value: 20000
		, preLabel: "Maximum image height to request:"
		, inputType: "number"
		, inputWidth: 80
		, minValue: 45
		, maxValue: 20000
		, hint: "[45-20000] If you have extremely high resolution cameras, imposing width and height limits may improve performance at the cost of image quality.  "
			+ "Note that limiting the image size will also limit the usefulness of Digital Zoom."
		, category: "Video Streaming"
	}
	, {
		key: "ui2_useMjpeg"
		, value: "0"
		, preLabel: "Frame Rate Boost<br/><span style=\"color: #FF6666; font-weight: bold;\">Experimental &mdash; Not recommended for most users</span>"
		, inputType: "checkbox"
		, hint: "If enabled, UI2 will use MJPEG video instead of refreshing JPEG images.  In some cases, this will increase frame rates slightly.  But there are many undesirable side-effects which may result in frame rates actually going down.<br/><br/>"
			+ "<span style=\"color: #FF6666; font-weight: bold;\">Known Side Effects:</span><br/>"
			+ "&bull; Image size optimizations are disabled, leading to higher bandwidth usage.  Insufficient bandwidth causes the frame rate to go <b>down, not up</b>.<br/>"
			+ "&bull; DPI scaling factor and Jpeg refresh delay settings are disabled<br/>"
			+ "&bull; Camera-switching responsiveness is worse<br/>"
			+ "&bull; Camera auto-cycle gets locked to one aspect ratio.<br/>"
			+ "&bull; <span style=\"color: #FF6666; font-weight: bold;\">Video will freeze</span> whenever the MJPEG stream unexpectedly ends, because the browser does not notify UI2 when the stream ends.<br/>"
			+ "&bull; Does not work in all browsers.<br/>"
			+ "&bull; Some <span style=\"color: #FF6666; font-weight: bold;\">clip playback</span> features <span style=\"color: #FF6666; font-weight: bold;\">will not work</span>.<br/>"
			+ "&bull; &quot;Low Quality&quot; mode will not work.<br/>"
			+ "&bull; The FPS counter will not work (how is that for irony?)<br/>"
			+ "&bull; The \"Save Snapshot\" button will not work."
		, onchange: GetNewImage
		, category: "Video Streaming"
	}
	, {
		key: "ui2_lowQualityJpegQualityValue"
		, value: 20
		, preLabel: "Low Quality Jpeg Quality:"
		, inputType: "number"
		, inputWidth: 60
		, minValue: 0
		, maxValue: 100
		, stepSize: 1
		, hint: "[0-100] (default: 20)<br/>When &quot;Low Quality&quot; mode is enabled, jpeg encoding quality will be this."
		, category: "Video Streaming"
	}
	, {
		key: "ui2_lowQualityJpegSizeMultiplier"
		, value: 0.3
		, preLabel: "Low Quality Jpeg Scale:"
		, inputType: "number"
		, inputWidth: 60
		, minValue: 0.1
		, maxValue: 1
		, stepSize: 0.05
		, hint: "[0.1-1.0] (default: 0.3)<br/>When &quot;Low Quality&quot; mode is enabled, frames will be requested at this fraction of the normal size."
		, category: "Video Streaming"
	}
	, {
		key: "ui2_defaultCameraGroupId"
		, value: "index"
	}
	, {
		key: "ui2_leftBarSize"
		, value: 210
	}
	, {
		key: "ui2_autoLoadClipList"
		, value: "0"
	}
	, {
		key: "ui2_adminusername"
		, value: ""
	}
	, {
		key: "ui2_adminpassword"
		, value: ""
	}
	, {
		key: "ui2_adminrememberme"
		, value: "0"
		, preLabel: "Remember Me"
		, inputType: "checkbox"
		, hint: "If checked, UI2 will remember your Administrator login credentials so you can more easily use features that require a Blue Iris administrator account."
		, onchange: onui2_adminremembermeChanged
		, category: "Misc"
	}
	, {
		key: "ui2_clipPlaybackSpeed"
		, value: "1"
	}
	, {
		key: "ui2_clipPlaybackSeekBarEnabled"
		, value: "1"
		, preLabel: "Enable Seek Bar"
		, inputType: "checkbox"
		, hint: "If you are using Blue Iris 3 and experiencing clip playback issues, you should disable this."
		, onchange: onui2_clipPlaybackSeekBarEnabledChanged
		, category: "UI Behavior"
	}
	, {
		key: "ui2_clipPlaybackLoopEnabled"
		, value: "0"
	}
	, {
		key: "ui2_clipPlaybackAutoplayEnabled"
		, value: "0"
	}
	, {
		key: "ui2_clipPlaybackControlsMayAppearOnTopBar"
		, value: "1"
		, preLabel: "Playback controls may appear in the top bar:"
		, inputType: "checkbox"
		, hint: "If enabled, the playback controls will prefer to appear in the top bar, as long as there is room."
		, category: "UI Behavior"
	}
	, {
		key: "ui2_clipPlaybackControlsMayAppearOnTop"
		, value: "0"
		, preLabel: "Playback controls may appear on top of video:"
		, inputType: "checkbox"
		, hint: "If checked, the playback controls may be overlayed over the top of the video."
		, category: "UI Behavior"
	}
	, {
		key: "ui2_clipPlaybackControlsMayAppearOnBottom"
		, value: "1"
		, preLabel: "Playback controls may appear on bottom of video:"
		, inputType: "checkbox"
		, hint: "If checked, the playback controls may be overlayed over the bottom of the video."
		, category: "UI Behavior"
	}
	, {
		key: "ui2_clipPlaybackControlsDisappearWhenCursorIsFar"
		, value: "1"
		, preLabel: "Playback controls disappear when cursor is far away:"
		, inputType: "checkbox"
		, hint: "If checked, the playback controls will fade away depending on the distance to the mouse cursor.<br/>Has no effect if the playback controls are in the top bar."
		, category: "UI Behavior"
	}
	, {
		key: "ui2_clipPlaybackControlsMinimumOpacity"
		, value: 50
		, inputType: "number"
		, inputWidth: 40
		, minValue: 0
		, maxValue: 100
		, preLabel: "Playback controls minimum opacity:"
		, hint: "[0-100] (default: 50)<br/>If greater than 0, the playback controls will stay partially visible no matter how far away the mouse cursor is."
		, category: "UI Behavior"
	}
	, {
		key: "ui2_enableHotkeys"
		, value: "1"
		, inputType: "checkbox"
		, preLabel: "Enable Hotkeys:"
		, hint: "You may not disable individual hotkeys, but you can assign key combinations you will never use, such as CTRL + ALT + SHIFT + PAUSE."
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_togglefullscreen"
		, value: "1|0|0|192|tilde (~`)"
		, hotkey: true
		, preLabel: "Toggle Full Screen:"
		, hint: "Toggles the browser between full screen and windowed mode.  Most browsers also go fullscreen when you press F11, regardless of what you set here."
		, hotkeyAction: Hotkey_ToggleFullscreen
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_togglesidebar"
		, value: "0|0|0|192|tilde (~`)"
		, hotkey: true
		, preLabel: "Show/Hide Side Bar:"
		, hint: "Toggles visibility of the side bar."
		, hotkeyAction: Hotkey_ToggleSidebar
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_downloadframe"
		, value: "1|0|0|83|S"
		, hotkey: true
		, preLabel: "Download frame:"
		, hint: 'Downloads the current frame to disk, the same as if you clicked the button.<div style="float:right;">'
			+ '<img style="height:48px;background-color:#377EC0;" alt="Save Snapshot" src="ui2/save_snapshot96.png" title="Download a frame to disk" /></div>'
		, hotkeyAction: Hotkey_DownloadFrame
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_playpause"
		, value: "0|0|0|32|space"
		, hotkey: true
		, preLabel: "Play/Pause:"
		, hint: '<div style="float:right;vertical-align:top;background-color:#373737">'
			+ '<img src="ui2/play48.png" style="width:24px;height:24px;background-color:#377EC0;margin-right:10px" />'
			+ '<img src="ui2/pause48.png" style="width:24px;height:24px;background-color:#377EC0" />'
			+ "</div>"
			+ "Plays or pauses the current recording."
		, hotkeyAction: Hotkey_PlayPause
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_newerClip"
		, value: "0|0|0|38|up arrow"
		, hotkey: true
		, preLabel: "Next Clip:"
		, hint: '<img src="ui2/NextClip.png" style="float:right;height:48px" />'
			+ "Load the next clip, higher up in the list:"
		, hotkeyAction: Hotkey_NextClip
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_olderClip"
		, value: "0|0|0|40|down arrow"
		, hotkey: true
		, preLabel: "Previous Clip:"
		, hint: '<img src="ui2/PreviousClip.png" style="float:right;height:48px" />'
			+ "Load the previous clip, lower down in the list:"
		, hotkeyAction: Hotkey_PreviousClip
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_skipAhead"
		, value: "0|0|0|39|right arrow"
		, hotkey: true
		, preLabel: "Skip Ahead:"
		, hint: "Skips ahead in the current recording by a configurable number of seconds."
		, hotkeyAction: Hotkey_SkipAhead
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_skipBack"
		, value: "0|0|0|37|left arrow"
		, hotkey: true
		, preLabel: "Skip Back:"
		, hint: "Skips back in the current recording by a configurable number of seconds."
		, hotkeyAction: Hotkey_SkipBack
		, category: "Hotkeys"
	}
	, {
		key: "ui2_skipAmount"
		, value: 10
		, inputType: "number"
		, inputWidth: 40
		, minValue: 1
		, maxValue: 9999
		, preLabel: "Skip time:"
		, hint: "[1-9999] (default: 10)<br/>Number of seconds to skip forward and back when using hotkeys to skip."
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_playbackFaster"
		, value: "1|0|0|39|right arrow"
		, hotkey: true
		, preLabel: "Play Faster:"
		, hint: '<img src="ui2/fast48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "Increases clip playback speed."
		, hotkeyAction: Hotkey_PlayFaster
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_playbackSlower"
		, value: "1|0|0|37|left arrow"
		, hotkey: true
		, preLabel: "Play Slower:"
		, hint: '<img src="ui2/slow48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "Decreases clip playback speed."
		, hotkeyAction: Hotkey_PlaySlower
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_playbackForwardReverse"
		, value: "1|0|0|32|space"
		, hotkey: true
		, preLabel: "Toggle Forward/Reverse:"
		, hint: '<div style="float:right;vertical-align:top;background-color:#373737">'
			+ '<img src="ui2/fastforward48.png" style="width:24px;height:24px;background-color:#377EC0;margin-right:10px" />'
			+ '<img src="ui2/rewind48.png" style="width:24px;height:24px;background-color:#377EC0" />'
			+ "</div>"
			+ "Toggles betweeen forward and reverse clip playback."
		, hotkeyAction: Hotkey_PlayForwardReverse
		, category: "Hotkeys"
	}
	, {
		key: "ui2_autoplayReverse"
		, value: "0"
		, preLabel: "Autoplay Reverse"
		, inputType: "checkbox"
		, hint: "Reverses the order of clip traversal when autoplay is enabled.<br/>"
		+ '(Autoplay is the <img src="ui2/squares48.png" style="background-color:#377EC0;width:24px;height:24px;" /> button)'
		, category: "UI Behavior"
	}
	, {
		key: "ui2_hotkey_digitalZoomIn"
		, value: "0|0|0|187|="
		, hotkey: true
		, preLabel: "Digital Zoom In:"
		, hint: "This has the same function as rolling a mouse wheel upward."
		, hotkeyAction: Hotkey_DigitalZoomIn
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_digitalZoomOut"
		, value: "0|0|0|189|-"
		, hotkey: true
		, preLabel: "Digital Zoom Out:"
		, hint: "This has the same function as rolling a mouse wheel downward."
		, hotkeyAction: Hotkey_DigitalZoomOut
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzUp"
		, value: "0|0|0|38|up arrow"
		, hotkey: true
		, preLabel: "PTZ Up:"
		, hint: '<img src="ui2/up48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, moves the camera up."
		, hotkeyAction: Hotkey_PtzUp
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzDown"
		, value: "0|0|0|40|down arrow"
		, hotkey: true
		, preLabel: "PTZ Down:"
		, hint: '<img src="ui2/down48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, moves the camera down."
		, hotkeyAction: Hotkey_PtzDown
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzLeft"
		, value: "0|0|0|37|left arrow"
		, hotkey: true
		, preLabel: "PTZ Left:"
		, hint: '<img src="ui2/left48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, moves the camera left."
		, hotkeyAction: Hotkey_PtzLeft
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzRight"
		, value: "0|0|0|39|right arrow"
		, hotkey: true
		, preLabel: "PTZ Right:"
		, hint: '<img src="ui2/right48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, moves the camera right."
		, hotkeyAction: Hotkey_PtzRight
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzIn"
		, value: "1|0|0|187|="
		, hotkey: true
		, preLabel: "PTZ Zoom In:"
		, hint: '<img src="ui2/zoom_in48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, zooms the camera in."
		, hotkeyAction: Hotkey_PtzIn
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzOut"
		, value: "1|0|0|189|-"
		, hotkey: true
		, preLabel: "PTZ Zoom Out:"
		, hint: '<img src="ui2/zoom_out48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, zooms the camera out."
		, hotkeyAction: Hotkey_PtzOut
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset1"
		, value: "0|0|0|49|1"
		, hotkey: true
		, preLabel: "Load Preset 1:"
		, hint: "If the current live camera is PTZ, loads preset 1."
		, hotkeyAction: function () { Hotkey_PtzPreset(1); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset2"
		, value: "0|0|0|50|2"
		, hotkey: true
		, preLabel: "Load Preset 2:"
		, hint: "If the current live camera is PTZ, loads preset 2."
		, hotkeyAction: function () { Hotkey_PtzPreset(2); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset3"
		, value: "0|0|0|51|3"
		, hotkey: true
		, preLabel: "Load Preset 3:"
		, hint: "If the current live camera is PTZ, loads preset 3."
		, hotkeyAction: function () { Hotkey_PtzPreset(3); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset4"
		, value: "0|0|0|52|4"
		, hotkey: true
		, preLabel: "Load Preset 4:"
		, hint: "If the current live camera is PTZ, loads preset 4."
		, hotkeyAction: function () { Hotkey_PtzPreset(4); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset5"
		, value: "0|0|0|53|5"
		, hotkey: true
		, preLabel: "Load Preset 5:"
		, hint: "If the current live camera is PTZ, loads preset 5."
		, hotkeyAction: function () { Hotkey_PtzPreset(5); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset6"
		, value: "0|0|0|54|6"
		, hotkey: true
		, preLabel: "Load Preset 6:"
		, hint: "If the current live camera is PTZ, loads preset 6."
		, hotkeyAction: function () { Hotkey_PtzPreset(6); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset7"
		, value: "0|0|0|55|7"
		, hotkey: true
		, preLabel: "Load Preset 7:"
		, hint: "If the current live camera is PTZ, loads preset 7."
		, hotkeyAction: function () { Hotkey_PtzPreset(7); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset8"
		, value: "0|0|0|56|8"
		, hotkey: true
		, preLabel: "Load Preset 8:"
		, hint: "If the current live camera is PTZ, loads preset 8."
		, hotkeyAction: function () { Hotkey_PtzPreset(8); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset9"
		, value: "0|0|0|57|9"
		, hotkey: true
		, preLabel: "Load Preset 9:"
		, hint: "If the current live camera is PTZ, loads preset 9."
		, hotkeyAction: function () { Hotkey_PtzPreset(9); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset10"
		, value: "0|0|0|48|0"
		, hotkey: true
		, preLabel: "Load Preset 10:"
		, hint: "If the current live camera is PTZ, loads preset 10."
		, hotkeyAction: function () { Hotkey_PtzPreset(10); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset11"
		, value: "1|0|0|49|1"
		, hotkey: true
		, preLabel: "Load Preset 11:"
		, hint: "If the current live camera is PTZ, loads preset 11."
		, hotkeyAction: function () { Hotkey_PtzPreset(11); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset12"
		, value: "1|0|0|50|2"
		, hotkey: true
		, preLabel: "Load Preset 12:"
		, hint: "If the current live camera is PTZ, loads preset 12."
		, hotkeyAction: function () { Hotkey_PtzPreset(12); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset13"
		, value: "1|0|0|51|3"
		, hotkey: true
		, preLabel: "Load Preset 13:"
		, hint: "If the current live camera is PTZ, loads preset 13."
		, hotkeyAction: function () { Hotkey_PtzPreset(13); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset14"
		, value: "1|0|0|52|4"
		, hotkey: true
		, preLabel: "Load Preset 14:"
		, hint: "If the current live camera is PTZ, loads preset 14."
		, hotkeyAction: function () { Hotkey_PtzPreset(14); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset15"
		, value: "1|0|0|53|5"
		, hotkey: true
		, preLabel: "Load Preset 15:"
		, hint: "If the current live camera is PTZ, loads preset 15."
		, hotkeyAction: function () { Hotkey_PtzPreset(15); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset16"
		, value: "1|0|0|54|6"
		, hotkey: true
		, preLabel: "Load Preset 16:"
		, hint: "If the current live camera is PTZ, loads preset 16."
		, hotkeyAction: function () { Hotkey_PtzPreset(16); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset17"
		, value: "1|0|0|55|7"
		, hotkey: true
		, preLabel: "Load Preset 17:"
		, hint: "If the current live camera is PTZ, loads preset 17."
		, hotkeyAction: function () { Hotkey_PtzPreset(17); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset18"
		, value: "1|0|0|56|8"
		, hotkey: true
		, preLabel: "Load Preset 18:"
		, hint: "If the current live camera is PTZ, loads preset 18."
		, hotkeyAction: function () { Hotkey_PtzPreset(18); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset19"
		, value: "1|0|0|57|9"
		, hotkey: true
		, preLabel: "Load Preset 19:"
		, hint: "If the current live camera is PTZ, loads preset 19."
		, hotkeyAction: function () { Hotkey_PtzPreset(19); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_hotkey_ptzPreset20"
		, value: "1|0|0|48|0"
		, hotkey: true
		, preLabel: "Load Preset 20:"
		, hint: "If the current live camera is PTZ, loads preset 20."
		, hotkeyAction: function () { Hotkey_PtzPreset(20); }
		, category: "Hotkeys"
	}
	, {
		key: "ui2_clipListDateUseLocale"
		, value: "0"
		, preLabel: "Locale format clip timestamps"
		, inputType: "checkbox"
		, hint: 'If checked, clip and alert lists will use a locale-specific date format which varies by country, region, or language. By default, UI2 uses a standardized format because the locale format may not fit in the allotted space. Reload the clip or alert list for this to take effect.<br/>'
				+ '<br/>&nbsp;&nbsp;Standard format: ' + GetDateStr(new Date())
				+ '<br/>&nbsp;&nbsp;&nbsp;&nbsp;Locale format: ' + new Date().toLocaleString()
		, category: "Misc"
	}
	, {
		key: "ui2_lastLoadedVersion"
		, value: "0.9.2"
	}
	, {
		key: "ui2_lastUpdateCheck"
		, value: 0
	}
	, {
		key: "ui2_doAutoUpdateCheck"
		, value: "1"
		, preLabel: "Automatic update check"
		, inputType: "checkbox"
		, hint: 'If checked, UI2 will automatically check for updates when it loads, no more often than once every 12 hours.<br/><a href="javascript:CheckForUpdates(true)">Click here to check for an update now.</a>'
		, onchange: onui2_doAutoUpdateCheckChanged
		, category: "Misc"
	}
	, {
		key: "ui2_lastIgnoredVersion"
		, value: "0.9.2"
	}
	, {
		key: "ui2_enableCanvasDrawing"
		, value: "0"
		, preLabel: "Enable Canvas"
		, inputType: "checkbox"
		, hint: '<p>If checked, video will be drawn to an HTML5 canvas element.</p>'
			+ '<p>Drawing to a canvas has many effects:</p>'
			+ '<p><ul>'
			+ '<li>The canvas is <b>not supported in all browsers.</b></li>'
			+ '<li>The canvas is <b>incompatible with the experimental Frame Rate Boost option.</b></li>'
			+ '<li>CPU usage may <b>increase or decrease</b>.</li>'
			+ '<li>Memory usage may be affected.</li>'
			+ '<li>Image quality may be affected.</li>'
			+ '<li>The canvas enables the use of video filters.</li>'
			+ '</ul></p>'
		, onchange: onui2_enableCanvasDrawingChanged
		, category: "HTML5 Canvas"
	}
	//, {
	//	key: "ui2_jpegDiffEnabled"
	//	, value: "0"
	//	, preLabel: "Enable <b>Experimental</b> JpegDiff encoding"
	//	, inputType: "checkbox"
	//	, hint: '<p>Requires the canvas to be enabled.</p>'
	//		+ '<p>JpegDiff encoding is available because it was detected that you are using a compatible version of UI2Service. Here is what JpegDiff encoding means:</p>'
	//		+ '<p><ul>'
	//		+ '<li>Images are compared server-side and only the difference between images is transmitted, saving bandwidth.</li>'
	//		+ '<li>Bandwidth usage is usually reduced by as much as 50%.</li>'
	//		+ '<li>CPU usage is increased on both the server and in the browser.</li>'
	//		+ '<li>Over a low-bandwidth internet connection, frame rate may be improved. But on a fast connection (e.g. a LAN), frame rate is likely to decrease.</li>'
	//		+ '<li>Image quality is reduced.</li>'
	//		+ '<li>Different web browsers use different JPEG decoders which produce slightly different results. My best experience was with Firefox. Colors quickly shifted toward purple in Chrome, and Microsoft Edge performed slowly.</li>'
	//		+ '</ul></p>'
	//	, displayCondition: function () { return serverJpegDiffStreamVersions.indexOf(clientJpegDiffStreamVersion) != -1; }
	//	, category: "HTML5 Canvas"
	//}
	//, {
	//	key: "ui2_jpegDiffKeyframeIntervalMs"
	//	, value: 4000
	//	, inputType: "number"
	//	, minValue: 0
	//	, maxValue: 600000
	//	, stepSize: 100
	//	, preLabel: "JpegDiff keyframe interval"
	//	, hint: 'Number of milliseconds to wait between requesting keyframes. '
	//		+ 'Due to JPEG decoding differences between UI2Service and the browser, the image will degrade gradually between keyframes in all browsers. '
	//		+ 'Keyframes are larger than other frames, so you save the most bandwidth by requesting them less often. '
	//		+ 'The image quality degradation can be faster in some browsers.'
	//	, displayCondition: function () { return serverJpegDiffStreamVersions.indexOf(clientJpegDiffStreamVersion) != -1; }
	//	, category: "HTML5 Canvas"
	//}
	//, {
	//	key: "ui2_jpegDiffCompressionQuality"
	//	, value: 80
	//	, inputType: "number"
	//	, minValue: 1
	//	, maxValue: 100
	//	, stepSize: 1
	//	, preLabel: "JpegDiff compression quality"
	//	, hint: 'Accepted range: 1-100. This setting controls the JpegDiff compression specifically. '
	//		+ 'The Low Quality mode available in the Video Streaming tab affects Blue Iris jpeg compression quality, but does not directly affect JpegDiff compression quality.'
	//	, displayCondition: function () { return serverJpegDiffStreamVersions.indexOf(clientJpegDiffStreamVersion) != -1; }
	//	, category: "HTML5 Canvas"
	//}
	, {
		key: "ui2_enableVideoFilter"
		, value: "0"
		, preLabel: "Enable Video Filter"
		, inputType: "checkbox"
		, hint: 'If checked, video frames drawn to the canvas will be passed through a custom filter script first.'
		, onchange: onui2_enableVideoFilterChanged
		, category: "HTML5 Canvas"
	}
	, {
		key: "ui2_preferredVideoFilter"
		, value: ""
		, preLabel: "Custom Video Filter JavaScript:<br/><br/>customVideoFilter = function(rgba) {"
		, postLabel: "<br/>}"
		, inputType: "textarea"
		, hint: '<div style="float:right;margin-right: 30px;">Preview:<br/>'
			+ '<canvas id="video_filter_preview_canvas" style="max-width:320px;max-height:320px;border:1px solid #990000;"></canvas></div>'
			+ '<p>You may enter your own script, or click any of the buttons below to load a predefined filter script:</p>'
			+ '<p><ul>'
			+ '<li><input type="button" value="red1" onclick="loadPredefinedFilter(\'red1\')"/> - Drops the green and blue color channels, leaving only red.</li>'
			+ '<li><input type="button" value="red2" onclick="loadPredefinedFilter(\'red2\')"/> - Replaces red channel with brightest values from all 3 color channels, then drops green and blue channels.</li>'
			+ '<li><input type="button" value="red3" onclick="loadPredefinedFilter(\'red3\')"/> - Replaces red channel with the average of the 3 color channels, then drops green and blue channels.</li>'
			+ '<li><input type="button" value="ghost" onclick="loadPredefinedFilter(\'ghost\')"/> - Sets the alpha channel to the average of the 3 color channels.</li>'
			+ '<li><input type="button" value="invert" onclick="loadPredefinedFilter(\'invert\')"/> - Inverts all pixel values.</li>'
			+ '<li><input type="button" value="invert_red3" onclick="loadPredefinedFilter(\'invert_red3\')"/> - Combines the effects of <b>red3</b> and <b>invert</b> filters.</li>'
			+ '</ul></p>'
		, onchange: onui2_preferredVideoFilterChanged
		, category: "HTML5 Canvas"
	}
];
function OverrideDefaultSetting(key, value, OptionsWindow, AlwaysReload, Generation)
{
	for (var i = 0; i < defaultSettings.length; i++)
		if (defaultSettings[i].key == key)
		{
			defaultSettings[i].value = value;
			defaultSettings[i].AlwaysReload = AlwaysReload;
			defaultSettings[i].Generation = Generation;
			if (!OptionsWindow)
				defaultSettings[i].preLabel = null;
			break;
		}
}
function LoadDefaultSettings()
{
	for (var i = 0; i < defaultSettings.length; i++)
	{
		if (settings.getItem(defaultSettings[i].key) == null
			|| defaultSettings[i].AlwaysReload
			|| IsNewGeneration(defaultSettings[i].key, defaultSettings[i].Generation))
			settings.setItem(defaultSettings[i].key, defaultSettings[i].value);
	}
}
function IsNewGeneration(key, gen)
{
	if (typeof gen == "undefined" || gen == null)
		return false;

	gen = parseInt(gen);
	var currentGen = settings.getItem("ui2_gen_" + key);
	if (currentGen == null)
		currentGen = 0;
	else
		currentGen = parseInt(currentGen);

	var isNewGen = gen > currentGen;
	if (isNewGen)
		settings.setItem("ui2_gen_" + key, gen);
	return isNewGen;
}
function GetDummyLocalStorage()
{
	var dummy = new Object();
	dummy.getItem = function (key)
	{
		return dummy[key];
	}
	dummy.setItem = function (key, value)
	{
		return dummy[key] = value;
	}
	return dummy;
}
///////////////////////////////////////////////////////////////
// Interface Loading //////////////////////////////////////////
///////////////////////////////////////////////////////////////
var windowLoaded = false;
var statusLoaded = false;
var cameraListLoaded = false;
var loginLoaded = false;
var loadingFinished = false;

$(function ()
{
	// Start loading and initializing everything here.
	LoadDefaultSettings();

	//QueryJpegDiffCompatibility();

	onui2_showSystemNameChanged();
	onui2_showStoplightChanged();
	onui2_enableStoplightButtonChanged();
	onui2_showCpuMemChanged();
	onui2_showProfileChanged();
	onui2_enableProfileButtonsChanged();
	onui2_showScheduleChanged();
	onui2_enableScheduleButtonChanged();
	onui2_showDiskInfoChanged();
	onui2_diskInfoWidthChanged();
	onui2_showQualityButtonChanged();
	onui2_enableCanvasDrawingChanged();
	onui2_preferredVideoFilterChanged(true);
	onui2_enableFrameRateCounterChanged();
	onui2_showSaveSnapshotButtonChanged();

	if (settings.ui2_autoLoadClipList == "1")
		$("#btn_autoLoadClipList").addClass("selected");

	if (!allowUserToChangeSettings)
		$("#btnOptions").remove();

	// This makes it impossible to text-select or drag certain UI elements.
	makeUnselectable($("#layouttop, #layoutleft, #layoutdivider, #layoutbody"));

	LoadStatus();

	LoadContextMenus();
	EnableDraggableDivider();
	EnablePTZButtons();
	EnableProfileButtons();
	EnableStoplightButton();
	InitDropdownListLogic();
	InitPlaybackLogic();
	InitQualityButtonLogic();
	EnableHotkeys();

	if (settings.ui2_adminrememberme == "1")
	{
		SessionLogin(SimpleTextGibberize(settings.ui2_adminusername), SimpleTextGibberize(settings.ui2_adminpassword));
		$("#cbRememberMe").prop("checked", true);
	}
	else
		SessionLogin("", "");

	$(window).resize(resized);
	resized();

	setTimeout(function ()
	{
		CheckForUpdates_Automatic();
	}, 1000);
});
$(window).load(function ()
{
	windowLoaded = true;
	SetLoadedStatus("#loadingWebContent");
});
function FinishLoadingIfConditionsMet()
{
	if (loadingFinished)
		return;
	if (windowLoaded && cameraListLoaded && statusLoaded && loginLoaded)
	{
		loadingFinished = true;
		$("#loadingmsgwrapper").remove();

		resized();
		StartRefresh();
	}
}
///////////////////////////////////////////////////////////////
// UI Resize //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function resized()
{
	var windowW = $(window).width();
	var windowH = $(window).height();

	var layouttop = $("#layouttop");
	var layoutleft = $("#layoutleft");
	var layoutdivider = $("#layoutdivider");
	var layoutbody = $("#layoutbody");

	var topV = layouttop.is(":visible");
	var leftW = layoutleft.outerWidth(true);

	// The layoutleft element must not be too large.
	var newWidth = $('#layoutleft');
	if (leftW > windowW - 50)
	{
		leftW = windowW - 50;
		layoutleft.css('width', leftW + "px");
	}

	settings.ui2_leftBarSize = leftW;

	// Size the main layout panels
	if (leftW <= 0 && topV)
	{
		if (settings.ui2_hideTopBar == "1")
		{
			layouttop.hide();
			topV = false;
		}
		goLive();
	}
	else if (leftW > 0 && !topV)
	{
		layouttop.show();
		topV = true;
	}

	if (!topV && settings.ui2_hideTopBar != "1")
	{
		layouttop.show();
		topV = true;
	}

	var topH = topV ? layouttop.outerHeight(true) : 0;

	layoutleft.css("top", topH);
	layoutleft.css("height", windowH - topH + "px");

	layoutdivider.css("top", topH);
	layoutdivider.css("left", leftW + "px");
	layoutdivider.css("height", windowH - topH + "px");

	layoutbody.css("top", topH);
	layoutbody.css("left", leftW + "px");
	layoutbody.css("width", windowW - leftW + "px");
	layoutbody.css("height", windowH - topH + "px");

	PositionPlaybackControls();

	var clipsheading = $("#clipsheading");
	var clipstools = $("#clipstools");
	var clipsbody = $("#clipsbody");

	var totalButtonsWidth = 0;
	clipstools.children().each(function (idx, ele)
	{
		var eleId = ele.getAttribute("id");
		if (eleId != "clipsCameraName" && eleId != "clipstools_clearboth" && eleId != "btnGoLive")
		{
			totalButtonsWidth += $(ele).outerWidth(true);
		}
	});
	var clipsCameraName = $("#clipsCameraName");
	var clipsCameraNameWidth = clipstools.width() - totalButtonsWidth - (clipsCameraName.outerWidth(true) - clipsCameraName.width()) - 2; // -2 because otherwise sometimes the line wraps to two lines when using DPI scaling or zoom.
	$("#clipsCameraName").css("width", clipsCameraNameWidth + "px");

	clipsbody.css("height", layoutbody.outerHeight(true) - clipsheading.outerHeight(true) - clipstools.outerHeight(true) + "px");

	$(".dropdown_list").each(function (idx, ele)
	{
		var $ele = $(ele);
		$ele.css("max-height", ((windowH - 40) - $ele.offset().top) + "px");
	});

	ImgResized();
}
///////////////////////////////////////////////////////////////
// Playback Controls Layout ///////////////////////////////////
///////////////////////////////////////////////////////////////
var lastOpacity = 2;
var requiredTopBarWidth = 475;
function PositionPlaybackControls()
{
	var playback_controls = $("#playback_controls");
	var pcH = playback_controls.outerHeight(true);
	var windowH = $(window).height();
	var windowW = $(window).width();
	var playback_controls_width;
	var topH = $("#layoutdivider").offset().top;
	var playback_controls_top;
	var mayAppearTop = settings.ui2_clipPlaybackControlsMayAppearOnTop == "1";
	var mayAppearBottom = settings.ui2_clipPlaybackControlsMayAppearOnBottom == "1";
	var mayAppearTopBar = settings.ui2_clipPlaybackControlsMayAppearOnTopBar == "1";
	var availableTopBarWidth = mayAppearTopBar ? CalculateAvailableTopBarWidthForPlaybackControls() : 0;
	var shouldAppearOnTopBar = availableTopBarWidth > requiredTopBarWidth;
	if ((!mayAppearTop && !mayAppearBottom && !shouldAppearOnTopBar) || currentlyLoadingImage.isLive)
	{
		lastOpacity = 2;
		playback_controls.css("z-index", -1);
		return;
	}
	if (shouldAppearOnTopBar)
	{
		playback_controls_top = 0;
		playback_controls_width = availableTopBarWidth - 10;
		if (playback_controls.parent().attr("id") != "layouttop")
			playback_controls.appendTo("#layouttop");
		playback_controls.css("display", "inline-block");
	}
	else
	{
		if (!mayAppearTop
		   || (mayAppearBottom
			   && mouseY > ((windowH - topH) / 2) + topH))
			playback_controls_top = windowH - topH - pcH - 10;
		else
			playback_controls_top = 10;
		playback_controls_width = windowW - $("#layoutleft").outerWidth(true) - 50;
		if (playback_controls.parent().attr("id") != "layoutbody")
			playback_controls.appendTo("#layoutbody");
		playback_controls.css("display", "block");
	}
	playback_controls.css("top", playback_controls_top + "px");
	playback_controls.css("width", playback_controls_width + "px");

	SetSeekbarPositionByPlaybackTime(clipPlaybackPosition);

	// Determine opacity of playback controls.
	var opacity = 0;
	var layoutbody = $("#layoutbody");
	var bodyOffset = layoutbody.offset();
	if (isDraggingSeekbar || settings.ui2_clipPlaybackControlsDisappearWhenCursorIsFar != "1" || shouldAppearOnTopBar)
		opacity = 1;
	else
		//if (mouseX >= bodyOffset.left
		//&& mouseY >= bodyOffset.top
		//&& mouseX < bodyOffset.left + layoutbody.outerWidth(true)
		//&& mouseY < bodyOffset.top + layoutbody.outerHeight(true))
	{
		var pcY = playback_controls.offset().top + (pcH / 2);
		var distance = Math.abs(mouseY - pcY);
		if (distance > 50)
		{
			var fadeDistance = Math.max(layoutbody.outerHeight(true) * 0.37, 200);
			opacity = 1.0 - ((distance - 50) / fadeDistance);
		}
		else
			opacity = 1;
	}
	var minOpacity = parseInt(settings.ui2_clipPlaybackControlsMinimumOpacity) / 100.0;
	if (opacity < minOpacity)
		opacity = minOpacity;
	if (lastOpacity != opacity)
	{
		lastOpacity = opacity;
		if (opacity <= 0.009)
		{
			opacity = 1;
			playback_controls.css("z-index", -1);
		}
		else
			playback_controls.css("z-index", 1);
		playback_controls.css("opacity", opacity);
	}
}
function CalculateAvailableTopBarWidthForPlaybackControls()
{
	var layouttop = $("#layouttop");
	var totalWidth = layouttop.width();
	var usedWidth = 10; // The Log Out button has 10 uncounted pixels to the right.
	layouttop.children().each(function (idx, ele)
	{
		var $ele = $(ele);
		if ($ele.attr("id") != "playback_controls" && $ele.is(":visible"))
			usedWidth += $ele.outerWidth(true);
	});
	return totalWidth - usedWidth;
}
///////////////////////////////////////////////////////////////
// Status Update //////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var lastStatusResponse = null;
var statusUpdateTimeout = null;
var currentProfileNames = null;
var currentlySelectedSchedule = "";
var globalScheduleEnabled = false;
var lastStatusUpdateFailed = false;
function LoadStatus(profileNum, stoplightState, schedule)
{
	if (statusUpdateTimeout != null)
		clearTimeout(statusUpdateTimeout);

	var args = { cmd: "status" };
	if (typeof profileNum != "undefined" && profileNum != null && settings.ui2_enableProfileButtons == "1")
	{
		if (isAdministratorSession)
			args.profile = parseInt(profileNum);
		else
		{
			openLoginDialog();
		}
	}
	if (typeof stoplightState != "undefined" && stoplightState != null && settings.ui2_enableStoplightButton == "1")
	{
		if (isAdministratorSession)
			args.signal = parseInt(stoplightState);
		else
		{
			openLoginDialog();
		}
	}
	if (typeof schedule != "undefined" && schedule != null && settings.ui2_enableScheduleButton == "1")
	{
		if (isAdministratorSession)
			args.schedule = schedule;
		else
		{
			openLoginDialog();
		}
	}
	ExecJSON(args, function (response)
	{
		if (response && typeof response.result != "undefined" && response.result == "fail")
		{
			showWarningToast('UI2 has detected that your Blue Iris session may have expired.  This page will reload momentarily.', 10000);
			setTimeout(function ()
			{
				location.reload();
			}, 5000);
			return;
		}

		if (lastStatusUpdateFailed)
			KickstartMjpegStream();
		lastStatusUpdateFailed = false;

		HandleChangesInStatus(lastStatusResponse, response);
		lastStatusResponse = response;
		if (response && response.data)
		{
			$("#stoplight img").hide();
			if (response.data.signal == "0")
				$("#stoplightred").show();
			else if (response.data.signal == "1")
				$("#stoplightgreen").show();
			else if (response.data.signal == "2")
				$("#stoplightyellow").show();

			$("#cpuusage").text(response.data.cpu + "%");
			if (response.data.cpu < 50)
				$("#cpuusage").css("color", "#00CC00");
			else if (response.data.cpu < 70)
				$("#cpuusage").css("color", "#99CC00");
			else if (response.data.cpu < 80)
				$("#cpuusage").css("color", "#CCCC00");
			else if (response.data.cpu < 87)
				$("#cpuusage").css("color", "#CCAA00");
			else if (response.data.cpu < 95)
				$("#cpuusage").css("color", "#CC9900");
			else
				$("#cpuusage").css("color", "#CC0000");
			$("#memusage").text(response.data.mem);
			$("#current_schedule").attr("title", response.data.schedule);
			$("#diskinfo").text(response.data.clips);
			UpdateProfileStatus();
			UpdateScheduleStatus();
		}
		statusLoaded = true;
		SetLoadedStatus("#loadingServerStatus");

		var nextStatusUpdateDelay = settings.ui2_timeBetweenStatusUpdates;
		if (typeof args.schedule != "undefined")
			nextStatusUpdateDelay = 1000; // We just updated the schedule. Refresh again soon in case of profile change.
		statusUpdateTimeout = setTimeout(function ()
		{
			LoadStatus();
		}, nextStatusUpdateDelay);
	}, function ()
	{
		lastStatusUpdateFailed = true;
		statusUpdateTimeout = setTimeout(function ()
		{
			LoadStatus();
		}, Math.max(settings.ui2_timeBetweenStatusUpdates, 1000));
	});
}
function HandleChangesInStatus(oldStatus, newStatus)
{
	if (oldStatus && oldStatus.data && newStatus && newStatus.data)
	{
		if (oldStatus.data.profile != newStatus.data.profile)
			ProfileChanged();
	}
}
var profileChangedTimeout = null;
function ProfileChanged()
{
	// Refresh the clips and camera lists.
	showInfoToast("Your profile has changed.<br/>Reinitializing shortly...", 5000);
	if (profileChangedTimeout != null)
		clearTimeout(profileChangedTimeout);
	profileChangedTimeout = setTimeout(function () { firstCameraListLoaded = false; LoadCameraList(); KickstartMjpegStream(); }, 5000);
}
function UpdateProfileStatus()
{
	if (lastStatusResponse == null)
		return;
	var selectedProfile = lastStatusResponse.data.profile;
	var schedule = lastStatusResponse.data.schedule;
	if (schedule == "")
		schedule = "N/A";
	var lock = lastStatusResponse.data.lock;
	$(".profilebtn").removeClass("selected");
	$('.profilebtn[profilenum="' + selectedProfile + '"]').addClass("selected");
	if (lock == 0)
	{
		$("#schedule_lock_button").removeClass("hold");
		$("#schedule_lock_button").removeClass("temp");
		$("#schedule_lock_overlay").attr("src", "ui2/refresh44x94.png");
		$("#schedule_lock_button").attr("title", 'Schedule "' + schedule + '" is active. Click to disable automatic scheduling.');
	}
	else if (lock == 1)
	{
		$("#schedule_lock_button").addClass("hold");
		$("#schedule_lock_button").removeClass("temp");
		$("#schedule_lock_overlay").attr("src", "ui2/hold44x94.png");
		$("#schedule_lock_button").attr("title", 'Schedule "' + schedule + '" is currently disabled. Click to re-enable.');
	}
	else if (lock == 2)
	{
		$("#schedule_lock_button").removeClass("hold");
		$("#schedule_lock_button").addClass("temp");
		$("#schedule_lock_overlay").attr("src", "ui2/clock44x94.png");
		$("#schedule_lock_button").attr("title", 'Schedule "' + schedule + '" is temporarily overridden. Click to resume schedule, or wait some hours and it should return to normal.');
	}
	else
		showErrorToast("unexpected <b>lock</b> value from Blue Iris status");
	if (currentProfileNames)
		for (var i = 0; i < 8; i++)
		{
			var tooltipText = currentProfileNames[i];
			if (i == 0 && tooltipText == "Inactive")
				tooltipText = "Inactive profile";
			$('.profilebtn[profilenum="' + i + '"]').attr("title", tooltipText);
		}
}
function UpdateScheduleStatus()
{
	if (lastStatusResponse == null)
		return;
	currentlySelectedSchedule = lastStatusResponse.data.schedule;
	globalScheduleEnabled = currentlySelectedSchedule != "";
	if (!globalScheduleEnabled)
		currentlySelectedSchedule = "N/A";
	$("#selectedSchedule").text(currentlySelectedSchedule);
}
function EnableProfileButtons()
{
	$("#schedule_lock_button").click(function ()
	{
		LoadStatus(-1);
	});
	$(".profilebtn").click(function ()
	{
		LoadStatus($(this).attr("profilenum"));
	});
}
function EnableStoplightButton()
{
	$("#stoplight").click(function ()
	{
		if (lastStatusResponse == null)
			return;
		var newSignal = 0;
		if (lastStatusResponse.data.signal != 0)
			newSignal = 0;
		else
			newSignal = 2;
		LoadStatus(null, newSignal);
	});
}
///////////////////////////////////////////////////////////////
// Load Clip List /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var clipListCache = new Object();
var lastClickedClip = null;
var clipListTimeout = null;
var isLoadingAClipList = false;
var failedClipListLoads = 0;
var currentlySelectedClipGroupId = null;
function LoadClips(listName, cameraId)
{
	if (typeof cameraId == "undefined" || cameraId == null)
		cameraId = currentlyLoadingImage.id;
	else if (cameraId == "preserve_current_clipgroup")
		cameraId = currentlySelectedClipGroupId;
	SelectClipsCamera(cameraId);

	if (isLoadingAClipList)
	{
		showInfoToast("A clip list is already loading");
		return;
	}
	if (typeof (listName) == "undefined" || listName == null)
		listName = settings.ui2_preferredClipList;

	if (listName == "cliplist")
	{
		$("#clipsheading").text("Clips");
		$("#btn_clips").addClass("selected");
		$("#btn_alerts").removeClass("selected");
	}
	else
	{
		listName = "alertlist";
		$("#clipsheading").text("Alerts");
		$("#btn_alerts").addClass("selected");
		$("#btn_clips").removeClass("selected");
	}

	settings.ui2_preferredClipList = listName;

	lastClickedClip = null;
	$("#clipsbody").empty();
	$("#clipsbody").html('<img src="ui2/ajax-loader-clips.gif" alt="Loading ..." style="margin: 20px" />');
	unregisterAllOnAppearDisappear();
	emptyAsyncImageQueue();

	isLoadingAClipList = true;
	ExecJSON({ cmd: listName, camera: cameraId }, function (response)
	{
		RestartImageQueue();

		failedClipListLoads = 0;
		isLoadingAClipList = false;

		var clipsbody = $("#clipsbody");
		clipsbody.empty();
		//		console.log("START");
		//		var start = new Date().getTime();
		if (typeof (response.data) != "undefined")
		{
			clipsbody.append('<div style="height:' + (86 * response.data.length) + 'px;width:0px;"></div>'); // Forces clip list to be the correct length before clip tiles load.
			for (var i = 0; i < response.data.length; i++)
			{
				// clip.camera : "shortname"
				// clip.path : "@0000123.bvr"
				// clip.offset : 0
				// clip.date : 12345
				// clip.color : 8151097
				// clip.flags : 128
				// clip.msec : 6261
				// clip.filesize : "10sec (3.09M)"
				// clip.filetype : "bvr H264 New"

				var clip = response.data[i];
				var clipData = new Object();
				clipData.camera = clip.camera;
				clipData.path = clip.path;
				clipData.date = new Date(clip.date * 1000);
				clipData.colorHex = BlueIrisColorToCssColor(clip.color);
				clipData.nameColorHex = GetReadableTextColorHexForBackgroundColorHex(clipData.colorHex);
				clipData.roughLength = CleanUpFileSize(clip.filesize);
				if (clip.msec && listName == "cliplist")
					clipData.msec = clip.msec;
				else
					clipData.msec = GetClipLengthMs(clipData.roughLength);

				if (clip.jpeg)
				{
					clipData.clipId = clip.jpeg.replace(/@/g, "");
					clipData.thumbPath = clip.jpeg;
				}
				else
				{
					clipData.clipId = clip.path.replace(/@/g, "").replace(/\..*/g, "");
					clipData.thumbPath = clip.path;
				}

				if (!clipListCache[clip.camera])
					clipListCache[clip.camera] = new Object();
				clipListCache[clip.camera][clip.path] = clipData;

				registerOnAppearDisappear(clipData, 0, (i * 86), ClipOnAppear, ClipOnDisappear);
			}
		}
		// var end = new Date().getTime();
		//		console.log("FINISH");
		//		console.log(end - start);
		// showInfoToast("Clip list loaded in <br/>" + (end - start) / 1000.0);

		appearDisappearCheck();

		//		if (settings.clipListAutoRefresh)
		//		{
		//			if (clipListTimeout)
		//				clearTimeout(clipListTimeout);
		//			clipListTimeout = setTimeout(function ()
		//			{
		//				LoadClips();
		//			}, settings.timeBetweenClipListUpdates);
		//		}
	}, function (jqXHR, textStatus, errorThrown)
	{
		var tryAgain = ++failedClipListLoads < 5
		isLoadingAClipList = false;
		showErrorToast("Failed to load " + (listName == "cliplist" ? "clip list" : "alert list") + ".<br/>Will " + (tryAgain ? "" : "NOT ") + "try again.<br/>" + textStatus + "<br/>" + errorThrown, 5000);

		try
		{
			// Blue Iris 4.1.3.0 builds an invalid alertlist.  This detects the error and automatically switches to cliplist.
			if (listName == "alertlist" && textStatus && textStatus.indexOf("parser") != -1)
				listName = "cliplist";
		}
		catch (ex)
		{
		}

		setTimeout(function ()
		{
			LoadClips(listName, cameraId);
		}, 1000);
	});
}
function ThumbOnAppear(ele)
{
	var path = "/thumbs/" + ele.getAttribute("path");
	if (ele.getAttribute('src') != path)
		enqueueAsyncImage(ele, path);
}
function ThumbOnDisappear(ele)
{
	dequeueAsyncImage(ele);
}
function ClipOnAppear(clipData)
{
	var $clip = $("#c" + clipData.clipId);
	if ($clip.length == 0)
	{
		var dateStr;
		if (settings.ui2_clipListDateUseLocale == "1")
			dateStr = clipData.date.toLocaleString();
		else
			dateStr = GetDateStr(clipData.date);
		$("#clipsbody").append('<div id="c' + clipData.clipId + '" class="cliptile" style="top:' + clipData.y + 'px" msec="' + clipData.msec + '"><div class="cliptilehelper inlineblock"></div>'
		 + '<div class="clipimghelper inlineblock"><img id="t' + clipData.clipId + '" src="ui2/LoadingSmall.png" /></div>' // /thumbs/' + clip.path + '
		 + '<div class="clipdesc inlineblock"><span style="background-color: #' + clipData.colorHex + ';color: #' + clipData.nameColorHex + ';">' + clipData.camera + '</span><br/><span class="timestamp">' + dateStr + '</span><br/>' + clipData.roughLength + '</div>'
		// + '<div id="extra' + clipId + '" class="clipextrathumbs inlineblock"></div>'
		 + '</div>');
		var img = document.getElementById("t" + clipData.clipId);

		$clip = $("#c" + clipData.clipId);
		$clip.click(ClipClicked);
		$clip.attr("path", clipData.path);
		$clip.attr("camid", clipData.camera);

		img.setAttribute("path", clipData.thumbPath);
	}
	ThumbOnAppear($("#t" + clipData.clipId).get(0));
}
function ClipOnDisappear(clipData)
{
	ThumbOnDisappear($("#t" + clipData.clipId).get(0));
	//$("#c" + clipData.clipId).remove(); // Removing the clip while a thumbnail loading "thread" might be working on it causes the thread to fail.
}
function ClipClicked()
{
	if (lastClickedClip)
		$(lastClickedClip).removeClass("selected");
	lastClickedClip = this;

	$(this).addClass("selected");

	LoadClipWithPath(this.getAttribute("path"), this.getAttribute("camid"), this.getAttribute("msec"));
}
function goLive()
{
	if (currentlyLoadingImage.isLive)
		return;
	if (lastClickedClip)
	{
		$(lastClickedClip).removeClass("selected");
		lastClickedClip = null;
	}
	currentlyLoadingCamera = GetGroupCamera(currentlySelectedHomeGroupId);
	UpdateSelectedLiveCameraFields();
}
function CleanUpFileSize(fileSize)
{
	var indexSpace = fileSize.indexOf(" ");
	if (indexSpace > 0)
		fileSize = fileSize.substring(0, indexSpace);
	return fileSize;
}
function GetClipLengthMs(str)
{
	var hours = 0;
	var minutes = 0;
	var seconds = 10;

	var match = new RegExp("(\\d+)h").exec(str);
	if (match)
		hours = parseInt(match[1]);

	match = new RegExp("(\\d+)m").exec(str);
	if (match)
		minutes = parseInt(match[1]);

	match = new RegExp("(\\d+)sec").exec(str);
	if (match)
		seconds = parseInt(match[1]);

	return (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
}
///////////////////////////////////////////////////////////////
// Load Camera List ///////////////////////////////////////////
///////////////////////////////////////////////////////////////
var lastCameraListResponse = null;
var currentlyLoadingCamera = null;
var firstCameraListLoaded = false;
var currentlySelectedHomeGroupId = null;
var hasOnlyOneCamera = false;
function LoadCameraList(successCallbackFunc)
{
	ExecJSON({ cmd: "camlist" }, function (response)
	{
		lastCameraListResponse = response;
		if (!firstCameraListLoaded)
		{
			if (typeof (lastCameraListResponse.data) == "undefined" || lastCameraListResponse.data.length == 0)
			{
				SetErrorStatus("#loadingCameraList", "Camera list is empty! Try reloading the page.");
				return;
			}
			var containsGroup = false;
			for (var i = 0; i < lastCameraListResponse.data.length; i++)
			{
				if (lastCameraListResponse.data[i].group)
				{
					containsGroup = true;
					break;
				}
			}
			hasOnlyOneCamera = !containsGroup;
			if (!containsGroup)
			{
				// No group was found, so we will add one.
				var newDataArray = new Array();
				newDataArray.push(GetFakeIndexCameraData());
				for (var i = 0; i < lastCameraListResponse.data.length; i++)
					newDataArray.push(lastCameraListResponse.data[i]);
				lastCameraListResponse.data = newDataArray;
			}
			if (GetGroupCamera(settings.ui2_defaultCameraGroupId) == null)
				SelectCameraGroup(lastCameraListResponse.data[0].optionValue);
			else
				SelectCameraGroup(settings.ui2_defaultCameraGroupId);

			currentlyLoadingCamera = GetGroupCamera(currentlySelectedHomeGroupId);
			cameraListLoaded = true;
			SetLoadedStatus("#loadingCameraList");

			if (!firstCameraListLoaded)
			{
				firstCameraListLoaded = true;
				LoadClips();
			}
		}
		if (successCallbackFunc)
			successCallbackFunc(lastCameraListResponse);
	}, function ()
	{
		setTimeout(function ()
		{
			LoadCameraList(successCallbackFunc);
		}, 1000);
	});
}
function GetFakeIndexCameraData()
{
	var camName;
	var camWidth;
	var camHeight;
	var ptz;

	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		var cameraObj = lastCameraListResponse.data[i];
		if (!cameraObj.group && cameraObj.isEnabled && cameraObj.optionValue.indexOf("@") != 0)
		{
			camName = cameraObj.optionValue;
			camWidth = cameraObj.width;
			camHeight = cameraObj.height;
			ptz = cameraObj.ptz;
			break;
		}
	}

	return {
		optionDisplay: "+All cameras"
		, optionValue: camName
		, isMotion: false
		, isTriggered: false
		, xsize: 1
		, ysize: 1
		, width: camWidth
		, height: camHeight
		, ptz: ptz
		, group: []
		, rects: []
	};
}
///////////////////////////////////////////////////////////////
// PTZ Actions ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var ptzBtnIsDown = false;
var currentPtz = "0";
var currentPtzCamId = "";

window.onbeforeunload = function ()
{
	if (ptzBtnIsDown)
	{
		PTZ_sync_guarantee(currentPtzCamId, currentPtz, 2);
	}
	return;
}
function EnablePTZButtons()
{
	$(".ptzbtn").each(function (idx, ele)
	{
		$(ele).mousedown(function (e)
		{
			currentPtz = ele.getAttribute("ptzcmd");
			currentPtzCamId = currentlyLoadingImage.id;
			//if (settings.ui2_safeptz == "1")
			PTZ_async_noguarantee(currentPtzCamId, currentPtz);
			//else
			//{
			//	PTZ_async_noguarantee(currentPtzCamId, currentPtz, 1);
			//	ptzBtnIsDown = true;
			//}
			e.preventDefault();
		});
		$(ele).mouseleave(function (e)
		{
			if (ptzBtnIsDown)
			{
				ptzBtnIsDown = false;
				PTZ_async_guarantee(currentPtzCamId, currentPtz, 2);
			}
		});
	});
	$(document).mouseup(function (e)
	{
		if (ptzBtnIsDown)
		{
			ptzBtnIsDown = false;
			PTZ_async_guarantee(currentPtzCamId, currentPtz, 2);
		}
	});

	$(".ptzpreset").each(function (idx, ele)
	{
		var elePresetNum = $(ele).attr("presetnum");
		$(ele).html('<span id="presetSpan' + elePresetNum + '">' + elePresetNum + '</span><img id="presetThumb' + elePresetNum + '" src="about:blank" alt="' + elePresetNum + '" title="' + elePresetNum + '" class="presetThumb" style="display:none" />');
		$(ele).click(function ()
		{
			var ptzCmd = 100 + parseInt(ele.getAttribute("presetnum"));
			PTZ_async_noguarantee(currentlyLoadingImage.id, ptzCmd);
		});
		$(ele).longpress(function ()
		{
			var presetNum = parseInt(ele.getAttribute("presetnum"));
			if (confirm("You are about to assign preset " + presetNum))
			{
				PTZ_set_preset(currentlyLoadingImage.id, presetNum);
			}
		});
		$(ele).mouseenter(function (e)
		{
			var elePresetNum = $(ele).attr("presetnum");
			var imgData = localStorage.getItem("ui2_preset_" + currentlyLoadingImage.id + "_" + elePresetNum);
			if (imgData != null && imgData.length > 0)
			{
				var thumb = $("#presetBigThumb");
				if (thumb.length == 0)
				{
					$("body").append('<img id="presetBigThumb" alt="" />');
					thumb = $("#presetBigThumb");
				}
				thumb.attr("src", imgData);

				var thisOffset = $(this).offset();
				thumb.css("left", thisOffset.left + "px");
				thumb.css("top", (thisOffset.top + ($(this).height() * 3)) + "px");
				thumb.show();
			}
		});
		$(ele).mouseleave(function (e)
		{
			var thumb = $("#presetBigThumb");
			thumb.hide();
		});
	});
}
function LoadPtzPresetThumbs()
{
	$(".ptzpreset").each(function (idx, ele)
	{
		var elePresetNum = $(ele).attr("presetnum");
		$(ele).html('<span id="presetSpan' + elePresetNum + '">' + elePresetNum + '</span><img id="presetThumb' + elePresetNum + '" src="about:blank" alt="' + elePresetNum + '" title="' + elePresetNum + '" class="presetThumb" style="display:none" />');
		if (typeof (Storage) !== "undefined")
		{
			var imgData = localStorage.getItem("ui2_preset_" + currentlyLoadingImage.id + "_" + elePresetNum);
			if (imgData != null && imgData.length > 0)
			{
				$("#presetThumb" + elePresetNum).attr("src", imgData);
				$("#presetThumb" + elePresetNum).show();
				$("#presetSpan" + elePresetNum).hide();
			}
		}
	});
}
function PTZ_set_preset(cameraId, presetNumber)
{
	var args = { cmd: "ptz", camera: cameraId, button: (100 + presetNumber), description: "ui2" };
	ExecJSON(args, function (response)
	{
		if (response && typeof response.result != "undefined" && response.result == "success")
		{
			showSuccessToast("Preset " + presetNumber + " set successfully.");
			UpdatePresetImage(cameraId, presetNumber);
		}
	}, function ()
	{
		showErrorToast("Unable to save preset");
	});
}

function PTZ_async_noguarantee(cameraId, ptzCmd, updown)
{
	var args = { cmd: "ptz", camera: cameraId, button: parseInt(ptzCmd) };
	if (updown == "1")
		args.updown = 1;
	else if (updown == "2")
		args.button = 64;
	ExecJSON(args, function (response)
	{
	}, function ()
	{
	});
}
function PTZ_async_guarantee(cameraId, ptzCmd, updown)
{
	var args = { cmd: "ptz", camera: cameraId, button: ptzCmd };
	if (updown == "1")
		args.updown = 1;
	else if (updown == "2")
		args.button = 64;
	ExecJSON(args, function (response)
	{
	}, function ()
	{
		setTimeout(function ()
		{
			PTZ_async_guarantee(cameraId, ptzCmd, updown);
		}, 100);
	});
}
function PTZ_sync_guarantee(cameraId, ptzCmd, updown)
{
	var args = { cmd: "ptz", camera: cameraId, button: ptzCmd };
	if (updown == "1")
		args.updown = 1;
	else if (updown == "2")
		args.button = 64;
	ExecJSON(args, function (response)
	{
	}, function ()
	{
		PTZ_sync_guarantee(cameraId, ptzCmd, updown);
	});
}
function UpdatePresetImage(cameraId, presetNumber)
{
	if (cameraId != currentlyLoadingImage.id)
		return;

	var tries = 0;
	// Get a reference to the image element
	var tmpImg = document.createElement("img");
	var $tmpImg = $(tmpImg);
	$("#preloadcontainer").append(tmpImg);

	var sizeArg = "&w=160";
	if (currentlyLoadingImage.aspectratio < 1)
		sizeArg = "&h=160";
	var tmpImgSrc = "image/" + currentlyLoadingImage.path + '?time=' + new Date().getTime() + sizeArg + "&q=50";
	$tmpImg.load(function ()
	{
		if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0)
		{
			// Failed
			if (tries++ < 2)
				$tmpImg.attr("src", tmpImgSrc);
			else
				$tmpImg.remove();
		}
		else
		{
			var imgCanvas = document.createElement("canvas"),
				imgContext = imgCanvas.getContext("2d");

			// Make sure canvas is as big as the picture
			imgCanvas.width = tmpImg.width;
			imgCanvas.height = tmpImg.height;

			// Draw image into canvas element
			imgContext.drawImage(tmpImg, 0, 0, tmpImg.width, tmpImg.height);

			// Get canvas contents as a data URL
			var imgAsDataURL = imgCanvas.toDataURL("image/jpeg");

			// Save image into localStorage
			try
			{
				localStorage.setItem("ui2_preset_" + cameraId + "_" + presetNumber, imgAsDataURL);
			}
			catch (e)
			{
				// either localStorage does not exist or it is full
			}

			$tmpImg.remove();

			if (cameraId == currentlyLoadingImage.id)
			{
				$("#presetThumb" + presetNumber).attr("src", imgAsDataURL);
				$("#presetThumb" + presetNumber).show();
				$("#presetSpan" + presetNumber).hide();
			}
		}
	});
	$tmpImg.error(function ()
	{
		if (tries++ < 2)
			$tmpImg.attr("src", tmpImgSrc);
		else
			$tmpImg.remove();
	});
	$tmpImg.attr("src", tmpImgSrc);
}
///////////////////////////////////////////////////////////////
// Get / Set Camera Config ////////////////////////////////////
///////////////////////////////////////////////////////////////
function GetCameraConfig(camId, successCallbackFunc)
{
	ExecJSON({ cmd: "camconfig", camera: camId }, function (response)
	{
		if (typeof response.result != "undefined" && response.result == "fail")
		{
			openLoginDialog();
			return;
		}
		else
		{
			if (successCallbackFunc)
				successCallbackFunc(response);
		}
	}, function ()
	{
		setTimeout(function ()
		{
		}, 1000);
	});
}
///////////////////////////////////////////////////////////////
// Get / Set Camera Config ////////////////////////////////////
///////////////////////////////////////////////////////////////
function ResetCamera(camId)
{
	var camName = camId;
	var camList = lastCameraListResponse;
	for (var i = 0; i < camList.data.length; i++)
	{
		if (camList.data[i].optionValue == camId)
		{
			camName = camList.data[i].optionDisplay;
			break;
		}
	}
	ExecJSON({ cmd: "camconfig", camera: camId, reset: true }, function (response)
	{
		if (typeof response.result != "undefined" && response.result == "fail")
		{
			openLoginDialog();
			return;
		}
		else
		{
			if (settings.ui2_useMjpeg == "1")
			{
				showSuccessToast("Camera " + camName + " is restarting");
				KickstartMjpegStream();
				//showWarningToast('Camera "' + camName + '" is restarting.<br/><br/><span style="color:red;font-weight:bold">IMPORTANT</span><br/><br/>When you restart a camera while the "Frame Rate Boost" option is enabled, your live video may freeze and UI2 is unable to detect when this happens. You can fix it by toggling any camera into fullscreen mode and back.', 30000);
			}
			else
				showSuccessToast("Camera " + camName + " is restarting");
		}
	}, function ()
	{
		showErrorToast("Camera " + camName + " could not be reset");
	});
}
///////////////////////////////////////////////////////////////
// Manual Recording Start / Stop //////////////////////////////
///////////////////////////////////////////////////////////////
function ManualRecordCamera(camId, start)
{
	if (start == "1")
		start = true;
	else if (start == "0")
		start = false;
	else
	{
		var camList = lastCameraListResponse;
		for (var i = 0; i < camList.data.length; i++)
		{
			if (camList.data[i].optionValue == camId)
			{
				start = !camList.data[i].isRecording;
				break;
			}
		}
	}
	LoadCameraList(function (camList)
	{
		ExecJSON({ cmd: "camconfig", camera: camId, manrec: start }, function (response)
		{
			if (typeof response.result != "undefined" && response.result == "fail")
			{
				openLoginDialog();
				return;
			}
			else
			{
				setTimeout(function ()
				{
					LoadCameraList(function (camList)
					{
						for (var i = 0; i < camList.data.length; i++)
						{
							if (camList.data[i].optionValue == camId)
							{
								showInfoToast(camList.data[i].optionDisplay + " " + (camList.data[i].isRecording ? '<span style="font-weight: bold;color:Red; background-color: #000000;">IS RECORDING</span>' : '<span style="font-weight: bold;color:Green; background-color: #000000;">IS NOT RECORDING</span>'));
								break;
							}
						}
					});
				}, 250);
			}
		}, function ()
		{
			showErrorToast("Failed to toggle manual recording for " + camId);
		});
	});
}
function LoadDynamicManualRecordingButtonState(camId)
{
	$("#manRecBtnLabel").text("Toggle Recording");
	$("#manRecBtnLabel").removeAttr("start");
	LoadCameraList(function (camList)
	{
		for (var i = 0; i < camList.data.length; i++)
		{
			if (camList.data[i].optionValue == camId)
			{
				if (camList.data[i].isRecording)
				{
					$("#manRecBtnLabel").text("Stop Recording");
					$("#manRecBtnLabel").attr("start", "0");
					return true;
				}
				else
				{
					$("#manRecBtnLabel").text("Start Recording");
					$("#manRecBtnLabel").attr("start", "1");
					return false;
				}
				break;
			}
		}
	});
}
///////////////////////////////////////////////////////////////
// Trigger Camera  ////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function TriggerCamera(camId)
{
	ExecJSON({ cmd: "trigger", camera: camId }, function (response)
	{
		if (typeof response.result != "undefined" && response.result == "fail")
		{
			openLoginDialog();
			return;
		}
	}, function ()
	{
		setTimeout(function ()
		{
		}, 1000);
	});
}
///////////////////////////////////////////////////////////////
// Get System Configuration ///////////////////////////////////
///////////////////////////////////////////////////////////////
function GetSysConfig()
{
	ExecJSON({ cmd: "sysconfig" }, function (response)
	{
		if (typeof response.result != "undefined" && response.result == "fail")
		{
			openLoginDialog();
			return;
		}
	}, function ()
	{
		setTimeout(function ()
		{
		}, 1000);
	});
}
///////////////////////////////////////////////////////////////
// Admin Login ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var isAdministratorSession = false;
var lastLoginResponse = null;
var latestSession = null;
function ApplyLatestSessionIfNecessary()
{
	if (latestSession == null)
		return;
	if ($.cookie("session") != latestSession)
	{
		$.cookie("session", latestSession);
		KickstartMjpegStream();
	}
}
function AdminLoginRememberMeChanged()
{
	if ($("#cbRememberMe").is(":checked"))
	{
		settings.ui2_adminrememberme = "1";
		settings.ui2_adminusername = SimpleTextGibberize($("#txtUserName").val());
		settings.ui2_adminpassword = SimpleTextGibberize($("#txtPassword").val());
	}
	else
	{
		settings.ui2_adminrememberme = "0";
		settings.ui2_adminusername = "";
		settings.ui2_adminpassword = "";
	}
}
function DoAdministratorLogin()
{
	AdminLoginRememberMeChanged();
	SessionLogin($("#txtUserName").val(), $("#txtPassword").val());
}
function SessionLogin(user, pass)
{
	var oldSession = $.cookie("session");
	ExecJSON({ cmd: "login" }, function (response)
	{
		var newSession = typeof response.session == "undefined" ? oldSession : response.session;

		var myResponse = md5(user + ":" + newSession + ":" + pass);
		var isLoggingInWithCredentials = user != "" || pass != "";
		if (!isLoggingInWithCredentials)
			myResponse = null;

		ExecJSON({ cmd: "login", response: myResponse, session: newSession }, function (response)
		{
			lastLoginResponse = response;
			isAdministratorSession = false;
			loginLoaded = true;
			SetLoadedStatus("#loadingLogin");
			if (typeof response.result != "undefined" && response.result == "fail")
			{
				if (isLoggingInWithCredentials)
					showErrorToast('Failed to log in.');
				LoadCameraList();
				return;
			}
			else
			{
				latestSession = response.session;
				ApplyLatestSessionIfNecessary();
				if (response.data.admin)
				{
					isAdministratorSession = true;
					showSuccessToast("Logged in as Administrator<br/><br/>Server \"" + response.data["system name"] + "\"<br/>Blue Iris version " + response.data.version);
					closeLoginDialog();
				}
				else
				{
					if (isLoggingInWithCredentials)
						showWarningToast("Account is not administrator<br/><br/>Server \"" + response.data["system name"] + "\"<br/>Blue Iris version " + response.data.version);
				}
				try
				{
					if (typeof response.data.profiles == "object" && response.data.profiles.length == 8)
						currentProfileNames = response.data.profiles;
				}
				catch (exception)
				{
					showWarningToast("Unable to read profile name data from login response");
				}
				LoadCameraList();
			}
		}, function ()
		{
			showErrorToast('Unable to contact Blue Iris server.');
			loginLoaded = true;
			SetLoadedStatus("#loadingLogin");
			LoadCameraList();
		});
	}, function ()
	{
		showErrorToast('Unable to contact Blue Iris server.');
		loginLoaded = true;
		SetLoadedStatus("#loadingLogin");
		LoadCameraList();
	});
}
///////////////////////////////////////////////////////////////
// Image Refreshing ///////////////////////////////////////////
///////////////////////////////////////////////////////////////
var timeLastClipFrame = 0;
var clipPlaybackPosition = 0;
var playbackPaused = false;
var playbackReversed = false;
var lastSnapshotUrl = "";
var currentImageDateMs = new Date();

var currentlyLoadingImage = new Object();
currentlyLoadingImage.id = "";
currentlyLoadingImage.fullwidth = 1280;
currentlyLoadingImage.fullheight = 720;
currentlyLoadingImage.aspectratio = 1280 / 720;
currentlyLoadingImage.path = "";
currentlyLoadingImage.isLive = true;
currentlyLoadingImage.ptz = false;
currentlyLoadingImage.msec = 10000;

var currentlyLoadedImage = new Object();
currentlyLoadedImage.id = "";
currentlyLoadedImage.fullwidth = 1280;
currentlyLoadedImage.fullheight = 720;
currentlyLoadedImage.aspectratio = 1280 / 720;
currentlyLoadedImage.ptz = false;

var isFirstCameraImageLoaded = false;

var lastCycleWidth = 0;
var lastCycleHeight = 0;

//var lastWidth = 0;
//var lastHeight = 0;

var isCamimgElementBusy = false;
//var lastImageWasJpegDiff = false;
function StartRefresh()
{
	UpdateSelectedLiveCameraFields();

	var camObj = $("#camimg");
	camObj.load(function ()
	{
		isCamimgElementBusy = false;
		ClearImageLoadTimeout();
		if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0)
		{
			// Failed
		}
		else if (currentlyLoadingImage.id != currentlyLoadedImage.id)
		{
			if (!isFirstCameraImageLoaded)
			{
				isFirstCameraImageLoaded = true;
				RegisterCamImgClickHandler();
			}
			if ($("#camimg").attr('loadingimg') == currentlyLoadingImage.id)
			{
				digitalZoom = 0;
				currentlyLoadedImage.id = currentlyLoadingImage.id;
				currentlyLoadedImage.fullwidth = currentlyLoadingImage.fullwidth;
				currentlyLoadedImage.fullheight = currentlyLoadingImage.fullheight;
				currentlyLoadedImage.aspectratio = currentlyLoadingImage.aspectratio;
				currentlyLoadedImage.ptz = currentlyLoadingImage.ptz;

				resized();
			}
		}

		$("#fpsCounter").html("FPS<br/>" + fps.getFPS());

		if (currentlyLoadedImage.id.startsWith("@"))
		{
			if (lastCycleWidth != this.naturalWidth || lastCycleHeight != this.naturalHeight)
			{
				currentlyLoadedImage.fullwidth = lastCycleWidth = this.naturalWidth;
				currentlyLoadedImage.fullheight = lastCycleHeight = this.naturalHeight;
				currentlyLoadedImage.aspectratio = lastCycleWidth / lastCycleHeight;
				resized();
			}
		}
		else
		{
			lastCycleWidth = lastCycleHeight = 0;
		}

		//var sizeChanged = false;
		//if (lastWidth != this.naturalWidth || lastHeight != this.naturalHeight)
		//{
		//	lastWidth = this.naturalWidth;
		//	lastHeight = this.naturalHeight;
		//	sizeChanged = true;
		//}

		if ($("#camimg").attr("useMjpeg") == "1")
		{
			// This is mjpeg- so the image will keep refreshing without intervention.
		}
		else
		{
			//if (sizeChanged && $("#camimg").attr("jpegDiff") == "1")
			//	diffJpegFrameNumber = 0; // The server will have restarted our stream.
			DrawToCanvas();
			var timeToWait = parseInt(settings.ui2_timeBetweenJpegImageUpdates);
			if (timeToWait > 0)
				setTimeout("GetNewImage();", timeToWait);
			else
				GetNewImage();
		}
	});
	camObj.error(function ()
	{
		ClearImageLoadTimeout();
		//RestartJpegDiffStream();
		setTimeout("GetNewImage();", 1000);
	});
	GetNewImage();
}
function GetNewImage()
{
	ApplyLatestSessionIfNecessary();
	var seekingEnabled = settings.ui2_clipPlaybackSeekBarEnabled == "1";
	var timeValue = currentImageDateMs = new Date().getTime();
	if (!currentlyLoadingImage.isLive)
	{
		var timePassed = timeValue - timeLastClipFrame;
		timeLastClipFrame = timeValue;
		var speedMultiplier = GetClipPlaybackSpeedMultiplier();
		timePassed *= speedMultiplier;
		clipPlaybackPosition += timePassed;
		if (seekingEnabled)
		{
			var loopingEnabled = settings.ui2_clipPlaybackLoopEnabled == "1";
			var autoplayEnabled = settings.ui2_clipPlaybackAutoplayEnabled == "1";
			if (clipPlaybackPosition < 0)
			{
				clipPlaybackPosition = 0;
				if (playbackReversed)
				{
					if (loopingEnabled)
						clipPlaybackPosition = currentlyLoadingImage.msec - 1;
					else if (autoplayEnabled)
					{
						Playback_Pause();
						if (settings.ui2_autoplayReverse == "1")
							Playback_NextClip();
						else
							Playback_PreviousClip();
					}
					else
						Playback_Pause();
				}
			}
			else if (clipPlaybackPosition >= currentlyLoadingImage.msec)
			{
				clipPlaybackPosition = currentlyLoadingImage.msec - 1;
				if (!playbackReversed)
				{
					if (loopingEnabled)
						clipPlaybackPosition = 0;
					else if (autoplayEnabled)
					{
						Playback_Pause();
						if (settings.ui2_autoplayReverse == "1")
							Playback_PreviousClip();
						else
							Playback_NextClip();
					}
					else
						Playback_Pause();
				}
			}
		}
		timeValue = clipPlaybackPosition;
		// Update currentImageDateMs
		var clipData = clipListCache[currentlyLoadingImage.id][currentlyLoadingImage.path];
		currentImageDateMs = clipData.date.getTime() + clipPlaybackPosition;
	}

	// Calculate the size of the image we need
	var imgDrawWidth = currentlyLoadingImage.fullwidth * settings.ui2_dpiScalingFactor * (zoomTable[digitalZoom]);
	var imgDrawHeight = currentlyLoadingImage.fullheight * settings.ui2_dpiScalingFactor * (zoomTable[digitalZoom]);
	if (imgDrawWidth == 0)
	{
		// Image is supposed to scale to fit the screen
		imgDrawWidth = $("#layoutbody").width() * settings.ui2_dpiScalingFactor;
		imgDrawHeight = $("#layoutbody").height() * settings.ui2_dpiScalingFactor;

		var availableRatio = imgDrawWidth / imgDrawHeight;
		if (availableRatio < currentlyLoadingImage.aspectratio)
			imgDrawHeight = imgDrawWidth / currentlyLoadingImage.aspectratio;
		else
			imgDrawWidth = imgDrawHeight * currentlyLoadingImage.aspectratio;
	}
	var maxWidth = parseInt(settings.ui2_maxImageWidth);
	var maxHeight = parseInt(settings.ui2_maxImageHeight);
	if (imgDrawWidth > maxWidth || imgDrawHeight > maxHeight)
	{
		// Image is supposed to scale to fit user-imposed dimensions.
		imgDrawWidth = maxWidth;
		imgDrawHeight = maxHeight;

		var availableRatio = imgDrawWidth / imgDrawHeight;
		if (availableRatio < currentlyLoadingImage.aspectratio)
			imgDrawHeight = imgDrawWidth / currentlyLoadingImage.aspectratio;
		else
			imgDrawWidth = imgDrawHeight * currentlyLoadingImage.aspectratio;
	}
	// Now we have the size we need.  Determine what argument we will send to Blue Iris
	var widthToRequest = parseInt(Math.round(imgDrawHeight * currentlyLoadingImage.aspectratio));
	$("#camimg").attr('loadingimg', currentlyLoadingImage.id);

	var qualityArg = "";
	if (settings.ui2_currentImageQuality == 0)
	{
		qualityArg = "&q=" + settings.ui2_lowQualityJpegQualityValue;
		widthToRequest = parseInt(widthToRequest * settings.ui2_lowQualityJpegSizeMultiplier);
	}

	var imgSrcPath;
	if (settings.ui2_useMjpeg == "1")
	{
		$("#camimg").attr("useMjpeg", "1");
		if (currentlyLoadingImage.isLive)
			imgSrcPath = "mjpg/" + currentlyLoadingImage.path + '/video.mjpg?time=' + timeValue;
		else
			imgSrcPath = "file/clips/" + currentlyLoadingImage.path + '?&mode=mjpeg&speed=100';
	}
	else
	{
		$("#camimg").attr("useMjpeg", "0");
		if (currentlyLoadingImage.isLive)
			lastSnapshotUrl = "image/" + currentlyLoadingImage.path + '?time=' + timeValue;
		else
			lastSnapshotUrl = "file/clips/" + currentlyLoadingImage.path + '?time=' + timeValue;
		imgSrcPath = lastSnapshotUrl + "&w=" + widthToRequest + qualityArg;
	}
	if ($("#camimg").attr('src') == imgSrcPath)
		setTimeout(GetNewImage, 25);
	else
	{
		SetImageLoadTimeout();
		if (seekingEnabled && !currentlyLoadingImage.isLive)
			SetSeekbarPositionByPlaybackTime(timeValue);

		//if (serverJpegDiffStreamVersions.indexOf(clientJpegDiffStreamVersion) != -1 && settings.ui2_enableCanvasDrawing == "1" && settings.ui2_jpegDiffEnabled == "1")
		//{
		//	// jpegDiff algorithm active
		//	$("#camimg").attr("jpegDiff", "1");
		//	$("#camimg").attr("jpegDiffVersion", clientJpegDiffStreamVersion);
		//	imgSrcPath += "&streamid=" + myUID + "&jdq=" + parseInt(settings.ui2_jpegDiffCompressionQuality) + "&jdv=" + clientJpegDiffStreamVersion;
		//	if (!lastImageWasJpegDiff)
		//		RestartJpegDiffStream();
		//	else
		//		RestartJpegDiffStreamIfTimeForNewKeyframe();
		//	if (startOverJpegDiff)
		//	{
		//		startOverJpegDiff = false;
		//		imgSrcPath += "&startNewStream=1";
		//	}
		//	lastImageWasJpegDiff = true;
		//}
		//else
		//{
		//	lastImageWasJpegDiff = false;
		//	$("#camimg").attr("jpegDiff", "0");
		//}

		$("#camimg").attr('src', imgSrcPath);

		isCamimgElementBusy = true;
	}
}
var imgLoadTimeout = null;
function SetImageLoadTimeout()
{
	ClearImageLoadTimeout();
	imgLoadTimeout = setTimeout(function ()
	{
		try
		{
			console.log("Image load timed out");
		} catch (ex)
		{
		}
		//RestartJpegDiffStream();
		GetNewImage();
	}, 15000);
}
function ClearImageLoadTimeout()
{
	if (imgLoadTimeout != null)
		clearTimeout(imgLoadTimeout);
}
var kickstartMjpegTimeout1 = null;
var kickstartMjpegTimeout2 = null;
function KickstartMjpegStream()
{
	if (kickstartMjpegTimeout1 != null)
		clearTimeout(kickstartMjpegTimeout1);
	kickstartMjpegTimeout1 = setTimeout(function () { if (settings.ui2_useMjpeg == "1") GetNewImage(); }, 5000);
	if (kickstartMjpegTimeout2 != null)
		clearTimeout(kickstartMjpegTimeout2);
	kickstartMjpegTimeout2 = setTimeout(function () { if (settings.ui2_useMjpeg == "1") GetNewImage(); }, 10000);
}
function GetClipPlaybackSpeedMultiplier()
{
	return internalGetClipPlaybackSpeedMultiplier() * (playbackReversed ? -1 : 1);
}
function internalGetClipPlaybackSpeedMultiplier()
{
	if (playbackPaused)
		return 0;
	switch (settings.ui2_clipPlaybackSpeed)
	{
		case "256":
			return 256;
		case "128":
			return 128;
		case "64":
			return 64;
		case "32":
			return 32;
		case "16":
			return 16;
		case "8":
			return 8;
		case "4":
			return 4;
		case "2":
			return 2;
		case "1":
			return 1;
		case "1/2":
			return 0.5;
		case "1/4":
			return 0.25;
		case "1/8":
			return 0.125;
		default:
			return 1;
	}
}
function GetClipPlaybackSpeedLabel()
{
	switch (settings.ui2_clipPlaybackSpeed)
	{
		case "256":
			return "256x";
		case "128":
			return "128x";
		case "64":
			return "64x";
		case "32":
			return "32x";
		case "16":
			return "16x";
		case "8":
			return "8x";
		case "4":
			return "4x";
		case "2":
			return "2x";
		case "1":
			return "1x";
		case "1/2":
			return "1/2x";
		case "1/4":
			return "1/4x";
		case "1/8":
			return "1/8x";
		default:
			return "?";
	}
}
function GetSlowerClipPlaybackSpeed()
{
	switch (settings.ui2_clipPlaybackSpeed)
	{
		case "256":
			return "128";
		case "128":
			return "64";
		case "64":
			return "32";
		case "32":
			return "16";
		case "16":
			return "8";
		case "8":
			return "4";
		case "4":
			return "2";
		case "2":
			return "1";
		case "1":
			return "1/2";
		case "1/2":
			return "1/4";
		case "1/4":
			return "1/8";
		case "1/8":
			return "1/8";
		default:
			return "1";
	}
}
function GetFasterClipPlaybackSpeed()
{
	switch (settings.ui2_clipPlaybackSpeed)
	{
		case "256":
			return "256";
		case "128":
			return "256";
		case "64":
			return "128";
		case "32":
			return "64";
		case "16":
			return "32";
		case "8":
			return "16";
		case "4":
			return "8";
		case "2":
			return "4";
		case "1":
			return "2";
		case "1/2":
			return "1";
		case "1/4":
			return "1/2";
		case "1/8":
			return "1/4";
		default:
			return "1";
	}
}
function UpdateClipPlaybackSpeedLabel()
{
	$("#playback_speed").text(GetClipPlaybackSpeedLabel());
}
function Playback_Pause()
{
	if (!playbackPaused)
		Playback_PlayPause();
}
function Playback_Play()
{
	if (playbackPaused)
		Playback_PlayPause();
}
function Playback_PlayPause()
{
	if (playbackPaused)
	{
		playbackPaused = false;
		$("#playback_playpause").attr("src", "ui2/pause48.png");
		if (clipPlaybackPosition >= currentlyLoadingImage.msec - 1 && !playbackReversed)
			clipPlaybackPosition = 0;
		else if (clipPlaybackPosition <= 0 && playbackReversed)
			clipPlaybackPosition = currentlyLoadingImage.msec - 1;
	}
	else
	{
		playbackPaused = true;
		$("#playback_playpause").attr("src", "ui2/play48.png");
	}
	UpdateClipPlaybackSpeedLabel();
}
function Playback_SlowDown()
{
	settings.ui2_clipPlaybackSpeed = GetSlowerClipPlaybackSpeed();
	UpdateClipPlaybackSpeedLabel();
}
function Playback_SpeedUp()
{
	settings.ui2_clipPlaybackSpeed = GetFasterClipPlaybackSpeed();
	UpdateClipPlaybackSpeedLabel();
}
function Playback_Skip(amountMs)
{
	clipPlaybackPosition += amountMs;
}
function Playback_NextClip()
{
	var clipObj = $(".cliptile.selected").prev();
	Playback_ClipObj(clipObj);
}
function Playback_PreviousClip()
{
	var clipObj = $(".cliptile.selected").next();
	Playback_ClipObj(clipObj);
}
function Playback_ClipObj(clipObj)
{
	if (clipObj.length > 0)
	{
		var offset = ($("#clipsbody").height() / 2) - (clipObj.height() / 2);
		$("#clipsbody").scrollTop(($("#clipsbody").scrollTop() + clipObj.position().top) - offset);
		clipObj.click();
	}
}
function Playback_Reverse()
{
	if (playbackReversed)
	{
		playbackReversed = false;
		$("#playback_reverse").attr("src", "ui2/fastforward48.png");
		if (playbackPaused && clipPlaybackPosition <= 0)
			Playback_PlayPause();
	}
	else
	{
		playbackReversed = true;
		$("#playback_reverse").attr("src", "ui2/rewind48.png");
		if (playbackPaused && clipPlaybackPosition >= currentlyLoadingImage.msec - 1)
			Playback_PlayPause();
	}
}
function Playback_Loop_Toggle()
{
	if (settings.ui2_clipPlaybackLoopEnabled == "1")
	{
		settings.ui2_clipPlaybackLoopEnabled = "0";
		$("#playback_loop").addClass("disabled");
	}
	else
	{
		settings.ui2_clipPlaybackLoopEnabled = "1";
		$("#playback_loop").removeClass("disabled");

		settings.ui2_clipPlaybackAutoplayEnabled = "0";
		$("#playback_autoplay").addClass("disabled");
	}
}
function Playback_AutoPlay_Toggle()
{
	if (settings.ui2_clipPlaybackAutoplayEnabled == "1")
	{
		settings.ui2_clipPlaybackAutoplayEnabled = "0";
		$("#playback_autoplay").addClass("disabled");
	}
	else
	{
		settings.ui2_clipPlaybackAutoplayEnabled = "1";
		$("#playback_autoplay").removeClass("disabled");

		settings.ui2_clipPlaybackLoopEnabled = "0";
		$("#playback_loop").addClass("disabled");
	}
}
function InitPlaybackLogic()
{
	UpdateClipPlaybackSpeedLabel();

	if (settings.ui2_clipPlaybackLoopEnabled != "1")
		$("#playback_loop").addClass("disabled");

	if (settings.ui2_clipPlaybackAutoplayEnabled != "1")
		$("#playback_autoplay").addClass("disabled");
}
function InitQualityButtonLogic()
{
	if (settings.ui2_currentImageQuality != 1 && settings.ui2_currentImageQuality != 0)
		settings.ui2_currentImageQuality = 1;
	SetQualityButtonGraphic();
	$("#quality").click(function ()
	{
		if (settings.ui2_currentImageQuality == 1)
			settings.ui2_currentImageQuality = 0;
		else
			settings.ui2_currentImageQuality = 1;
		SetQualityButtonGraphic();
	});
}
function SetQualityButtonGraphic()
{
	if (settings.ui2_currentImageQuality == 1)
	{
		$("#quality_low").hide();
		$("#quality_high").show();
	}
	else
	{
		$("#quality_low").show();
		$("#quality_high").hide();
	}
}
///////////////////////////////////////////////////////////////
// Audio Playback /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function audioToggle()
{
	if (currentlyLoadingImage.audio)
	{
		var audiosourceobj = document.getElementById("audiosourceobj");
		if ($("#audiosourceobj").attr("src") == "")
			audioPlay();
		else
			audioStop();
	}
}
function audioPlay()
{
	$("#audio_icon").attr("src", "ui2/high96.png");
	$("#audiosourceobj").attr("src", "audio/" + currentlyLoadingImage.id + "/temp.wav");
	var audioobj = document.getElementById("audioobj");
	audioobj.load();
	audioobj.play();
}
function audioStop()
{
	$("#audio_icon").attr("src", "ui2/mute96.png");
	if ($("#audiosourceobj").attr("src") != "")
	{
		$("#audiosourceobj").attr("src", "");
		document.getElementById("audioobj").load();
	}
}
///////////////////////////////////////////////////////////////
// Save Snapshot Button ///////////////////////////////////////
///////////////////////////////////////////////////////////////
function saveSnapshot()
{
	if (settings.ui2_useMjpeg == "1")
	{
		$("#save_snapshot_btn").attr("download", "temp.jpg");
		$("#save_snapshot_btn").attr("href", "javascript:void(0)");
		showErrorToast("You can not save snapshots while using the experimental Frame Rate Boost option.");
	}
	else
	{
		var camId = currentlyLoadingImage.id;
		if (camId.startsWith("@") || camId.startsWith("+"))
			camId = camId.substr(1);
		var date = GetDateStr(new Date(currentImageDateMs), true);
		date = date.replace(/\//g, '-').replace(/:/g, '.');
		var fileName = camId + " " + date + ".jpg";
		$("#save_snapshot_btn").attr("download", fileName);
		$("#save_snapshot_btn").attr("href", lastSnapshotUrl);
		setTimeout(function ()
		{
			$("#save_snapshot_btn").attr("download", "temp.jpg");
			$("#save_snapshot_btn").attr("href", "javascript:void(0)");
		}, 0);
	}
}
///////////////////////////////////////////////////////////////
// Dropdown Lists /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var timeoutHideDropdownListSelector = null;
var dropdownWasJustShown = false;
var dropdownShownTimeout = null;
function InitDropdownListLogic()
{
	$(document).mouseup(function (e)
	{
		if (timeoutHideDropdownListSelector != null)
			clearTimeout(timeoutHideDropdownListSelector);
		if (!dropdownWasJustShown)
			timeoutHideDropdownListSelector = setTimeout('$(".dropdown_list").hide();', 1);
	});
	$(document).mouseleave(function (e)
	{
		if (timeoutHideDropdownListSelector != null)
			clearTimeout(timeoutHideDropdownListSelector);
		if (!dropdownWasJustShown)
			timeoutHideDropdownListSelector = setTimeout('$(".dropdown_list").hide();', 1);
	});
}
function LoadDropdownList(anchorId, listId)
{
	if (timeoutHideDropdownListSelector != null)
		clearTimeout(timeoutHideDropdownListSelector);

	var box = $("#" + listId);
	if (box.is(":visible"))
	{
		box.hide();
		return;
	}

	$(".dropdown_list").hide();

	var btn = $("#" + anchorId);
	var btnOffset = btn.offset();
	var boxTop = btnOffset.top + btn.outerHeight();
	var boxLeft = btnOffset.left;
	if (box.width() + boxLeft > $(window).width())
		boxLeft = $(window).width() - box.width();

	box.css("top", boxTop + "px");
	box.css("left", boxLeft + "px");
	box.show();

	resized();

	dropdownWasJustShown = true;
	if (dropdownShownTimeout != null)
		clearTimeout(dropdownShownTimeout);
	dropdownShownTimeout = setTimeout('dropdownWasJustShown = false;', 50);
}
///////////////////////////////////////////////////////////////
// Home Camera Group //////////////////////////////////////////
///////////////////////////////////////////////////////////////
function PopulateHomegroupSelector()
{
	var box = $("#homegroupselector");
	box.empty();
	if (typeof (lastCameraListResponse.data) == "undefined" || lastCameraListResponse.data.length == 0)
		return;
	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		var displayName = lastCameraListResponse.data[i].optionDisplay;
		if (CameraIsGroupOrCycle(lastCameraListResponse.data[i]))
		{
			var thisGroupId = JavaScriptStringEncode(lastCameraListResponse.data[i].optionValue);
			var thisGroupName = CleanUpGroupName(lastCameraListResponse.data[i].optionDisplay);
			var thisGroupSelected = currentlySelectedHomeGroupId == lastCameraListResponse.data[i].optionValue;

			box.append('<div' + (thisGroupSelected ? ' class="selected"' : '')
			 + ' onclick="SelectCameraGroup(\'' + thisGroupId + '\')">' + thisGroupName + '</div>');
		}
	}
}
function SelectCameraGroup(groupId)
{
	$("#homegroupselector").hide();

	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		if (lastCameraListResponse.data[i].optionValue == groupId)
		{
			if (CameraIsGroupOrCycle(lastCameraListResponse.data[i]))
			{
				settings.ui2_defaultCameraGroupId = currentlySelectedHomeGroupId = groupId;
				currentlyLoadingCamera = lastCameraListResponse.data[i];

				UpdateSelectedLiveCameraFields();
				break;
			}
		}
	}
}
///////////////////////////////////////////////////////////////
// Alerts/Clips Filter ////////////////////////////////////////
///////////////////////////////////////////////////////////////
function PopulateClipsCameraSelector()
{
	var box = $("#clipscameraselector");
	box.empty();
	if (typeof (lastCameraListResponse.data) == "undefined" || lastCameraListResponse.data.length == 0)
		return;
	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		var displayName = lastCameraListResponse.data[i].optionDisplay;
		if (CameraIsGroupOrCamera(lastCameraListResponse.data[i])
			&& (lastCameraListResponse.data[i].group || lastCameraListResponse.data[i].isEnabled))
		{
			var thisCameraId = JavaScriptStringEncode(lastCameraListResponse.data[i].optionValue);
			var thisGroupName = CleanUpGroupName(lastCameraListResponse.data[i].optionDisplay);
			var thisGroupSelected = currentlySelectedClipGroupId == lastCameraListResponse.data[i].optionValue;

			box.append('<div' + (thisGroupSelected ? ' class="selected"' : '')
			 + ' onclick="SelectClipsCamera(\'' + thisCameraId + '\', true)">' + thisGroupName + '</div>');
		}
	}
}
function SelectClipsCamera(cameraId, alsoLoadClips)
{
	$("#clipscameraselector").hide();

	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		if (lastCameraListResponse.data[i].optionValue == cameraId)
		{
			currentlySelectedClipGroupId = cameraId;
			$("#clipsCameraName").text(CleanUpGroupName(lastCameraListResponse.data[i].optionDisplay));
			if (alsoLoadClips)
				LoadClips(settings.ui2_preferredClipList, lastCameraListResponse.data[i].optionValue);
			break;
		}
	}
}
function ToggleAutoLoadClipList()
{
	settings.ui2_autoLoadClipList = settings.ui2_autoLoadClipList == "1" ? "0" : "1";
	if (settings.ui2_autoLoadClipList == "1")
	{
		$("#btn_autoLoadClipList").addClass("selected");
		LoadClips(settings.ui2_preferredClipList, currentlyLoadingCamera.optionValue);
	}
	else
		$("#btn_autoLoadClipList").removeClass("selected");
}
///////////////////////////////////////////////////////////////
// Schedule Selection /////////////////////////////////////////
///////////////////////////////////////////////////////////////
function PopulateScheduleSelector()
{
	var box = $("#scheduleselector");
	box.empty();
	if (settings.ui2_enableScheduleButton == "1")
	{
		if (globalScheduleEnabled)
		{
			if (lastLoginResponse == null || typeof (lastLoginResponse.data) == "undefined" || typeof (lastLoginResponse.data.schedules) == "undefined" || lastLoginResponse.data.schedules.length == 0)
			{
				openLoginDialog();
				return;
			}
			for (var i = 0; i < lastLoginResponse.data.schedules.length; i++)
			{
				var scheduleName = lastLoginResponse.data.schedules[i];
				box.append('<div' + (scheduleName == currentlySelectedSchedule ? ' class="selected"' : '')
					+ ' onclick="SelectSchedule(\'' + scheduleName + '\')">' + scheduleName + '</div>');
			}
		}
		else
		{
			box.append('<div style="max-width:180px">The global schedule must first be enabled in Blue Iris.</div>');
		}
	}
	else
	{
		box.append('<div style="max-width:180px">Your options do not allow changing the global schedule.</div>');
	}
}
function SelectSchedule(scheduleName)
{
	$("#scheduleselector").hide();
	$("#selectedSchedule").text("...");
	LoadStatus(null, null, scheduleName);
}