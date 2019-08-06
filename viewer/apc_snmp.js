/*
Name: apc_snmp.js
Version: 1.0
Author: Steve Talley (steve@dustysun.com)
Website: DustySun.com

Description: Controls the APC power units.
*/


//Global Variables

//Begin outer anonymous wrapping function
jQuery(function($) {
  $(document).ready(function() {

      var snmp_community = 'ttsdevices';
      var apc_units = [];

      apc_units.push({
        'name': 'Garage',
        'ip': '10.0.1.9',
        'outlets': ['1', '4', '3'],
        'outlet_names': ['Garage Cameras' , 'Garage Door Opener' , 'Garage WiFi'],
      });

      apc_units.push({
        'name': 'Barn1',
        'ip': '10.0.1.15',
        'outlets': ['8'],
        'outlet_names': ['Light Pole Cameras'],
      });

      apc_units.push({
        'name': 'Barn2',
        'ip': '10.0.1.16',
        'outlets': ['8', '1', '3'],
        'outlet_names': ['Other Barn Cameras', 'Barn WiFi', 'Heat Lamp'],
      });

      function createSNMPLinks() {


        apc_units.forEach(function(apc_units_item, apc_units_index, apc_units_array){
          apc_units_item['outlets'].forEach(function(apc_outlets_item, apc_outlets_index, apc_outlets_array){

          $('#cameraPower ul').append($('<li><a href="#" id="apc' + apc_units_item['name'] + apc_outlets_item + '" class="apcSNMP" data-apc-ip="' + apc_units_item['ip'] + '" data-apc-outlet="' + apc_outlets_item + '" data-apc-name="' + apc_units_item['name'] + '"><span class="outlet-status"></span>' +  apc_units_item['outlet_names'][apc_outlets_index] +  '</a></li>'));
          });
        });



      } //end getOutletStatus

      //actually create the links
      createSNMPLinks();


      function getOutletStatus() {

        var apc_snmp_outlets = $('.apcSNMP');

        apc_snmp_outlets.each(function() {
          // console.log(this);
          var apc_name = $(this).attr('data-apc-name');
          var apc_ip = $(this).attr('data-apc-ip');
          var apc_outlet = $(this).attr('data-apc-outlet');

          ajaxURL = 'http://narada.home/snmp.php?community=' + snmp_community + '&ip=' + apc_ip + '&outlet=' + apc_outlet + '&statusonly=true';
          $.ajax({
              dataType: "json",
              // data: data,
        			url: ajaxURL,
        			cache: false,
        			success: function(response){

                var current_target = ('#apc' + apc_name + apc_outlet);
                var current_target_icon = $(current_target).find('.outlet-status');
                if(response['data']['outlet_status'] == 'on'){
                  $(current_target).data('apc-outlet-status', 'on');
                  $(current_target_icon).removeClass('outlet-off');
                  $(current_target_icon).addClass('outlet-on');
                } else if(response['data']['outlet_status'] == 'off') {
                  $(current_target).data('apc-outlet-status', 'off');
                  $(current_target_icon).addClass('outlet-off');
                  $(current_target_icon).removeClass('outlet-on');
                } else {
                  $(current_target).data('apc-outlet-status', 'unknown');
                  $(current_target_icon).removeClass('outlet-off');
                  $(current_target_icon).removeClass('outlet-on');
                }
        			}
        		});
        });
      }

      getOutletStatus();
      var CameraStatusIntervalGlobal = setInterval(getOutletStatus, 30000);

      //Listen for clicks
      $('.apcSNMP').click(function(event){
        //stop the interval so the status doesn't change while we're doing something
        clearInterval(CameraStatusIntervalGlobal);

        var current_link = this;
        //Disable the link
        $(current_link).addClass('disabled');

        //Get our info
        var apc_target_ip = $(this).data('apc-ip');

        var apc_target_outlet = $(this).data('apc-outlet');

        var apc_outlet_status = $(this).data('apc-outlet-status');

        //build our ajax
        if(apc_outlet_status == 'on') {
          var command_to_send = 2;
        } else if (apc_outlet_status == 'off') {
          var command_to_send = 1;
        }  else {
          var command_to_send = 3;
        }

        ajaxURL = 'http://narada.home/snmp.php?community=' + snmp_community + '&ip=' + apc_target_ip + '&outlet=' + apc_target_outlet + '&command=' + command_to_send + '&statusonly=false';
        $.ajax({
            dataType: "json",
            // data: data,
            url: ajaxURL,
            cache: false,
            success: function(response){


              if(response['data']['outlet_status'] == command_to_send) {
                alert("Success. Please wait 30 seconds before turning it on or off again.");
              } else {
                alert("Unable to do what you asked. :(");
              }

              //poll the current status
              getOutletStatus();
              var CameraStatusIntervalGlobal = setInterval(getOutletStatus, 30000);

              //re-enable the link
              setTimeout(function() {
                  $(current_link).removeClass('disabled');
                  console.log('Re-enabling link');
              }, 30000);

            }
          });

      });

  }); //end document ready


}); //end outer wrapping function
