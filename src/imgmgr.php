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
        if ($file == '.' || $file == '..' || !array_key_exists('extension', $fileinfo) || !in_array( strtolower( $fileinfo['extension']), $fileExtensions) ) {
          continue;
        }

        // return loading icon for each element, each real element will than be get by ajax request
        echo '<div class="c_img_elem">';
        echo '<img data-src="img/Loading_icon.gif" class="c_img_thumb img_loading" alt="' . $file . '" draggable="false">';
        echo '<div class="c_img_tooltip c_disabled">';
        echo '<div class="c_img_tooltip_elem img_filename">' . $file . '</div>';
        echo '</div>';
        echo '</div>';
      }
      closedir($dh);
    }
  }
?>
