<?php

/* Adds admin menu under the Tools section in the Dashboard */
function opal_eye_cameras_admin_menu() {
	add_submenu_page( 
		'tools.php',
		'Opal Eye Cameras plugin',
		'Opal Eye Cameras',
		'manage_options',
		'opal_eye_cameras_menu',
		'opal_eye_cameras_menu_options'
	);
}



//Register the menu
add_action( 'admin_menu', 'opal_eye_cameras_admin_menu' );


/* Create the actual options page */

function opal_eye_cameras_menu_options() {

	if ( !current_user_can( 'manage_options' ) )  {
		wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
	}
	if ( ! isset( $_REQUEST['settings-updated'] ) )
          $_REQUEST['settings-updated'] = false;
     ?>
	
	<div class="wrap">
		<?php if ( false !== $_REQUEST['settings-updated'] ) : ?>
		<div class="updated fade"><p><strong><?php _e( 'Options saved!', 'opal_eye_cameras_plugin' ); ?></strong></p></div>
		<?php endif; ?>
          
	<h2>Opal Eye Cameras Plugin</h2>
	<p>Allows adding a BlueIris viewer to WordPress.</p>
	<p>Various options can be defined.</P>
	<p>There is also a shortcode available which can run the plugin if added to a page: <b>[opal_eye_cameras]</b></p>
	<div class="wrap form">
	<form action="options.php" method="POST">
	<?php settings_fields( 'opal_eye_cameras_settings' ); ?>
    <?php do_settings_sections( 'opal_eye_cameras_menu' ); ?>
                              
	<?php submit_button(); ?>
	</form>
	</div>
	</div>
	
<?php
} //end function opal_eye_cameras_menu_options

/* Register the various settings */
function opal_eye_cameras_register_settings() {
	
	add_settings_section('opal_eye_cameras_settings','Plugin Settings', 'opal_eye_cameras_settings_section_callback', 'opal_eye_cameras_menu');
	
	//ftp server
	register_setting( 'opal_eye_cameras_settings', 'opal_eye_cameras_ftpserver_option' );
	add_settings_field('opal_eye_cameras_ftpserver_option','FTP Server', 'opal_eye_cameras_ftpserver_option_callback', 'opal_eye_cameras_menu', 'opal_eye_cameras_settings');
	
	//ftp username
	register_setting( 'opal_eye_cameras_settings', 'opal_eye_cameras_ftpserver_username' );
	add_settings_field('opal_eye_cameras_ftpserver_username','FTP Username', 'opal_eye_cameras_ftpserver_username_callback', 'opal_eye_cameras_menu', 'opal_eye_cameras_settings');

	//ftp password
	register_setting( 'opal_eye_cameras_settings', 'opal_eye_cameras_ftpserver_password' );
	add_settings_field('opal_eye_cameras_ftpserver_password','FTP Password', 'opal_eye_cameras_ftpserver_password_callback', 'opal_eye_cameras_menu', 'opal_eye_cameras_settings');
	
	//ftp enable
	register_setting( 'opal_eye_cameras_settings', 'opal_eye_cameras_ftpserver_enable' );
	add_settings_field('opal_eye_cameras_ftpserver_enable','FTP enable', 'opal_eye_cameras_ftpserver_enable_callback', 'opal_eye_cameras_menu', 'opal_eye_cameras_settings');
} //end function opal_eye_cameras_menu_settings

add_action( 'admin_init', 'opal_eye_cameras_register_settings' );



/* Provides simple description for the options page. */

function opal_eye_cameras_settings_section_callback() {
	echo '<P>Fill in the FTP values for your server below.</P>';
} //end function opal_eye_cameras_settings_section_callback

/* Add individual options */
function opal_eye_cameras_ftpserver_option_callback() {
	$accCarsComExportFTPServer = get_option('opal_eye_cameras_ftpserver_option') ;
	echo "<input type='text'id='opal_eye_cameras_ftpserver_option' name='opal_eye_cameras_ftpserver_option' value='$accCarsComExportFTPServer' />";
} //end function opal_eye_cameras_ftpserver_option_callback

function opal_eye_cameras_ftpserver_username_callback() {
	$accCarsComExportFTPUsername = get_option('opal_eye_cameras_ftpserver_username') ;
	echo "<input type='text' id='opal_eye_cameras_ftpserver_username' name='opal_eye_cameras_ftpserver_username' value='$accCarsComExportFTPUsername' />";
} //end function opal_eye_cameras_ftpserver_username_callback

function opal_eye_cameras_ftpserver_password_callback() {
	$accCarsComExportFTPPassword = get_option('opal_eye_cameras_ftpserver_password') ;
	echo "<input type='password' id='opal_eye_cameras_ftpserver_password' name='opal_eye_cameras_ftpserver_password' value='$accCarsComExportFTPPassword' />";
} //end function opal_eye_cameras_ftpserver_password_callback

function opal_eye_cameras_ftpserver_enable_callback() {
	$accCarsComExportFTPUploadBool = get_option('opal_eye_cameras_ftpserver_enable') ;
	echo "<input type='radio' id='opal_eye_cameras_ftpserver_enable' name='opal_eye_cameras_ftpserver_enable' value='true' ". checked($accCarsComExportFTPUploadBool, 'true', false ) . " />Enabled &nbsp;";
	echo "<input type='radio' id='opal_eye_cameras_ftpserver_enable' name='opal_eye_cameras_ftpserver_enable' value='false' ". checked($accCarsComExportFTPUploadBool, 'false', false) . " />Disabled";
} //end function opal_eye_cameras_ftpserver_password_callback



// Add default values if they don't exist
//add_option( 'opal_eye_cameras_ftpserver_option', 'ftp.servername.com');
//add_option( 'opal_eye_cameras_ftpserver_username', 'username');
//add_option( 'opal_eye_cameras_ftpserver_password', 'password');
//add_option( 'opal_eye_cameras_ftpserver_enable', 'false');
?>