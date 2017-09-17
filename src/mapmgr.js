// mapmgr.js
// @author Andreas Werner
// @date August 2017
//
// mapmgr will be used to initialize leaflet map, adding/removing gpx tracks
// and image markers

//###############################
//### Global variables        ###
//###############################

var map;
var currentPosition;
var trackLayer;
var imageLayer;
var newImageLayer;
var dropMarker;

//###############################
//### Map Element definitions ###
//###############################

// extended polyline allowing to set elevation and time for each latlng point
var MyPolyline = L.Polyline.extend({
  name: "",
  _eletime: [],
  options: {
    maxTimeDiff: 600, // defines max allowed time difference for start and end of a track in seconds
    maxDistance: 10000, // maximum distance in meter between two points to be considered as valid
  },

  _addEleTimes: function( latlngeletime) {
    var latlng = [];
    for (var i = 0; i < latlngeletime.length; i++) {
      latlng.push([latlngeletime[i][0], latlngeletime[i][1]]);
      this._eletime.push([latlngeletime[i][2], latlngeletime[i][3]]);
    }

    return latlng;
  },

  initialize: function( name, latlngeletime, options) {
    this.name = name;
    this._eletime = [];
    L.setOptions( this, options);
    L.Polyline.prototype.initialize.call(this, this._addEleTimes(latlngeletime), options);
    //L.Polyline.prototype.initialize.call(this, [[]], options);
  },

  addLatLngEleTime: function(latlngeletime) {
    L.Polyline.prototype.addLatLng.call( this, this._addEleTimes([latlngeletime])[0]);
  },

  _getClosestPointIdx: function( latlng) {
    var latlngs = L.Polyline.prototype.getLatLngs.call( this);
    var distance = [];
    for( var i = 0; i < latlngs.length; i++) {
      distance.push( latlng.distanceTo( latlngs[i]));
    }
    return distance.indexOf( Math.min.apply( null, distance));
  },

  _getClosestPointIdxFromDate: function( date) {
    var closestIdx = -1;
    var closestDate = new Date(0);
    var closestDiff = Math.abs( date - closestDate);
    for( var i = 0; i < this._eletime.length; i++) {
      var trackDiff = Math.abs( date - new Date( this._eletime[i][1]));
      if( trackDiff < closestDiff) {
        closestIdx = i;
        closestDiff = trackDiff;
      }
    }
    //console.log( "idx: " + closestIdx + " diff: " + closestDiff);
    return closestIdx;
  },

  getClosestEleTime: function( latlng) {
    return this._eletime[ this._getClosestPointIdx(latlng)];
  },

  getInterpolatedEleTimeSpeed: function( latlng) {
    var eletimespeed = [];
    var idx = this._getClosestPointIdx( latlng);
    var latlngs = L.Polyline.prototype.getLatLngs.call( this);

    // the given point might be not directly on a line segment, we have to find
    // on which segment the point matches best, given by closest segment point.
    // then a point on the segment will be calculated
    var idx2 = idx;
    if( (idx > 0) && (idx < latlngs.length - 1) ) {
      // determine segment
      var lowSegDist  = L.LineUtil.pointToSegmentDistance( map.latLngToLayerPoint(latlng), map.latLngToLayerPoint(latlngs[idx - 1]), map.latLngToLayerPoint(latlngs[idx]));
      var highSegDist = L.LineUtil.pointToSegmentDistance( map.latLngToLayerPoint(latlng), map.latLngToLayerPoint(latlngs[idx]), map.latLngToLayerPoint(latlngs[idx + 1]));
      idx2 = (lowSegDist < highSegDist) ? (idx-1) : (idx+1);
    }
    else if (idx == 0 ) {
      idx2 = idx + 1;
    }
    else {
      idx2 = idx - 1;
    }
    // get point on segment
    var ptOnSeg = map.layerPointToLatLng( L.LineUtil.closestPointOnSegment( map.latLngToLayerPoint(latlng), map.latLngToLayerPoint(latlngs[idx]), map.latLngToLayerPoint(latlngs[idx2])));
    // get normalized factor of point between both segment ends
    var dist1 = ptOnSeg.distanceTo( latlngs[idx]);
    var dist2 = ptOnSeg.distanceTo( latlngs[idx2]);
    var factor = dist1 / (dist1 + dist2);
    // determine new elevation based on elevation values of both segment ends and factor
    var newEle = Math.round((parseFloat( this._eletime[idx2][0]) - parseFloat( this._eletime[idx][0])) * factor + parseFloat( this._eletime[idx][0]));
    // dertmine new time based on time values of both segment ends and factor
    var time1 = new Date(this._eletime[idx][1]);
    var time2 = new Date(this._eletime[idx2][1]);
    var newTime = new Date( (time2.getTime() - time1.getTime()) * factor + time1.getTime());
    // dertmine segment speed
    var speed = Math.abs( (dist1 + dist2) / (time1.getTime() - time2.getTime()) * 3600);

    return [newEle, newTime, speed];
  },

  getInterpolatedLatLngFromDate: function( date, idx) {
    var time0 = new Date( this._eletime[idx][1]);
    var latlngs = L.Polyline.prototype.getLatLngs.call( this);
    var pt0 = latlngs[idx];

    if( idx > 0) {
      var time1 = new Date( this._eletime[idx - 1][1]);
      if( date > time1 && date < time0) {
        // find latlng on lower segment
        var pt1 = latlngs[idx - 1];

        var distance = ( date.getTime() - time1.getTime()) / ( time0.getTime() - time1.getTime());
        var ptResult = [ pt1.lat + distance * (pt0.lat - pt1.lat) , pt1.lng + distance * (pt0.lng - pt1.lng)];
        //console.log( "dt0: " + time0 + " dt1: " + time1 + " dt: " + date + " dist: " + distance);
        //console.log( "pt0: " + pt0 + " pt1: " + pt1 + " pt: " + ptResult);
        return new L.latLng( ptResult);
      }
    }

    if( idx + 1 < this._eletime.length) {
      var time1 = new Date( this._eletime[idx + 1][1]);
      //console.log( "top dt0: " + time0 + " dt1: " + time1 + " dt: " + date);
      if( date > time0 && date < time1) {
        // find latlng on upper segment
        var pt1 = latlngs[idx + 1];

        var distance = ( date.getTime() - time1.getTime()) / ( time0.getTime() - time1.getTime());
        var ptResult = [ pt1.lat + distance * (pt0.lat - pt1.lat) , pt1.lng + distance * (pt0.lng - pt1.lng)];
        //console.log( "top dt0: " + time0 + " dt1: " + time1 + " dt: " + date + " dist: " + distance);
        //console.log( "top pt0: " + pt0 + " pt1: " + pt1 + " pt: " + ptResult);
        return new L.latLng( ptResult);
      }
    }

    return pt0;
  },

  getLatLngFromDate: function( date) {
    var idx = this._getClosestPointIdxFromDate( date);
    if( idx == -1) {
      console.error("no track data available");
      return null;
    }

    if( idx == 0 || idx == this._eletime.length - 1) {
      var timeDiff = Math.abs( date - new Date(this._eletime[idx][1]));
      if( timeDiff > this.options.maxTimeDiff * 1000) {
        console.log("Date too far away from track date");
        return null;
      }
    }

    return this.getInterpolatedLatLngFromDate( date, idx);
  }
}); // MyPolyline

