<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL | E_STRICT);

static $srcDir = '../upload/';
static $destDir = '../download/';
static $linkDir = './download/';

//Make sure that it is a POST request.
if(strcasecmp($_SERVER['REQUEST_METHOD'], 'POST') != 0){
    throw new Exception('Request method must be POST!');
}

//Make sure that the content type of the POST request has been set to application/json
$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
if(strcasecmp($contentType, 'application/json;charset=UTF-8') != 0){
    throw new Exception('Content type must be: application/json;charset=UTF-8');
}

$data = json_decode( file_get_contents("php://input"), true);
//If json_decode failed, the JSON is invalid.
if(!is_array($data)){
    throw new Exception('Received content contained invalid JSON!');
}

foreach ($data as $key => $value) {
  $srcFile = $srcDir . $value['file'];
  if( file_exists( $srcFile) && array_key_exists('lat', $value) && array_key_exists('lng', $value)) {
    $latRef = ($value['lat'] < 0) ? "S" : "N";
    $lngRef = ($value['lng'] < 0) ? "W" : "E";
    $cmd = "exiftool -GPSLatitude='" . abs($value['lat']) . "' -GPSLatitudeRef='" . $latRef . "' -GPSLongitude='" . abs($value['lng']) . "' -GPSLongitudeRef='" . $lngRef . "' -o " . $destDir . " " . $srcFile;
    //echo $cmd;
    exec($cmd, $output, $retVal);
    //var_dump($output);
    if( !$retVal) {
      echo '<div>';
      echo '<a href="' . $linkDir . $value['file'] . '" download>' . $value['file'] . '</a>';
      echo '</div>';
    }
  }
}

  //var_dump($data);
  //exiftool -GPSLatitude='-14.200456' -GPSLongitude='34.9876543' -o ../download/ ../upload/IMG_20170626_125122.jpg
?>
