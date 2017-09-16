<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL | E_STRICT);

static $fileExtensions = array('jpg', 'tif', 'tiff', 'nef', 'png', 'jpeg', 'dng', 'cr2');
static $fileExtensionsRaw = array( 'nef', 'dng', 'cr2');

//function getRotationFromFile($realPath) {
// $retVal = Array();
static $dir = "../upload/";
static $dirglobal = "./upload/";
static $thumbdir = "../thumbs/";
static $thumbdirglobal = "./thumbs/";
$file = '';

if( isset($_GET['file'])) {
  $file = $dir . $_GET['file'];
}

$fileinfo = pathinfo( $file);
if( false == file_exists($file) || !in_array( strtolower( $fileinfo['extension']), $fileExtensions)) {
  echo "<div>$file not available</div>";
  return;
}

$tmbfile = "tmb_" .$fileinfo['filename'] . ".jpg";
// some simple performance optimization for testing
if( !in_array( strtolower( $fileinfo['extension']), $fileExtensionsRaw)) {
  $retVal = false;
}
elseif( false == file_exists( $thumbdir . $tmbfile)) {
  $cmd = "exiftool -b -PreviewImage -w \"" . $thumbdir . "tmb_%f.jpg\" \"" . $file . "\"";
  exec($cmd, $out, $retVal);
}
else {
  $retVal = true;
}

// determine right thumb address
$imgfile = ($retVal) ? $thumbdirglobal . $tmbfile : $dirglobal . $_GET['file'];

// get exif data from file
$output = '';
$cmd = "exiftool -CreateDate -exif:GPSLatitude -exif:GPSLongitude -php -c \"%+.8f\" -d \"%m/%d/%Y %H:%M:%S\" " . "\"$file\"";
//echo $cmd;
exec($cmd, $output, $retVal);
// add for each image an html element with an associated tooltip
if (!$retVal) {
  // evaluate return value as php code. Due to errors some str manipulation must be done
  $arrayStr = implode( '', $output);
  $arrayStr = substr( $arrayStr, 6, strlen($arrayStr) - 6); // remove first 'Array(' from string
  $arrayStr = substr( $arrayStr, 0, strlen($arrayStr) - 2); // remove closing ')' from string incl. ';'
  // assign array to $elem variable
  $arrayStr = "\$elem = " . $arrayStr . ";";
  eval($arrayStr);

  // create resulting element
  echo '<img src="' . $imgfile . '" class="c_img_thumb" alt="' . $_GET['file'] . '" draggable="true" ondragstart="handleImgDragStart(event)">';
  echo '<img src="img/Flag1LeftBlack-icon.png" class="c_img_pin c_disabled" draggable="false">';
  echo '<img src="img/Flag1RightGreen-icon.png" class="c_img_pin_tagged c_disabled" draggable="false">';
  echo '<div class="c_img_tooltip">';
  echo '<div class="c_img_tooltip_elem img_filename">' . $_GET['file'] . '</div>';
  if( array_key_exists("CreateDate", $elem)) {
    echo '<div class="c_img_tooltip_elem img_createdate" data-date="' . $elem['CreateDate'] . '">Date: ' . $elem["CreateDate"] . '</div>';
  }
  if( array_key_exists("GPSLatitude", $elem)) {
    echo '<div class="c_img_tooltip_elem img_lat" data-lat="' . $elem['GPSLatitude'] . '">Latitude: ' . $elem["GPSLatitude"] . '</div>';
  }
  if( array_key_exists("GPSLongitude", $elem)) {
    echo '<div class="c_img_tooltip_elem img_lng" data-lng="' . $elem['GPSLongitude'] . '">Longitude: ' . $elem["GPSLongitude"] . '</div>';
  }
  echo '</div>';
}

?>
