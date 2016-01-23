In order to ease the update process, your groups settings are 
now stored in a different file that is not overwritten if you 
update the pages.
	
To configure groups, create a new file named:

	groups_settings.js

Place it in your Blue Iris's "www" folder.  Copy the following javascript into it, and modify as necessary for your setup:







function GetCamList()
{
	var groupConfig = new Array();
	
	// Note: The first ID on each line is the group grid image ID.  The remaining IDs are camera IDs in the order they appear in the group grid (left to right then top to bottom).
	// Also Note: If you want an "all cameras" view, use "index" as the group name.
	
	// Begin Group Definitions

	groupConfig.push(["backyard", "backyard4", "backyardeast", "backyardwest", "scenery1"]);
	groupConfig.push(["driveway", "porch2", "drive1", "drive4", "drive2", "drive3", "drive5"]);
	groupConfig.push(["frontyard", "frontyard1", "porch1"]);
	groupConfig.push(["garage", "garage2", "garage3", "garaged"]);
	groupConfig.push(["porch", "porch2", "porch1"]);
	
	// End Group Definitions
	
	return groupConfig;
}

$(function()
{

	// The time in milliseconds to wait between camera refreshes
	refreshTime = 25;
	
	//////////////////////////////////////////////////
	// If you want to enable an on-screen button 
	// to toggle the Group Cameras Cycle feature, 
	// set enableGroupCamerasCycle = true
	//
	// If enabled, the tilde key (` and ~ key) will 
	// also activate and deactivate this feature.
	//
	// When the auto-cycle feature is activated, 
	// the images in the currently selected group 
	// will automatically cycle just like the All 
	// Cameras cycle feature in Blue Iris.
	//////////////////////////////////////////////////
	enableGroupCamerasCycle = false;
	
});