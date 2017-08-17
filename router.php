<?php
  // router.php
  $path = pathinfo($_SERVER["SCRIPT_FILENAME"]);
  if ($path["extension"] == 'nef') {
      return TRUE;
  }
  else {
      return FALSE;
  }
?>
