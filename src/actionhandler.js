const rangeThresholds = [ 120, 240, 348];

var Image = function( filename, url, date, lat, lng){
  this.filename = filename;
  this.url = url;
  this.date = date;
  this.lat = lat;
  this.lng = lng;
};

function pad( n, width=2, z=0) {
  return (String(z).repeat(width) + String(n)).slice(String(n).length);
}

function initialize() {
  initMap();
  initializeImagesOnMap();
}

function initializeImagesOnMap() {
  // get images and their geolocation if available
  var imgElems = document.getElementsByClassName("c_img_elem");
  for (var i = 0; i < imgElems.length; i++) {
    var latElem = imgElems[i].getElementsByClassName("img_lat");
    var lngElem = imgElems[i].getElementsByClassName("img_lng");
    if( latElem.length && lngElem.length) {
      // extract image and tooltip from img_list and add to map tooltip
      var image = new Image();
      image.filename = imgElems[i].getElementsByClassName("img_filename")[0].innerHTML;
      image.url = imgElems[i].getElementsByClassName("c_img_thumb")[0].src;
      image.date = new Date( imgElems[i].getElementsByClassName("img_createdate")[0].dataset.date);
      image.lat = parseFloat( latElem[0].dataset.lat);
      image.lng = parseFloat( lngElem[0].dataset.lng);

      // add image marker to map
      addImgToMap( image.lat, image.lng, getMapTooltip(image), false);
      // show pin icon on image when lat and lng are set for image
      var pinElem = imgElems[i].getElementsByClassName("c_img_pin")[0];
      pinElem.className = pinElem.className.replace('c_disabled', '');
    }
  }

  showWholeImages();
}


function removeImages( geoTaggedOnly = false) {
  removeImg( geoTaggedOnly);
  // hide pin icon on image when lat and lng are set for image
  var pinElem = document.getElementsByClassName("c_img_pin_tagged");
  for( var i = 0; i < pinElem.length; i++) {
    pinElem[i].classList.add('c_disabled');
  }

  if( !geoTaggedOnly) {
    pinElem = document.getElementsByClassName("c_img_pin");
    for( var i = 0; i < pinElem.length; i++) {
      pinElem[i].classList.add('c_disabled');
    }
  }

  var tagBtn = document.getElementById("id_geotag_btn");
  tagBtn.classList.add('c_disabled');
}

// checks for each image if it is located on one of the GPX tracks, adds a
// marker on map and updates tooltip data
function updateGeoLocations() {
  removeImages( true);
  // get images
  var imgElems = document.getElementsByClassName("c_img_elem");
  for (var i = 0; i < imgElems.length; i++) {
    // get image url, date and filename from each element
    var date = new Date( imgElems[i].getElementsByClassName("img_createdate")[0].dataset.date).getTime();
    var timeOffsetSec = parseInt( document.getElementById( "id_range_time_out").getAttribute("value"));
    var image = new Image();
    image.filename = imgElems[i].getElementsByClassName("img_filename")[0].innerHTML; // filename
    image.url = imgElems[i].getElementsByClassName("c_img_thumb")[0].src;             // url
    image.date = new Date( date + timeOffsetSec * 1000);                              // date

    // check if element is on map and add a marker
    var latlng = getGeoLocation( image);
    if( latlng ) {
      // update tooltip data
      image.lat = latlng.lat;
      image.lng = latlng.lng;
      var tooltip = getMapTooltip( image);
      addImgToMap( image.lat, image.lng, tooltip, true);
      // show pin icon on image when lat and lng are set for image
      var pinElem = imgElems[i].getElementsByClassName("c_img_pin_tagged")[0];
      pinElem.className = pinElem.className.replace('c_disabled', '');
      //console.log('actionhandler.js:updateGeoLocations was here');
      var tagBtn = document.getElementById("id_geotag_btn");
      tagBtn.classList.remove('c_disabled');
    }
  }
}

function getMapTooltip( image) {
  // create container and add all elements
  var tooltip = document.createElement("div");
  tooltip.setAttribute("class", "c_map_marker_tooltip");
  // create each element
  if( image.url) {
    var img = document.createElement("img");
    img.src = image.url;
    tooltip.appendChild(img);
  }

  var file = document.createElement("div");
  file.innerHTML = "<strong>" + image.filename + "</strong>";
  var date = document.createElement("div");
  date.innerHTML = "<strong>Date: </strong>" + image.date.toLocaleString();
  var lat = document.createElement("div");
  lat.innerHTML = "<strong>Latitude: </strong>" + image.lat.toFixed(6);
  var lng = document.createElement("div");
  lng.innerHTML = "<strong>Longitude: </strong>" + image.lng.toFixed(6);
  tooltip.appendChild(file);
  tooltip.appendChild(date);
  tooltip.appendChild(lat);
  tooltip.appendChild(lng);
  return tooltip;
}


function updateAdjustment(e) {
  var timeOffset = 0;
  var range = document.getElementById( "id_range_time");
  var rangeVal = parseInt( range.value);
  var sign = (rangeVal < 0) ? -1 : 1;
  if( rangeVal >= -rangeThresholds[0] && rangeVal <= rangeThresholds[0] ) {
    timeOffset = rangeVal;
  }
  else if( rangeVal >= -rangeThresholds[1] && rangeVal <= rangeThresholds[1]) {
    timeOffset = (rangeVal - sign * rangeThresholds[0]) * 5 + sign * rangeThresholds[0];
  }
  else if( rangeVal >= -rangeThresholds[2] && rangeVal <= rangeThresholds[2]) {
    timeOffset = (rangeVal - sign * rangeThresholds[1]) * 10 + sign * (rangeThresholds[1] - rangeThresholds[0]) * 5 + sign * rangeThresholds[0];
  }

  var offset = document.getElementById("id_hour_offset");
  timeOffset += parseInt( offset.options[offset.selectedIndex].value);
  sign = (timeOffset < 0) ? -1 : 1; // update sign info according to hour offset
  var time = new Date( sign * timeOffset * 1000);
  var out = document.getElementById( "id_range_time_out");
  out.value = ((sign < 0) ? '-' : '+') + pad(time.getUTCHours()) + ':' + pad(time.getUTCMinutes()) + ':'+ pad(time.getUTCSeconds()) + ' hrs';
  out.setAttribute( "value", timeOffset);
  updateGeoLocations();
}


function setGeotag( event) {
  // block button show spinner
  // collect data
  var data = { "file": "IMG_20170626_125122.jpg", "lat": "0", "lng": "0"}
  // send ajax request
  sendPostRequest("tagimage.php", updateImageData, JSON.stringify(data));
}

function updateImageData( data) {
  console.log("updateImageData: was here");
}
