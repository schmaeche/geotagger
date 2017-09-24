// imagelist.js
// @author Andreas Werner
// @date September 2017
//

var Image = function(){
  this.filename = "";
  this.url = "";
  this.originalDate = new Date(0);
  this.newDate = new Date(0);
  this.originalLat = .0;
  this.originalLng = .0;
  this.newLat = .0;
  this.newLng = .0;
};


var GTimageList = {
  /******************************************************************************
   helper functions
  ******************************************************************************/
  // gets a Image object from the given list node
  getImageFromElement: function(node) {
    var image = new Image();
    // set filename (mandatory element)
    image.filename = node.getElementsByClassName("img_filename")[0].innerHTML;
    // set url (mandatory element)
    image.url = node.getElementsByClassName("c_img_thumb")[0].src;
    // set date (optional element)
    var dateElem = node.getElementsByClassName("img_createdate");
    if( dateElem.length) {
      image.originalDate = new Date( dateElem[0].dataset.date);
    }
    // set latitude and longitude (optional elements)
    var latElem = node.getElementsByClassName("img_lat");
    var lngElem = node.getElementsByClassName("img_lng");
    if( latElem.length && lngElem.length) {
      image.originalLat = parseFloat( latElem[0].dataset.lat);
      image.originalLng = parseFloat( lngElem[0].dataset.lng);
    }
    latElem = node.getElementsByClassName("img_new_lat");
    lngElem = node.getElementsByClassName("img_new_lng");
    if( latElem.length && lngElem.length) {
      image.newLat = parseFloat( latElem[0].dataset.lat);
      image.newLng = parseFloat( lngElem[0].dataset.lng);
    }

    return image;
  },

  /******************************************************************************
   image interaction functions
  ******************************************************************************/
  // toggles selection of image, special keys will be evaluated for multiple select
  toggleImageSelect: function(e) {
    if( e.currentTarget.classList.contains("select")) {
      e.currentTarget.classList.remove("select");
    }
    else {
      if( !e.ctrlKey && !e.metaKey) {
        var selectElems = document.getElementsByClassName("select");
        while (selectElems.length) {
          selectElems[0].classList.remove("select");
        }
      }

      e.currentTarget.classList.add("select");
    }
  },

  /******************************************************************************
   dragging functions
  ******************************************************************************/

  // sets relevant parameter when an image will be draged
  handleImgDragStart: function(e) {
    e.currentTarget.classList.add("select");
    var files = [];
    var selectElems = document.getElementsByClassName("select");
    for (var i = 0; i < selectElems.length; i++) {
      files.push(selectElems[i].parentNode.getElementsByClassName("img_filename")[0].innerHTML);
    }

    e.dataTransfer.setData('application/json', JSON.stringify(files));
    e.dataTransfer.setDragImage( e.currentTarget, -20, 125);
  },

  // handles drag end of an image drag operation
  handleImgDragEnd: function(e) {
  },

  /******************************************************************************
  DOM interaction functions
  ******************************************************************************/

  // updates image tooltip with new geo location
  updateImageTooltipLatLng: function( node, image) {
    // show pin icon on image when lat and lng are set for image
    var pinElem = node.getElementsByClassName("c_img_pin_tagged")[0];
    pinElem.className = pinElem.className.replace('c_disabled', '');
    var tooltip = node.getElementsByClassName("c_img_tooltip")[0];

    var latElems = node.getElementsByClassName("img_new_lat");
    if(latElems.length) {
      latElems[0].setAttribute('data-lat', image.newLat);
      latElems[0].innerHTML = "New latitude: " + image.newLat.toFixed(6);
    }
    else {
      var newElem = document.createElement('div');
      newElem.setAttribute('class', 'c_img_tooltip_elem img_new_lat');
      newElem.setAttribute('data-lat', image.newLat);
      newElem.innerHTML = "New latitude: " + image.newLat.toFixed(6);
      tooltip.appendChild(newElem);
    }

    var lngElems = node.getElementsByClassName("img_new_lng");
    if(lngElems.length) {
      lngElems[0].setAttribute('data-lng', image.newLng);
      lngElems[0].innerHTML = "New longitude: " + image.newLng.toFixed(6);
    }
    else {
      var newElem = document.createElement('div');
      newElem.setAttribute('class', 'c_img_tooltip_elem img_new_lng');
      newElem.setAttribute('data-lng', image.newLng);
      newElem.innerHTML = "New longitude: " + image.newLng.toFixed(6);
      tooltip.appendChild(newElem);
    }
  },

  /******************************************************************************
   ajax functions
  ******************************************************************************/

  _retrieveImage: function( node) {
    node.setAttribute("src", node.getAttribute("data-src"));
    node.onload = function() {
      this.removeAttribute("data-src");
    };
    var filename = node.getAttribute("alt");
    GTajax.sendGetRequest( "src/updateimages.php?file=" + filename, this._updateImageElement, filename)
  },

  _updateImageElement: function( request, file) {
    var images = document.getElementsByClassName("c_img_elem");
    for (var i = 0; i < images.length; i++) {
      var loading = images[i].getElementsByClassName("img_loading");
      // there should be only one element for each file hence we break after triggering next image request
      if( loading.length && loading[0].alt === file) {
        images[i].innerHTML = request.responseText;
        showImageOnMap( images[i], GEO_LOC_ORIGINAL | GEO_LOC_NEW);
        if( false === GTimageList.getNextImage()) {
          // zoom to all elements only once after all images have been loaded
          GTmap.showWholeImages(LAYER_GEO_ORIG);
        }
        break;
      }
    }
  },

  // triggers download of next image from server and shows it in browser on response
  getNextImage: function() {
    var images = document.getElementsByClassName("img_loading");
    if( images.length) {
      this._retrieveImage(images[0]);
      return true;
    }
    return false;
  },
};
