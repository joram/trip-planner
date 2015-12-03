function create_line(points){
  var flightPlanCoordinates = [];
  $.each(points, function(index, point){
    flightPlanCoordinates.push({lat: point[0], lng: point[1]});
  });

  var line = new google.maps.Polyline({
    path: flightPlanCoordinates
  });
  created_line(line);
}

function created_line(line){
  line.setMap(drawingManager.map);
  line.info_window = new google.maps.InfoWindow;
  line.setEditable(true);
  line.setDraggable(true);
  lines.push(line);

  google.maps.event.addListener(line, "dragend", updated_line);
  google.maps.event.addListener(line.getPath(), "insert_at", updated_line);
  google.maps.event.addListener(line.getPath(), "remove_at", updated_line);
  google.maps.event.addListener(line.getPath(), "set_at", updated_line);
  google.maps.event.addListener(line, "rightclick", function(event){
    close_all_info_windows();
    line.info_window.setPosition(event.latLng);
    line.info_window.open(drawingManager.map);
  });

  line.list_index = lines.indexOf(line);
  line.info_window.setContent("<div style='width:100px'><button onclick='remove_line("+line.list_index+");'>remove</button></div>");
  ajax_update_map();
}


function remove_line(list_index){
  $.each(lines, function(index, line){
    if(line.list_index == list_index){
      line.setMap(null);
      line.info_window.setMap(null);
    }
  });
  ajax_update_map();
}

function updated_line(event){
  ajax_update_map();
}
