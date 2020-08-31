
const url ='http://192.168.1.105:8000';
const settingsEndpoint = url + '/params';
const statusEndpoint = url + '/status'

var path = location.pathname;
var request_start_time = performance.now();
var start_time = performance.now();
var time = 0;
var request_time = 0;
var time_smoothing = 0.1 // larger=more smoothing
var request_time_smoothing = 0.2; // larger=more smoothing
var target_time = 1000 / target_fps;
var target_fps = 30;

console.log(statusEndpoint)
var img = document.getElementById("liveImg");

var voltText = document.getElementById("volt");
var ampText = document.getElementById("amp");
var percText = document.getElementById("perc");
var cpuText = document.getElementById("cpu");
var freqText = document.getElementById("freq");
var tempText = document.getElementById("temp");
var memText = document.getElementById("mem");
var fpsText = document.getElementById("fps");

var hasMotionText = document.getElementById("has_motion")
var hasMeterText = document.getElementById("has_meter")
var hasHapticText = document.getElementById("has_haptic")
var hasDACLText = document.getElementById("has_left_dac")
var hasDACRText = document.getElementById("has_right_dac")

var decimationMagSlider = document.getElementById("decimation_mag_slider");
var spatialMagSlider = document.getElementById("spatial_mag_slider");
var spatialAlphaSlider = document.getElementById("spatial_alpha_slider");
var spatialDeltaSlider =document.getElementById("spatial_delta_slider");
var holeMagSlider = document.getElementById("hole_mag_slider");
var gaussMagSlider = document.getElementById("gauss_mag_slider");
var zoomSlider = document.getElementById("colorizer_alpha_slider");
var maskSlider = document.getElementById("mask_slider");


get_depth_params();
get_status();
var wsProtocol = (location.protocol === "https:") ? "wss://" : "ws://";


if(path.endsWith("index.html"))
{
    path = path.substring(0, path.length - "index.html".length);
}

if(!path.endsWith("/")) {
    path = path + "/";
}

var ws = new WebSocket(wsProtocol + location.host + path + "websocket");
ws.binaryType = 'arraybuffer';

function requestImage() {
    request_start_time = performance.now();
    ws.send('more');
}

ws.onopen = function() {
    console.log("connection was established");
    start_time = performance.now();
    requestImage();

};

ws.onmessage = function(evt) {


    var arrayBuffer = evt.data;
    var blob  = new Blob([new Uint8Array(arrayBuffer)], {type: "image/jpeg"});
    img.src = window.URL.createObjectURL(blob);

    var end_time = performance.now();
    var current_time = end_time - start_time;
    // smooth with moving average
    time = (time * time_smoothing) + (current_time * (1.0 - time_smoothing));
    start_time = end_time;
    var fps = Math.round(1000 / time);
    fpsText.textContent = "Stream FPS: " + fps;

    var current_request_time = performance.now() - request_start_time;
    // smooth with moving average
    request_time = (request_time * request_time_smoothing) + (current_request_time * (1.0 - request_time_smoothing));
    var timeout = Math.max(0, target_time - request_time);



    setTimeout(requestImage, timeout);
};


function get_status(){
    $.ajax(statusEndpoint, {
        success: function(data) {
            hasMotionText.textContent  = data['has_motion'];
            hasMeterText.textContent  = data['has_meter'];  
            hasHapticText.textContent  = data['has_haptic'];
            hasDACLText.textContent  = data['has_left_dac'];
            hasDACRText.textContent = data['has_right_dac'];   
                   
            voltText.textContent = data["voltage"] + "V";
            ampText.textContent =  data["current"] + "mA";
            percText.textContent = data["percentage"] + "% ";
            cpuText.textContent =  data["cpu_usage"] + "%";
            freqText.textContent = data["cpu_freq"] + "Mhz";
            tempText.textContent = data["temp"];
            memText.textContent = data["memory"] + "MB";

            setTimeout(get_status, 1000);
            console.log("> status request")
        },
        error: function() {
         console.log("error bro");
        }
    });
}

function get_depth_params(){
    $.ajax(settingsEndpoint, {
        success: function(data) {
            decimationMagSlider.value = data['decimation_mag'];
            spatialMagSlider.value = data['spatial_mag'];
            spatialAlphaSlider.value = data['spatial_alpha'];
            spatialDeltaSlider.value =  data['spatial_delta'];
            holeMagSlider.value = data['hole_mag']
            gaussMagSlider.value = data['gaussian_mag']
            zoomSlider.value = data['colorizer_alpha_slider']
            maskSlider.value = data['mask']
            console.log(data);
        },
        error: function() {
         console.log("error bro");
        }
    });
}

$(document).ready(function(){
    $("[type=range]").change(function(){
        var newval=$(this).val();
        var id = $(this).attr('id');
        console.log(newval, id);

        $.post(settingsEndpoint,
        {
          'slider': id, 
          'value': newval
        },
        
        function(data, status){
          console.log("Data: " + data + "\nStatus: " + status);
        });
    });
});
        

