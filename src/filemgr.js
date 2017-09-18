// mapmgr.js
// @author Andreas Werner
// @date August 2017
//
// handles GPX and image drag and drop file input


// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser. Please try to reload with different one, e.g. Firefox or Safari');
}

function handleGPXFiles(evt) {
  // @TODO keep FileReader to remove from memory later on
  var files = evt.dataTransfer.files; // FileList object.

  if( !files[0]) {
    console.warn("no file dropped");
  }
  // files is a FileList of File objects. List some properties.
  for(var i = 0, f; f = files[i]; i++) {
    var reader = new FileReader();

    reader.onload = ( function(f) {
      return function(e) {
        var gpxParser = new DOMParser();
        gpxDoc = gpxParser.parseFromString(e.target.result,"text/xml");
        var elem = gpxDoc.getElementsByTagName("gpx");

        // handle valid gpx files only
        if(elem.length) {
          // create new div element and add it to the dom tree
          var listentry = document.createElement('div');
          var fileName = document.createElement('strong');
          fileName.innerHTML = f.name;
          listentry.appendChild( fileName );
          var additionalInfo = " (" + (f.size || "n/a") + "bytes)";
          listentry.append(additionalInfo);
          document.getElementById('id_gpx_list').appendChild(listentry);
          // show remove button
          var btn = document.getElementById('id_gpx_btn');
          btn.className = btn.className.replace('c_disabled', '');
          // draw track in map
          GTmap.drawGPXTrack(gpxDoc);
          // zoom to track on map
          GTmap.showWholeTrack();
          // find matching images on track and set location
          updateGeoLocations();
        }
      }
    })(f);

    reader.readAsText(f);
  }
}

function handleImageFiles(evt) {
  // @TODO upload files to server
  // @TODO keep FileReader to remove from memory later on
  var files = evt.dataTransfer.files; // FileList object.

  if( !files[0]) {
    console.warn("no file dropped");
  }
  //console.log("was here");
  for( var i = 0, f; f = files[i]; i++) {
    var readerImg = new FileReader();

    readerImg.onload = (function(file) {
      return function(e) {

        var img = document.createElement('img');
        img.src = e.target.result;
        img.className = "c_img_thumb";
        img.title = file.name;
        img.draggable = "true";
        img.ondragstart = "handleImgDragStart(event)";

        document.getElementById('id_img_list').appendChild(img);
      };
    })(f);
    readerImg.readAsDataURL( f);
  } // for
}

function handleImageFilesLocalhost(evt) {
  console.log("hello");
  var files = evt.dataTransfer.files;
  if(files.length) {
    var data = JSON.stringify(files);
  }
  // for (var i = 0; i < files.length; i++) {
  //   files[i];
  // }
}

function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  if( evt.target == document.getElementById('id_gpx_drop_zone')) {
    handleGPXFiles(evt);
  }
  else if (evt.target == document.getElementById('id_img_drop_zone')) {
    // for localhost files can be accessed directly otherwise an upload is needed
    if( window.location.hostname === "localhost") {
      handleImageFilesLocalhost(evt);
    }
    else {
      handleImageFiles(evt);
    }
  }
  else if (evt.target == document.getElementById('id_file_select') ) {
    handleImageFilesLocalhost( evt);
  }
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function handleDragLeave(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'none';
}

function handleImgDragStart(evt) {
  evt.dataTransfer.setData("text", evt.target.id);
}

function removeGPX(e) {
  GTmap.removeGPXTracks();
  document.getElementById('id_gpx_list').innerHTML = '';
  document.getElementById('id_gpx_btn').className += " c_disabled";
  // @TODO remove uploaded files as well
}
