<!DOCTYPE html>
<html>
<head>
  <title>Geotagger v0.02</title>
  <meta charset="utf-8" />

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.1.0/dist/leaflet.css"
   integrity="sha512-wcw6ts8Anuw10Mzh9Ytw4pylW8+NAD4ch3lqm9lzAsTxg0GFeJgoAtxuCLREZSC5lUXdVyo/7yfsqFjQ4S+aKw=="
   crossorigin=""/>
  <link rel="stylesheet" href="geotag.css" />
  <!-- link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" -->
  <script src="https://unpkg.com/leaflet@1.1.0/dist/leaflet.js"
   integrity="sha512-mNqn2Wg7tSToJhvHcqfzLMU6J4mkOImSPTxVZAdo+lcPlk+GhZmYgACEe0x35K7YzW1zJ7XyJV/TT1MrdXvMcA=="
   crossorigin="">
  </script>
  <script src="src/mapmgr.js"></script>
  <script src="src/filemgr.js"></script>
  <script src="src/actionhandler.js"></script>
  <script src="src/ajaxhandler.js"></script>
</head>

<body onload="initialize()">
  <h1>Geotagger v0.02</h1>
  <div class="c_drop_container">
    <button id="id_gpx_btn" class="c_drop_button c_disabled" onclick="removeGPX(event)">Remove GPX files</button>
    <button id="id_geotag_btn" class="c_drop_button c_disabled" onClick="setGeotag(event)">Geotag</button>
    <div id="id_gpx_drop_zone" class="c_drop_zone" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleFileSelect(event)">Drop GPX file(s) here</div>
  </div>
	<output id="id_gpx_list"></output>
  <!--div class="c_drop_container">
    <span id="id_img_drop_zone" class="c_drop_zone" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleFileSelect(event)">Drop Images here</span>
  </div -->
  <div class="c_time_input">
    <h2>Image time correction:</h2>
    <output id="id_range_time_out" value="0">+00:00:00 hrs</output>
    <?php
    $currentTimezone = 0;
    if (isset($_GET['offset'])) {
      $currentTimezone = $_GET['offset'] * 60;
    }

    $houradjust = array();
    for ($i = -12 * 3600; $i < 15*3600; $i += 3600) {
      $houradjust[$i] = $i + $currentTimezone;
    }
    // View
    echo '<div>';
    echo '<label for="id_hour_offset">Hour adjustment</label>';
    echo '<select id="id_hour_offset" onchange="updateAdjustment(event)">';
    foreach($houradjust as $timezone => $name)
    {
      $select = ($name == 0) ? 'selected="selected"' : '';
      $txt = (($name >= 0) ? '+' : '') . ($name / 3600) . ' hour' . (( $name < -3600 || $name > 3600) ? 's' : '');
      echo '<option value="' . $name . '" ' . $select . '>' . $txt . '</option>' . "\n";
    }
    echo '</select></div>';
    ?>
    <form oninput="updateAdjustment(event)">
      <label for="id_range_time">Second adjustment</label>
      <input type="range" id="id_range_time" class="c_range_time" min="-348" max="348" step="1" value="0" list="tickmarks">
    </form>
  </div>
  <div id="id_map" style="height: 300px"></div>
  <div id="id_img_list">
    <!--h2>Images</h2-->
    <?php include 'src/imgmgr.php'; ?>
  </div>
  <div id="id_img_download" class="c_img_download">
    <h2>Download tagged images</h2>
  </div>
</body>
</html>