var ImgMarkerIcon = L.icon({
  iconUrl: 'img/Flag1LeftBlack-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -23]
});

var NewImgMarkerIcon = L.icon({
  iconUrl: 'img/Flag1RightGreen-icon.png',
  iconSize: [48, 48],
  iconAnchor: [24, 47],
  popupAnchor: [0, -23]
});

//###############################
//### Geolocation handling    ###
//###############################

function setCurPos(position) {
  map.setView([position.coords.latitude, position.coords.longitude], 16);
}

function onError(error) {
  var txt;
  switch (error.code) {
    case error.PERMISSION_DENIED:
      txt = "No permission to access position.";
      break;
    case error.POSITION_UNAVAILABLE:
      txt = "Position not available";
      break;
    case error.TIMEOUT:
      txt = "Position timeout.";
      break;
    default:
      txt = "Unknown position error";
  }
  console.warn(txt);
}

function setCurrentPosition(event) {
  if( event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition( setCurPos , onError);
  }
}

function updateCurPos(pos) {
  if( currentPosition) {
    // console.warn("latest pos " + pos.coords.latitude + ", " + pos.coords.longitude);
    currentPosition.setLatLng([pos.coords.latitude, pos.coords.longitude]);
  }
  else {
    currentPosition = L.marker( [pos.coords.latitude, pos.coords.longitude], {title: "your current location"}).addTo(map);
  }
}

//###############################
//### Map initialization      ###
//###############################

function initMap() {
  // map init
  var mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2NobWFlY2hlIiwiYSI6ImNqNTVmc3NvbzBvenUzM29hYW9jZXp0bG8ifQ.f9LIzhedtt9K8YwfpTcZdQ';
  attribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>';
  streetLayer =    L.tileLayer(mbUrl, {id: 'mapbox.streets', attribution: attribution});
  satLayer =       L.tileLayer(mbUrl, {id: 'mapbox.satellite', attribution: attribution});
  satStreetLayer = L.tileLayer(mbUrl, {id: 'mapbox.streets-satellite', attribution: attribution});
  outdoorsLayer =  L.tileLayer(mbUrl, {id: 'mapbox.outdoors', attribution: attribution});
  sportsLayer =    L.tileLayer(mbUrl, {id: 'mapbox.run-bike-hike', attribution: attribution});

  mapBaseLayers = {
    "Streets" : streetLayer,
    "Satellite" : satLayer,
    "Mixed" : satStreetLayer,
    "Outdoor" : outdoorsLayer,
    "Sports" : sportsLayer,
  };

  map = L.map( 'id_map', {layers: outdoorsLayer} );
  map.setView( [49.83488, 9.15214], 16);
  L.control.layers( mapBaseLayers).addTo(map);

  if(navigator.geolocation) {
    navigator.geolocation.watchPosition( updateCurPos, onError);
  }
  setCurrentPosition(null);

  trackLayer = L.featureGroup().addTo(map);
  imageLayer = L.featureGroup().addTo(map);
  newImageLayer = L.featureGroup().addTo(map);
}



