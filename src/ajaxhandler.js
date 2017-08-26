// ajaxhandler.js
// @author Andreas Werner
// @date August 2017
//

function sendPostRequest( url, callback, data) {
  var request = new XMLHttpRequest();
  request.open( "POST", url, true);
  request.setRequestHeader( "Content-Type", "application/json;charset=UTF-8");
  request.onreadystatechange = function() {
    if ( this.readyState == 4 && this.status == 200) {
      callback( this);
    }
  };
  request.send( data);
}

function sendGetRequest( url, callback, data) {
  var request = new XMLHttpRequest();
  request.open( "GET", url, true);
  request.onreadystatechange = function() {
    if ( this.readyState == 4 && this.status == 200) {
      callback( this, data);
    }
  };
  request.send();
}
