<?php
  ini_set('display_errors', 'On');
  error_reporting(E_ALL | E_STRICT);

  static $fileExtensions = array('jpg', 'tif', 'tiff', 'nef', 'png', 'jpeg', 'dng', 'cr2');
  static $fileExtensionsRaw = array( 'nef', 'dng', 'cr2');

  //function getRotationFromFile($realPath) {
  $retVal = Array();
  static $dir = "upload/";
  static $thumbdir = "thumbs/";

  // Open directory, and read its contents
  if (is_dir($dir)){
    if ($dh = opendir($dir)){
      while (($file = readdir($dh)) !== false){
        $fileinfo = pathinfo( $file);
        if ($file == '.' || $file == '..' || !in_array( strtolower( $fileinfo['extension']), $fileExtensions) ) {
          continue;
        }

        // return loading icon for each element, each real element will than be get by ajax request
        echo '<div class="c_img_elem">';
        echo '<img data-src="img/Loading_icon.gif" class="c_img_thumb img_loading" alt="' . $file . '" draggable="false">';
        echo '<div class="c_img_tooltip">';
        echo '<div class="c_img_tooltip_elem img_filename">' . $file . '</div>';
        echo '</div>';
        echo '</div>';

        // $tmbfile = "tmb_" .$fileinfo['filename'] . ".jpg";
        // // some simple performance optimization for testing
        // if( !in_array( strtolower( $fileinfo['extension']), $fileExtensionsRaw)) {
        //   $retVal = false;
        // }
        // elseif( false == file_exists( $thumbdir . $tmbfile)) {
        //   $cmd = "exiftool -b -PreviewImage -w \"" . $thumbdir . "tmb_%f.jpg\" \"" . $dir . $file . "\"";
        //   exec($cmd, $out, $retVal);
        // }
        // else {
        //   $retVal = true;
        // }
        //
        // $imgfile = ($retVal) ? $thumbdir . $tmbfile : $dir . $file;
        //
        // // get exif data from file
        // $output = '';
        // $cmd = "exiftool -CreateDate -exif:GPSLatitude -exif:GPSLongitude -php -c \"%+.8f\" -d \"%m/%d/%Y %H:%M:%S\" " . "\"$dir$file\"" /* . " | grep -E 'GPS Latitude\$|GPS Longitude|Create Date'"*/;
        // //echo $cmd;
        // exec($cmd, $output, $retVal);
        // // add for each image an html element with an associated tooltip
        // if (!$retVal) {
        //   // evaluate return value as php code. Due to errors some str manipulation must be done
        //   $arrayStr = implode( '', $output);
        //   //var_dump($output);
        //   $arrayStr = substr( $arrayStr, 6, strlen($arrayStr) - 6); // remove first 'Array(' from string
        //   $arrayStr = substr( $arrayStr, 0, strlen($arrayStr) - 2); // remove closing ')' from string incl. ';'
        //   // assign array to $elem variable
        //   $arrayStr = "\$elem = " . $arrayStr . ";";
        //   eval($arrayStr);
        //
        //   echo '<div class="c_img_elem">';
        //   echo '<img src="' . $imgfile . '" class="c_img_thumb" alt="' . $file . '" draggable="true" ondragstart="handleImgDragStart(event)">';
        //   echo '<img src="img/Flag1LeftBlack-icon.png" class="c_img_pin c_disabled">';
        //   echo '<img src="img/Flag1RightGreen-icon.png" class="c_img_pin_tagged c_disabled">';
        //   echo '<div class="c_img_tooltip">';
        //   echo '<div class="c_img_tooltip_elem img_filename">' . $file . '</div>';
        //   if( array_key_exists("CreateDate", $elem)) {
        //     echo '<div class="c_img_tooltip_elem img_createdate" data-date="' . $elem['CreateDate'] . '">Date: ' . $elem["CreateDate"] . '</div>';
        //   }
        //   if( array_key_exists("GPSLatitude", $elem)) {
        //     echo '<div class="c_img_tooltip_elem img_lat" data-lat="' . $elem['GPSLatitude'] . '">Latitude: ' . $elem["GPSLatitude"] . '</div>';
        //   }
        //   if( array_key_exists("GPSLongitude", $elem)) {
        //     echo '<div class="c_img_tooltip_elem img_lng" data-lng="' . $elem['GPSLongitude'] . '">Longitude: ' . $elem["GPSLongitude"] . '</div>';
        //   }
        //   echo '</div>';
        //   echo '</div>';
        //}
      }
      closedir($dh);
    }
  }
?>
