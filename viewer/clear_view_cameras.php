<?php

/*
Plugin Name: Clear View Cameras
Plugin URI: http://talleyservices.com
Author URI: http://talleyservices.com

Description: Allows Blue Iris cameras to be used in WordPress

Version: 0.5

*/

// https://www.houselogix.com/docs/blue-iris/BlueIris/server.htm

//Testing / Development ONLY
//define('WP_DEBUG', true);

//Block direct access to file
defined( 'ABSPATH' ) or die( 'No access to outsiders' );
// Enqueue the JavaScripts
function clear_view_cameras_scripts(){
  wp_enqueue_style( 'clear_view_cameras-css', plugins_url( '/clear_view_cameras.css', __FILE__ ));

  wp_enqueue_script( 'clear_view_cameras_script-js',  plugins_url( '/clear_view_cameras.js', __FILE__ ), array('jquery'), '', true);

  wp_enqueue_script( 'jquery-md5-js',  plugins_url( '/jquery.md5.js', __FILE__ ), array('jquery'), '', true);

  wp_enqueue_script( 'jquery-cookie-js',  plugins_url( '/jquery.cookie.js', __FILE__ ), array('jquery'), '', true);


  wp_localize_script('clear_view_cameras_script', 'clear_view_cameras_script_obj',
    array(
      'servername' => 'sol.home',
      'username' => 'admin',
    ));

} //end function clear_view_cameras_scripts
add_action( 'wp_enqueue_scripts', 'clear_view_cameras_scripts');
//Include the JavaScript
// include( dirname( __FILE__ ) . '/clear_view_cameras.js');

//Include the admin panel page
include( dirname( __FILE__ ) . '/clear_view_cameras_admin.php');


/* ============================================================================
	   Shortcodes
   ============================================================================ */


add_shortcode('clear_view_cameras','loadClearViewCameras');


/* ============================================================================
	   Functions
   ============================================================================ */

// This is the main controller that calls other functions


function loadClearViewCameras() {

	// echo "Beginning the CSV Export.";
	// echo "<br>";
  //
	// echo '<img src="http://sol.home/image/dwygate">';
  ?>
  <div id="cameraSelection"></div>
			<ul class="navigation">
			<li id="cameraLinks" class="nav-heading">
				<span>Cameras</span>
				<ul></ul>
			</li>
			<!-- <div class="clear"></div> -->
			<li id="refreshRates" class="nav-heading">
				<span>Speed</span>
				<ul></ul>
			</li>
			<!-- <div class="clear"></div> -->
			<li id="directCamLinks" class="nav-heading">
				<span>Camera Links</span>
				<ul>
					<li><a href="http://10.0.1.31" target="_blank" title="user: administrator / password: s3kret">Workshop</a></li>
					<li><a href="http://10.0.1.32" target="_blank" title="user: administrator / password: s3kret">Garage</a></li>
					<li><a href="http://10.0.1.34" target="_blank" title="user: administrator / password: s3kret">HouseSide</a></li>
					<li><a href="http://10.0.1.35" target="_blank" title="user: admin / password: s3kret">BarnRear</a></li>
					<li><a href="http://10.0.1.36" target="_blank" title="user: admin / password: s3kret">Duck</a></li>
					<li><a href="http://10.0.1.37" target="_blank" title="user: admin / password: s3kret">Chicken1</a></li>
					<li><a href="http://10.0.1.38" target="_blank" title="user: admin / password: s3kret">Basement</a></li>
					<li><a href="http://10.0.1.39" target="_blank" title="user: admin / password: s3kret">Chicken2</a></li>
					<li><a href="http://10.0.1.40" target="_blank" title="user: admin / password: s3kret">Garden</a></li>
					<li><a href="http://10.0.1.42" target="_blank" title="user: admin / password: s3kret">HorseStallsInt</a></li>
					<li><a href="http://10.0.1.43" target="_blank" title="user: admin / password: s3kret">ChickenExt</a></li>
					<li><a href="http://10.0.1.45" target="_blank" title="user: admin / password: s3kret">BarnInt</a></li>
					<li><a href="http://10.0.1.46" target="_blank" title="user: admin / password: s3kret">HorseField</a></li>
					<li><a href="http://10.0.1.47" target="_blank" title="user: admin / password: s3kretcam">Dog</a></li>
					<li><a href="http://10.0.1.48" target="_blank" title="user: admin / password: s3kret">Driveway</a></li>
					<li><a href="http://10.0.1.49" target="_blank" title="user: admin / password: s3kretcam">Gate</a></li>
					<li><a href="http://10.0.1.50" target="_blank" title="user: admin / password: s3kretcam">HorseStallsExt</a></li>
					<li><a href="http://10.0.1.51" target="_blank" title="user: admin / password: s3kretcam">HouseFront</a></li>
				<!-- </span> -->
			</ul>
			</li>
		</ul>
		<input type="checkbox" id="nav-trigger" class="nav-trigger" />
		<label for="nav-trigger"></i>
		</label>
		<div class="site-wrap">
		<div id="outerViewportWrapper">
			<div id="cameraViewport">
		    <canvas id="cameraImg" height="640"></canvas>
			</div>
		</div>
	</div> <!-- site-wrap -->
  <?php

} //end function loadClearViewCameras


?>
