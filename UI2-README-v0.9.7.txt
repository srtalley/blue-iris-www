v0.9.7 - 2016-01-14
+ Added a hotkey for the "Save Snapshot" button, CTRL + S by default.
+ Added a Misc option to use locale-specific date and time formatting in the clip list (so it will work like UI2 0.9.5 and older).
* Improved UI2 loading time by removing the clip list line item from the startup chain.

v0.9.6 - 2016-01-08
+ Added a "Save Snapshot" button, which you can click to download a copy of the currently loading video frame in full resolution and quality.
+ Added a frame rate counter, which you can enable in Options > Top Bar.
+ Replaced the 3rd party dialog box code with my own code, which is much simpler and works better.
+ Added the ability to draw video to an html5 <canvas> element as an alternative to the <img> element. The canvas has little practical purpose at this time, but enables the image data to be manipulated by script.
+ Added a simple video filtering system which allows the user to choose between a set of predefined video filters, or write their own with JavaScript. Requires canvas drawing to be enabled.
* Changed the date and time formatting used in the clip list so it is now independent of the browser locale. The format is now YYYY/MM/DD hh:mm:ss [AM|PM].

v0.9.5 - 2015-09-29
* Improved initial loading speed of the clip list.  Clip tiles now load dynamically when you scroll to them, instead of all 1000 clips loading at the start.
+ Added a hotkey for fullscreen mode (default: CTRL + tilde)
* Slightly improved reliability of the Frame Rate Boost option.

v0.9.4 - 2015-09-29
* Fixed automatic update notifications, which were broken in v0.9.3 due to one of the files not being updated.

v0.9.3 - 2015-09-24
+ Added automatic update notifications
* Fixed hotkeys being enabled preventing you from typing hotkey keys into a text box.
+ Added a hotkey for hiding and showing the side bar.  Default is the tilde key, just below ESC.

v0.9.2 - 2015-09-03
* Fixed the clip list when used with Blue Iris 3.66. This was broken since UI2 v0.8.3.

v0.9.1 - 2015-09-02
+ Added hotkeys for Digital Zoom, PTZ up/down/left/right, PTZ zoom, and loading PTZ presets.  Setting PTZ presets will not be made possible via hotkey, as setting a preset requires a confirmation click.
+ Added an option to the "UI Behavior" category which allows you to reverse the order of automatic clip playback when autoplay is enabled. (autoplay is the new ability for the next clip to automatically begin playing when the previous clip finishes)
+ Added images to some options in the UI2 Configuration panel to help find certain settings and understand their purpose more easily.
* Changed the Next and Previous clip hotkeys so that "Next" means newer, or higher in the list. "Previous" means older, or lower in the list.  I had this backwards in the previous release.

v0.9.0 - 2015-08-30
+ The options window contents are now split into categories.
+ Added a Hotkeys category to the options window.
+ Added the ability to skip forward and backward during clip playback. Only available by hotkey.
+ Added the ability to move to the next and previous clip when you press a hotkey or when the current clip is finished playing.
+ The top bar will now grow taller as necessary to prevent items from being hidden.
+ Added a "Low Quality" mode, controlled by a new icon in the top bar. Enabling Low Quality mode improves frame rates when viewing over a slow network connection (e.g. the internet).  The effect of the "Low Quality" mode is configurable in the options, "Video Streaming" category.
* Clip playback seeking is now enabled for everyone, regardless of their previous setting.  It may be disabled again if desired in the options window, "UI Behavior" category.

v0.8.3 - 2015-08-05
* Fixed compatibility with Blue Iris 4.1.3.0.
+ Camera names in the clip list should now be more readable for cameras that are assigned a light color in Blue Iris.

v0.8.2 - 2015-06-15
+ The playback controls will now appear in the top bar when there is room, so it doesn't have to overlap the video.

v0.8.1 - 2015-06-11
* The player will now automatically unpause when you select a new clip or alert.
* Fixed touchscreen event handlers for manipulating the seek bar and resizing the clip list, which were broken in the last update.
* Fixed a bug where the progress readout would show fractions of milliseconds if you played a clip at a speed lower than 1x.

v0.8.0 - 2015-06-09
+ Added advanced playback controls, including reverse playback and a seek bar.  The seek bar is not 100% accurate yet, due to a limitation of Blue Iris.  As such, the seek bar is disabled by default.
* Updated to the latest version of jquery 1.11.3.

v0.7.0 - 2015-05-16
+ Added simple clip playback controls.  Play/Pause, Slow Down, and Speed Up.
+ Added a 15 second timeout for image loads to work around an issue where Chrome sometimes fails to notice that an image did not load after network loss.
* Fixed a bug where clicking the "Load Fresh Alerts" or "Load Fresh Clips" buttons would change your clip group selection to the currently displaying camera(s).
* Fixed a bug where if the only camera was a PTZ, it was not controllable in UI2.

v0.6.4 - 2015-05-08
+ Made it possible to collapse the side bar on a touchscreen-only device, by dragging the edge the same way you would with a mouse on the desktop.
* Fixed some issues with UI2's ability to log you in as a different user for administrative functions.  Tested in Blue Iris 3.6.6 and 4.0.5.
* Added a small amount of margin above and below modal dialog boxes such as the Options dialog.

v0.6.3 - 2015-04-28
* Removed "Failed to log in" message that could appear needlessly on UI2 startup if the attempt to load the Schedule list fails (happened in Blue Iris 3.66 with authentication required).
* If the current Schedule name is reported by Blue Iris as an empty string, it will appear as "N/A" instead and UI2 will assume this means the global schedule has never been enabled.

v0.6.2 - 2015-04-27
+ A status update will now occur 1 second after changing the Schedule, to catch any Profile change that may occur.
+ Whenever Blue Iris' active profile changes, the camera and clip lists are updated and the view is restarted.
+ The "Toggle Recording" button in the camera context menu (long press over a camera frame) will now query the recording status of the camera, and change to read "Start Recording" or "Stop Recording" as appropriate.
* Fixed a bug where the "Toggle Recording" button was only able to start recording, but not stop it.  I think this bug arose due to an unanticipated change in Blue Iris' behavior.
* Added extra room for PTZ buttons and Preset buttons in an attempt to make them display correctly on a system using DPI scaling.
* Incompatible context menu options are now disabled on camera auto-cycle images.