function onMapClick(event) {
  var popup = L.popup();
  popup
      .setLatLng(event.latlng)
      .setContent("You clicked the map at " + event.latlng.toString())
      .openOn(map);
}


//###############################
//### GPX track handling      ###
//###############################

function removeGPXTracks() {
  if(trackLayer) {
    trackLayer.clearLayers();
  }
}

function drawGPXTrack( gpxDoc) {
  var track;

  var name = gpxDoc.getElementsByTagName("name")[0].innerHTML;
  var gpxPts = gpxDoc.getElementsByTagName("trkpt");
  for (var id = 0; id < gpxPts.length; id++) {
    var elevation = gpxPts[id].getElementsByTagName('ele')[0].innerHTML;
    var time = gpxPts[id].getElementsByTagName('time')[0].innerHTML;
    if(id == 0) {
      // first element should start line
      track = new MyPolyline( name,
                              [[ parseFloat(gpxPts[id].getAttribute('lat')),
                                 parseFloat( gpxPts[id].getAttribute('lon')),
                                 elevation,
                                 time ]],
                              { color: 'red', opacity: 0.4, weight: 7, smoothFactor: 2.0});

    }
    else {
      track.addLatLngEleTime([parseFloat( gpxPts[id].getAttribute('lat')), parseFloat( gpxPts[id].getAttribute('lon')), elevation, time],0,0);
    }
  }

  track.bindTooltip("", {sticky: true, className: "c_track_tooltip", offset: [15,0], direction: 'right'});

  track.on("mousemove", function(e) {
    var eleTimeSpeed = this.getInterpolatedEleTimeSpeed( e.latlng);
    var tooltip = getMapTooltip( new Image(this.name, "", eleTimeSpeed[1], e.latlng.lat, e.latlng.lng));

    elem = document.createElement('div');
    elem.innerHTML = "<strong>Elevation: </strong>" + eleTimeSpeed[0] + " m";
    tooltip.appendChild( elem);

    elem = document.createElement('div');
    elem.innerHTML = "<strong>Speed: </strong>" + parseFloat(eleTimeSpeed[2]).toFixed(2) + " km/h";
    tooltip.appendChild( elem);

    this.setTooltipContent( tooltip);
  });

  trackLayer.addLayer(track);
}

function showWholeTrack() {
  if( trackLayer) {
    map.fitBounds( trackLayer.getBounds());
  }
}

//###############################
//### Image marker handling   ###
//###############################

function removeImg( isNewGeoTag = false) {
  if( !isNewGeoTag) {
    imageLayer.clearLayers();
  }

  newImageLayer.clearLayers();
}

function showWholeImages() {
  if( imageLayer) {
    map.fitBounds( imageLayer.getBounds());
  }
}

function addImgToMap( lat, lng, tooltip = '', isNew = false) {
  var marker = L.marker( [lat,lng], {icon: (isNew) ? NewImgMarkerIcon : ImgMarkerIcon, riseOnHover: true});
  marker.bindTooltip( tooltip, {offset: [10,-10], direction: "right", className: "c_track_tooltip"});
  ((isNew) ? newImageLayer : imageLayer).addLayer(marker);
}

//###############################
//### Geo tagging handling    ###
//###############################

function getGeoLocation( image) {
  var latlng;
  var layer = trackLayer.getLayers();
  for (var i = 0; i < layer.length; i++) {
    latlng = layer[i].getLatLngFromDate( image.date);
    if( latlng) {
      return latlng;
    }
  }

  return null;
}

//###############################
//### drag & drop handling    ###
//###############################

function showDropPin( e) {
  //console.log("showPin");
  if( null == dropMarker) {
    dropMarker = L.marker( map.mouseEventToLatLng(e));
    // using a self defined icon will provide continous dragleave events hiding
    // the icon in leaflet 1.2. hence function was deactivated
    //dropMarker.setIcon( NewImgMarkerIcon);
    dropMarker.setOpacity(0.7);
  }
  else {
    dropMarker.setLatLng( map.mouseEventToLatLng(e));
  }

  if( false === map.hasLayer(dropMarker)) {
    dropMarker.addTo(map);
  }
}

function hideDropPin(e) {
  if( dropMarker) {
    // console.log("hideDropPin");
    dropMarker.remove();
  }

  return map.mouseEventToLatLng(e);
}
