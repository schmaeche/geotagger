// actionhandler.js
// @author Andreas Werner
// @date August 2017
//

/******************************************************************************
Constants and helper functions
******************************************************************************/
const GEO_LOC_NONE     = 0x00;
const GEO_LOC_ORIGINAL = 0x01;
const GEO_LOC_NEW      = 0x02;

var Image = function( filename, url, date, lat = .0, lng = .0){
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
  GTmap.initMap();
  getNextImage();
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

function getImageFromElement(node, geoLoc) {
  var image = new Image();
  // set filename (mandatory element)
  image.filename = node.getElementsByClassName("img_filename")[0].innerHTML;
  // set url (mandatory element)
  image.url = node.getElementsByClassName("c_img_thumb")[0].src;
  // set date (optional element)
  var dateElem = node.getElementsByClassName("img_createdate");
  if( dateElem.length) {
    image.date = new Date( dateElem[0].dataset.date);
  }
  // set latitude and longitude (optional elements)
  switch (geoLoc) {
    case GEO_LOC_ORIGINAL:
      var latElem = node.getElementsByClassName("img_lat");
      var lngElem = node.getElementsByClassName("img_lng");
      if( latElem.length && lngElem.length) {
        image.lat = parseFloat( latElem[0].dataset.lat);
        image.lng = parseFloat( lngElem[0].dataset.lng);
      }
      break;
    case GEO_LOC_NEW:
      var latElem = node.getElementsByClassName("img_new_lat");
      var lngElem = node.getElementsByClassName("img_new_lng");
      if( latElem.length && lngElem.length) {
        image.lat = parseFloat( latElem[0].dataset.lat);
        image.lng = parseFloat( lngElem[0].dataset.lng);
      }
      break;
    case GEO_LOC_NONE:
    default:
      break;
  }

  return image;
}

/******************************************************************************
Map interaction functions
******************************************************************************/

// displays either a marker for original geotag or a marker for retrieved geo
// coordinates from a gpx file on map. Pictures not matching on any gpx will be
// automatically being removed from map
function showImageOnMap( node, geoLoc) {

  if( geoLoc & GEO_LOC_ORIGINAL ) {
    var image = getImageFromElement(node, GEO_LOC_ORIGINAL);
    if( image.lat && image.lng) {
      // add image marker to map
      GTmap.addImgToMap( image, getMapTooltip(image), false);
      // show pin icon on image when lat and lng are set for image
      var pinElem = node.getElementsByClassName("c_img_pin")[0];
      pinElem.className = pinElem.className.replace('c_disabled', '');
    }
  }

  if( geoLoc & GEO_LOC_NEW) {
    // get image url, date and filename from each element
    var image = getImageFromElement(node, GEO_LOC_NONE);

    var date = new Date( node.getElementsByClassName("img_createdate")[0].dataset.date).getTime();
    var timeOffsetSec = parseInt( document.getElementById( "id_range_time_out").getAttribute("value"));
    image.date = new Date( date + timeOffsetSec * 1000);

    // check if element is on map and add a marker
    var latlng = GTmap.getGeoLocation( image);
    if( latlng ) {
      // update tooltip data
      image.lat = latlng.lat;
      image.lng = latlng.lng;
      var tooltip = getMapTooltip( image);
      GTmap.updateImgOnMap(image, tooltip);
      updateImageTooltipLatLng( node, image);
      updateGeoTagButton();
    }
    else {
      // @TODO check if image was tagged manually or automatically and remove only when latter was true
      removeImage(node, GEO_LOC_NEW);
    }
  }
}


function initializeImagesOnMap() {
  // get images and their original geolocation if available
  var imgElems = document.getElementsByClassName("c_img_elem");
  for (var i = 0; i < imgElems.length; i++) {
    // check if date element is available, only valid elements will be shown than
    var dateElem = imgElems[i].getElementsByClassName("img_createdate");
    if( dateElem.length) {
      showImageOnMap( imgElems[i], GEO_LOC_ORIGINAL);
    }
  }
  GTmap.showWholeImages( LAYER_GEO_ORIG);
}

function removeImage( node, geoLoc) {
  // hide pin icon on image when lat and lng are set for image
  if(geoLoc & GEO_LOC_NEW) {
    var pinElem = node.getElementsByClassName("c_img_pin_tagged");
    if( pinElem.length) {
      pinElem[0].classList.add('c_disabled');
      var ttipElem = node.getElementsByClassName("c_img_tooltip")[0];
      var latElem = ttipElem.getElementsByClassName("img_new_lat");
      if( latElem.length) {
        ttipElem.removeChild(latElem[0]);
      }
      var lngElem = ttipElem.getElementsByClassName("img_new_lng");
      if( lngElem.length) {
        ttipElem.removeChild(lngElem[0]);
      }
      var image = getImageFromElement(node, GEO_LOC_NEW);
      GTmap.removeImageMarker(image, LAYER_GEO_TAG);
      updateGeoTagButton();
    }
  }
  // hide pin icon
  if( geoLoc & GEO_LOC_ORIGINAL) {
    pinElem = node.getElementsByClassName("c_img_pin");
    pinElem[0].classList.add('c_disabled');
  }
}

function removeImages( geoLoc) {
  var layer = (geoLoc & GEO_LOC_ORIGINAL) ? LAYER_GEO_ORIG : LAYER_NONE;
  layer = (geoLoc & GEO_LOC_NEW) ? layer | LAYER_GEO_TAG : layer;
  GTmap.removeAllImages( layer);

  var elems = document.getElementsByClassName("c_img_elem");
  for (var i = 0; i < elems.length; i++) {
    removeImage( elems[i], geoLoc);
  }

  updateGeoTagButton();
}

// checks for each image if it is located on one of the GPX tracks, adds a
// marker on map and updates tooltip data
function updateGeoLocations() {
  // get images
  var imgElems = document.getElementsByClassName("c_img_elem");
  for (var i = 0; i < imgElems.length; i++) {
    // check if date element is available, only valid elements will be shown than
    var dateElem = imgElems[i].getElementsByClassName("img_createdate");
    if( dateElem.length) {
      showImageOnMap( imgElems[i], GEO_LOC_NEW);
    }
  }
}

// adds a marker on map and updates tooltip data
function setImageGeoLocation( node, lat, lng) {
  // add new marker and tooltip to map
  var image = getImageFromElement(node, GEO_LOC_NONE);
  image.lat = lat;
  image.lng = lng;
  var tooltip = getMapTooltip( image);
  GTmap.updateImgOnMap( image, tooltip);
  updateImageTooltipLatLng( node, image);
  updateGeoTagButton();
}

/******************************************************************************
Map dragging functions
******************************************************************************/
function handleImgDragStart(e) {
  var imgElem = e.currentTarget.parentNode;
  e.dataTransfer.setData('text/html', imgElem.getElementsByClassName("img_filename")[0].innerHTML);
  e.dataTransfer.setDragImage( e.currentTarget, 100, 100);
  var tooltip = imgElem.getElementsByClassName("c_img_tooltip")[0];
  tooltip.style.visibility = "hidden";
}

function handleImgDragEnd(e) {
  var tooltip = e.currentTarget.parentNode.getElementsByClassName("c_img_tooltip")[0];
  tooltip.style.visibility = "";
}

function showDragPin(e) {
  // console.log("showDragPin");
  if(e.preventDefault) {
    e.preventDefault();
  }
  if (e.stopPropagation) {
    e.stopPropagation(); // stops the browser from redirecting.
  }
  GTmap.showDropPin(e);
}


function hideDragPin(e) {
  // console.log("hideDragPin");
  if(e.preventDefault) {
    e.preventDefault();
  }
  if (e.stopPropagation) {
    e.stopPropagation(); // stops the browser from redirecting.
  }
  GTmap.hideDropPin(e);
}


function updateDragPin(e) {
  // console.log("show");
  if( e.preventDefault) {
    e.preventDefault();
  }
  if (e.stopPropagation) {
    e.stopPropagation(); // stops the browser from redirecting.
  }
  GTmap.showDropPin(e);
}


function dropDragPin(e) {
  // console.log("dropDragPin");
  if (e.stopPropagation) {
    e.stopPropagation(); // stops the browser from redirecting.
  }

  var latlng = GTmap.hideDropPin(e);
  if( latlng) {
    var file = e.dataTransfer.getData('text/html');
    var elems = document.getElementsByClassName("img_filename");
    for (var i = 0; i < elems.length; i++) {
      if( elems[i].innerHTML == file) {
        setImageGeoLocation( elems[i].parentNode.parentNode, latlng.lat, latlng.lng);
        break;
      }
    }

  }
}

/******************************************************************************
Input handling functions
******************************************************************************/
const rangeThresholds = [ 120, 240, 348];

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

/******************************************************************************
Ajax interaction functions
******************************************************************************/
function AjaxImage() {
  this.file = "";
  this.lat = "0";
  this.lng = "0";
}

function retrieveImage( node) {
  node.setAttribute("src", node.getAttribute("data-src"));
  node.onload = function() {
    this.removeAttribute("data-src");
  };
  var filename = node.getAttribute("alt");
  GTajax.sendGetRequest( "src/updateimages.php?file=" + filename, updateImageElement, filename)
}

function getNextImage() {
  var images = document.getElementsByClassName("img_loading");
  if( images.length) {
    retrieveImage(images[0]);
    return true;
  }
  return false;
}

function updateImageElement( request, file) {
  //console.log("ajaxhandler:updateImageElement");
  var images = document.getElementsByClassName("c_img_elem");
  for (var i = 0; i < images.length; i++) {
    var loading = images[i].getElementsByClassName("img_loading");
    // there should be only one element for each file hence we break after triggering next image request
    if( loading.length && loading[0].alt === file) {
      images[i].innerHTML = request.responseText;
      showImageOnMap( images[i], GEO_LOC_ORIGINAL | GEO_LOC_NEW);
      if( false === getNextImage()) {
        // zoom to all elements only once after all images have been loaded
        GTmap.showWholeImages(LAYER_GEO_ORIG);
      }
      break;
    }
  }
}

function setGeotag( event) {
  // block button show spinner
  var button = document.getElementById("id_geotag_btn");
  button.setAttribute("disabled", "disabled");
  var img = document.createElement("img");
  img.src = "img/Loading_icon.gif";
  img.width = "19";
  img.height = "13";
  button.innerHTML = "";
  button.appendChild(img);

  // collect data
  var data = [];
  var elems = document.getElementsByClassName("c_img_elem");
  for (var i = 0; i < elems.length; i++) {
    var fileElem = elems[i].getElementsByClassName("img_filename");
    var latElem = elems[i].getElementsByClassName("img_new_lat");
    var lngElem = elems[i].getElementsByClassName("img_new_lng");
    if( fileElem.length && latElem.length && lngElem.length) {
      var ajaxElem = new AjaxImage();
      ajaxElem.file = fileElem[0].innerHTML;
      ajaxElem.lat = latElem[0].dataset.lat;
      ajaxElem.lng = lngElem[0].dataset.lng;
      data.push(ajaxElem);
    }
  }
  //var data = [ {"file": "foobar.jpg", "lat": "12.3456789", "lng": "-98.7654321"},
  //             {"file": "IMG_20170626_125122.jpg", "lat": "-80.987654", "lng": "150.123456789"}];

  // send ajax request
  if( data.length) {
    GTajax.sendPostRequest("src/tagimage.php", updateImageData, JSON.stringify(data));
  }
  else {
    console.warn("actionhandler:setGeotag() make sure that button is only shown when images can be tagged!");
    // enable button again
    var button = document.getElementById("id_geotag_btn");
    button.removeAttribute("disabled");
    button.innerHTML = "Geotag";
  }
}

function updateImageData( request) {
  console.log("updateImageData: " + request.responseText);
  // add download links to page
  var linkList = document.getElementById("id_img_download");
  linkList.innerHTML += request.responseText;

  // activate geotag button again
  var button = document.getElementById("id_geotag_btn");
  button.removeAttribute("disabled");
  button.innerHTML = "Geotag";
}

/******************************************************************************
DOM interaction functions
******************************************************************************/
function updateImageTooltipLatLng( node, image) {
  // show pin icon on image when lat and lng are set for image
  var pinElem = node.getElementsByClassName("c_img_pin_tagged")[0];
  pinElem.className = pinElem.className.replace('c_disabled', '');
  var tooltip = node.getElementsByClassName("c_img_tooltip")[0];

  var latElems = node.getElementsByClassName("img_new_lat");
  if(latElems.length) {
    latElems[0].innerHTML = "New latitude: " + image.lat.toFixed(6);
  }
  else {
    var newElem = document.createElement('div');
    newElem.setAttribute('class', 'c_img_tooltip_elem img_new_lat');
    newElem.setAttribute('data-lat', image.lat);
    newElem.innerHTML = "New latitude: " + image.lat.toFixed(6);
    tooltip.appendChild(newElem);
  }

  var lngElems = node.getElementsByClassName("img_new_lng");
  if(lngElems.length) {
    lngElems[0].innerHTML = "New longitude: " + image.lng.toFixed(6);
  }
  else {
    var newElem = document.createElement('div');
    newElem.setAttribute('class', 'c_img_tooltip_elem img_new_lng');
    newElem.setAttribute('data-lng', image.lng);
    newElem.innerHTML = "New longitude: " + image.lng.toFixed(6);
    tooltip.appendChild(newElem);
  }
  //console.log('actionhandler.js:updateGeoLocations was here');
}

function updateGeoTagButton() {
  var isElementTagged = false;
  var pinElems = document.getElementsByClassName("c_img_pin_tagged");
  for (var i = 0; i < pinElems.length; i++) {
    var isDisabled = false;
    for (var j = 0; j < pinElems[i].classList.length; j++) {
      if( pinElems[i].classList[j] === "c_disabled"){
        isDisabled = true;
        break;
      }
    }
    if( !isDisabled) {
      isElementTagged = true;
      break;
    }
  }

  var button = document.getElementById("id_geotag_btn");
  if( isElementTagged) {
    // show geotag button
    button.innerHTML = "Geotag";
    button.classList.remove("c_disabled");
  }
  else {
    // hide geotag button
    button.classList.add('c_disabled');
  }
}
