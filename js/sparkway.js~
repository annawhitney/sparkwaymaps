/**
 * sparkway.js
 *
 * Anna Whitney
 * Computer Science 50
 * Final Project
 *
 * Implements an electric vehicle route planner.
 */

// constant for converting ranges in miles to meters
var MILES_TO_METERS = 1609;

// list of supported vehicles and their ranges
var cars = {
    "volt": {range: 37},
    "spark": {range: 82},
    "tango": {range: 200},
    "fiat": {range: 87},
    "karma": {range: 230},
    "focus": {range: 76},
    "cmax": {range: 21},
    "fusion": {range: 21},
    "fit": {range: 82},
    "mitsubishi": {range: 62},
    "leaf": {range: 75},
    "smart": {range: 68},
    "smith": {range: 100},
    "models_short": {range: 208},
    "models_long": {range: 265},
    "roadster": {range: 244},
    "rav4": {range: 100},
    "prius": {range: 15},
    "wheego": {range: 100}
};


// initialize directions service
var directionsService = new google.maps.DirectionsService();

// global variable for directions display
var directionsDisplay;

// global variable for map
var map;

// global variable for waypoints array
var waypoints = [];

// global variable for station stops array
var stationStops = [];

// global variable for markers array
var markers = [];

// global variable for station markers array
var stationMarkers = [];

// global variable for info windows array
var infoWindows = [];

// global variable for range
var range = null;

// global variable for stations array
var stations = [];

// global variable for indicating whether stations JSON is loaded yet
var importedStations = false;

// global variable for counting clicks on the map
var clicks = 0;

// initialize page on window load
$(window).load(function() {

    // create new directions renderer object
    directionsDisplay = new google.maps.DirectionsRenderer;

    // load map
    mapLoad();

    // attach map to directions renderer
    directionsDisplay.setMap(map);

    // attach panel for listing directions to directions renderer
    directionsDisplay.setPanel($('#panel')[0]);

    // set directions renderer options
    directionsDisplay.setOptions({
        suppressInfoWindows: true,
        suppressMarkers: false,
        markerOptions: {
            clickable: true,
            zIndex: 2
        }
    });

    // listen for first click on the map
    google.maps.event.addListener(map, 'click', function(event) {
        setOriginDestination(event.latLng.toUrlValue());
    });
    
    // listen for opening of stations modal
    $('#options-link').click(function(event) {

        // if we haven't imported the stations JSONs yet
        if (importedStations === false) {

            // import them
            scriptImport('/js/all_stations-min.js');
            scriptImport('/js/fast_stations-min.js');
            scriptImport('/js/j1772_stations-min.js');
            scriptImport('/js/slow_stations-min.js');
            scriptImport('/js/other_stations-min.js');

            // don't do it again
            importedStations = true;
        }
    });

    // listen for click on get route button
    $('#getroute').click(function(event) {

        // get user's route
        mapsQuery();
    });

});

/**
 * Loads the map displaying the entire United States.
 */
function mapLoad() {

    // define starting center of map as center of contiguous US
    var center = new google.maps.LatLng(39.828182,-98.579144);

    // define map options to show roughly entire US
    var mapOptions = {
        zoom: 4,
        center: center
    }

    // create new map
    map = new google.maps.Map($('#map-canvas')[0], mapOptions);
}

/**
 * Sets the origin or destination box to show the location of a click.
 */
function setOriginDestination(location_value) {

    // if even number of clicks (zero-indexed)
    if (clicks % 2 == 0) {

        // put location of click in origin box
        $('#origin').val(location_value);
    }
    
    // if odd number of clicks
    else {

        // put location of click in destination box
        $('#destination').val(location_value);
    }

    // count click
    clicks++;
}

/**
 * Turns user-submitted options into a request to the Google Maps API.
 */
function mapsQuery() {

    // clear stations array from previous query
    stations = [];

    // clear station markers from previous query from the map
    for (var i = 0, n = stationMarkers.length; i < n; i++) {

        // remove marker from map
        stationMarkers[i].setMap(null);
    }
    stationMarkers = [];

    // clear info windows from previous query from the map
    for (var i = 0, n = infoWindows.length; i < n; i++) {

        // remove info window from map
        infoWindows[i].close();
    }
    infoWindows = [];

    // clear directions from previous query
    directionsDisplay.setDirections({routes: []});

    // clear waypoints array from previous query
    waypoints = [];

    // clear station stops array from previous query
    stationStops = [];

    // clear markers array from previous query
    markers = [];

    // clear any warnings from previous query
    $('#warning').html("");
    $('#warning').removeClass("shadow warning-container");

    // if all four boxes checked
    if ($('#dcfast')[0].checked && $('#j1772')[0].checked && $('#slow')[0].checked && $('#other')[0].checked) {

        // use full list of stations
        stations = ALL_STATIONS;
    }

    // else determine which stations to include
    else {

        // include DC Fast stations in stations array if user checked the "DC Fast stations" box
        stations = ($('#dcfast')[0].checked)?FAST_STATIONS:[]; 

        // add J1772 stations to stations array if user checked the "J1772 stations" box
        stations = ($('#j1772')[0].checked)?stations.concat(J1772_STATIONS):stations;

        // add 110V stations to stations array if user checked the "110V stations" box
        stations = ($('#slow')[0].checked)?stations.concat(SLOW_STATIONS):stations;

        // add other stations to stations array if user checked the "other stations" box
        stations = ($('#other')[0].checked)?stations.concat(OTHER_STATIONS):stations;
    }

    // if no station boxes checked
    if (stations.length == 0) {

        // inform user
        alert("You must include at least one charger type in your search.");
    }

    // add markers for stations to the map
    for (var i = 0, n = stations.length; i < n; i++) {
        
        // turn latitude/longitude into format Maps can use
        var stationLoc = new google.maps.LatLng(stations[i].lat, stations[i].lng);

        // get image for marker
        var image = 'http://labs.google.com/ridefinder/images/mm_20_orange.png';

        // create title for marker
        var title = stations[i].station_name + ', ' + stations[i].street_address;

        // add marker to map
        var marker = new google.maps.Marker({
            position: stationLoc,
            icon: image,
            title: title,
            map: map,
            zIndex: 1
        });

        // add marker to station markers array
        stationMarkers.push(marker);
    }

    // if user provided estimated range
    if ($('#range')[0].value && ($('#range')[0].value > 0)) { 

        // use provided range
        range = $('#range')[0].value * MILES_TO_METERS;
    }
    
    // else if user provided a car type
    else if ($('#cars')[0].value) {

        // use estimated range on file for that car
        range = cars[$('#cars')[0].value].range * MILES_TO_METERS;
    }

    // else user provided neither car type nor range
    else {

        // remind user to enter either range or car type
        alert("You must provide either a car type or an estimated range.");

        // skip the rest of the function
        return;
    }

    // check if origin and destination provided
    if ($('#origin')[0].value && $('#destination')[0].value) {

        // use provided origin
        origin = $('#origin')[0].value;

        // use provided destination
        destination = $('#destination')[0].value;
    }
    else {

        // remind user to enter both origin and destination
        alert("You must provide an origin and a destination.");

        // skip the rest of the function
        return;
    }

    // define directions request parameters
    originalRequest = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
    };

    // send directions request
    directionsCalc();
}

/**
 * Sends a directions request to the Maps API and determines whether further
 * processing is needed.
 */
function directionsCalc() {

    // send request with callback function
    directionsService.route(originalRequest, function(result, status) {

        // if the service returns a valid response
        if (status == google.maps.DirectionsStatus.OK) {
            
            // if the total route distance is longer than range
            if (result.routes[0].legs[0].distance.value > range) {

                // create array of charging station waypoints
                createWaypoints(result);

                // add waypoints to new directions request
                newRequest = {
                    origin: origin,
                    destination: destination,
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.IMPERIAL,
                    waypoints: waypoints
                }

                // send new directions request
                directionsService.route(newRequest, function(newResult, newStatus){
                    
                    // do additional processing on result
                    additionalPass(newResult, newStatus)
                });
            }

            // otherwise no modifications need to be made
            else {
               
                // check if route is longer than 85% of range
                warnLong(result);

                // display route
                directionsDisplay.setDirections(result);
            }
        }

        // handle errors returned by the Maps API
        else {
           
            handleErrors(status);
        }
    });
}

/**
 * Finds charging stations at regular intervals along the route and turns them into
 * waypoints for the route.
 */
function createWaypoints(result) {

    // turn overview path of route into polyline
    var pathPolyline = new google.maps.Polyline({
        path: result.routes[0].overview_path
    });

    // get points at intervals of 85% of range along overview path of route
    var points = pathPolyline.GetPointsAtDistance(0.85 * range);

    // iterate over these points
    for (var i = 0, n = points.length; i < n; i++) {

        // find the closest charging station to that point
        var closeStation = getClosestStation(points[i]);

        // create waypoint at that station
        var newWaypoint = {
            location: closeStation.latlng,
            stopover: true
        };

        // add it to the waypoints array
        waypoints.push(newWaypoint);

        // add station info to station stops array
        stationStops.push(closeStation);

        // create invisible marker
        var marker = new google.maps.Marker({
            position: closeStation.latlng,
            map: map,
            icon: 'img/invisible.png',
            zIndex: 3,
        });

        // add to markers array
        markers.push(marker);
    }
}

/**
 * Finds the station in the current stations array that is closest to a given point.
 */
function getClosestStation(point) {
    
    // initialize empty distances array
    var distances = [];

    // initialize variable to hold index of closest station
    var closest = -1;

    // initialize variable to hold location of station being measured
    var stationLoc = null;

    // iterate over stations array
    for (var i = 0, n = stations.length; i < n; i++) {

        // turn station location into format Maps can use
        stationLoc = new google.maps.LatLng(stations[i].lat, stations[i].lng);

        // distance from station to point
        var d = google.maps.geometry.spherical.computeDistanceBetween(point, stationLoc);

        // add distance to distances array
        distances.push(d);

        // if this station is the closest we've found so far
        if (closest == -1 || d < distances[closest]) {

            // set closest to the index of the current station
            closest = i;
        }
    }

    // return closest station and location in a format Maps can use
    var closestLocation = new google.maps.LatLng(stations[closest].lat, stations[closest].lng);
    return {station: stations[closest], latlng: closestLocation};
}

/**
 * Checks if route needs any more changes after first round of waypoints were added;
 * if so, sends another request to the Maps API and runs recursively until the route
 * is acceptable.
 */
function additionalPass(result, status) {

    // if Maps returns a valid response
    if (status == google.maps.DirectionsStatus.OK) {
        
        // initialize variable for checking if route needs any changes
        var needsCorrection = false;

        // iterate over legs of route
        for (var i = 0, n = result.routes[0].legs.length; i < n; i++) {

            var legLength = result.routes[0].legs[i].distance.value;

            // if leg is longer than range
            if (legLength > range) {

                // create new polyline for this leg
                var polyline = new google.maps.Polyline({ path: [] });

                // iterate over steps of the leg
                for (var j = 0, m = result.routes[0].legs[i].steps.length; j < m; j++) {

                    // iterate over segments of step
                    for (var k = 0, l = result.routes[0].legs[i].steps[j].path.length; k < l; k++) {

                        // add segment to polyline
                        polyline.getPath().push(result.routes[0].legs[i].steps[j].path[k]);
                    }
                }
            
                // find point 75% of range along this line
                var nextPoint = polyline.GetPointAtDistance(0.75 * range);

                // get closest station to halfway point
                var newStation = getClosestStation(nextPoint);
                
                // create waypoint at that station
                var newWaypoint = {
                    location: newStation.latlng,
                    stopover: true
                }

                // add to waypoints array
                waypoints.push(newWaypoint);

                // add station to station stops array
                stationStops.push(newStation);

                // create invisible marker
                var marker = new google.maps.Marker({
                    position: stationStops[i].latlng,
                    map: map,
                    icon: 'img/invisible.png',
                    zIndex: 3,
                });

                // add to markers array
                markers.push(marker);

                // indicate that route needs correction
                needsCorrection = true;
            }
        }

        // if route needs correction
        if (needsCorrection == true) {

            // create new directions request
            var nextRequest = {
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.IMPERIAL,
                waypoints: waypoints,
                optimizeWaypoints: true
            }

            // send new directions request
            directionsService.route(nextRequest, function(nextResult, nextStatus) {

                // try again
                additionalPass(nextResult, nextStatus)
            });
        }

        // otherwise our route is fine as is
        else {

            // check for legs longer than 85% of range
            warnLong(result);

            // create a clickable info window for each waypoint
            createInfoWindows();

            // display route
            directionsDisplay.setDirections(result);
        }
    }
    
    // handle errors returned by the Maps API
    else {
        
        handleErrors(status);
    }
}

/**
 * Creates an info window with more details for each charging station the route stops at,
 * and binds them to a click on each station.
 */
function createInfoWindows() {

    // iterate over station stops array
    for (var i = 0, n = stationStops.length; i < n; i++) {

        // get network info about station, if any
        var network = (stationStops[i].station.ev_network == null)?'--':stationStops[i].station.ev_network;

        // get intersection directions, if any
        var intersectDirections = (stationStops[i].station.intersection_directions == null)?'No specific directions available.':stationStops[i].station.intersection_directions;

        // get charger types
        var chargerTypes = (stationStops[i].station.ev_dc_fast_num)?'DC Fast':'';
        chargerTypes = (stationStops[i].station.ev_level2_evse_num)?chargerTypes.concat(' J1772'):chargerTypes;
        chargerTypes = (stationStops[i].station.ev_level1_evse_num)?chargerTypes.concat(' 110V'):chargerTypes;
        chargerTypes = (stationStops[i].station.ev_other_evse)?chargerTypes.concat(' ' + stationStops[i].station.ev_other_evse):chargerTypes;

        // create HTML string with station details
        var detailsString = '<div class="info-window">' +
            '<h1 class="info-header">' + stationStops[i].station.station_name + '</h1>' +
            '<strong>Open:</strong> ' + stationStops[i].station.access_days_time + '</br>' +
            '<strong>Use info:</strong> ' + stationStops[i].station.groups_with_access_code + '</br>' +
            '<strong>Network:</strong> ' + network + '</br>' +
            '<strong>Charger types:</strong> ' + chargerTypes + '</br>' +
            '<strong>Find it:</strong> ' + intersectDirections + '</br>' +
            '</div>';

        // create info window corresponding to station
        var infowindow = new google.maps.InfoWindow({
            content: detailsString,
            maxWidth: 250,
            pixelOffset: new google.maps.Size(0, 0)
        });

        // add to info windows array
        infoWindows.push(infowindow);
    }

    // iterate over markers array
    for (var i = 0, n = markers.length; i < n; i++) {

        // create click listener for marker
        google.maps.event.addListener(markers[i], 'click', (function(i) {

            return function () {

                // put info window on the map
                infoWindows[i].open(map, markers[i]);
            };
        })(i));
    }
}

/**
 * Checks if any leg of the returned route is longer than 85% of the provided range,
 * and asks the user if they want to recalculate if so.
 */
function warnLong(directions) {

    // initialize variable for checking if we need to warn
    var warnUser = false;

    // make warning box pretty
    $('#warning').addClass("shadow warning-container");

    // iterate over legs
    for (var i = 0, n = directions.routes[0].legs.length; i < n; i++) {

        // if longer than 85% of range
        if (directions.routes[0].legs[i].distance.value > 0.85 * range) {

            // we will need to warn user
	    warnUser = true;
        }
	}

    // check if we need to warn user
    if (warnUser == true) {

        // warn user
        $('#warning').html("Using a range of " + Math.round(range / MILES_TO_METERS) + " mi, there is at least one leg of this trip longer than 85% of your range. If you don't want to cut it that close, you can <a href=\"javascript:void(0)\" onclick=\"recalculate();\">recalculate</a>.");
    }
    else {

        // tell user what range was used
        $('#warning').html("Using a range of " + Math.round(range / MILES_TO_METERS) + " mi.");
    }
}

/**
 * Resets the route and tries again with 85% of the previous range.
 */
function recalculate() {

    // clear warning
    $('#warning').html("");
    $('#warning').removeClass("shadow warning-container");

    // reset waypoints array
    waypoints = [];

    // reset station stops array
    stationStops = [];

    // reset markers array
    markers = [];

    // reset info windows array
    infoWindows = [];

    // reset range
    range = 0.85 * range;

    // send request
    directionsCalc();
}

/**
 * Informs user of any error codes returned by the Maps API.
 */
function handleErrors(status) {
 
    // inform user of error
    $('#warning').addClass("shadow warning-container");
    $('#warning').html("We're sorry, we couldn't process your request. It returned an error code of " + status + ".");
}

/*********************************************************************\
*                                                                     *
* epolys.js                                          by Mike Williams *
* updated to API v3                                  by Larry Ross    *
*                                                                     *
* A Google Maps API Extension                                         *
*                                                                     *
* Adds various Methods to google.maps.Polygon and google.maps.Polyline *
*                                                                     *
* .Contains(latlng) returns true is the poly contains the specified   *
*                   GLatLng                                           *
*                                                                     *
* .Area()           returns the approximate area of a poly that is    *
*                   not self-intersecting                             *
*                                                                     *
* .Distance()       returns the length of the poly path               *
*                                                                     *
* .Bounds()         returns a GLatLngBounds that bounds the poly      *
*                                                                     *
* .GetPointAtDistance() returns a GLatLng at the specified distance   *
*                   along the path.                                   *
*                   The distance is specified in metres               *
*                   Reurns null if the path is shorter than that      *
*                                                                     *
* .GetPointsAtDistance() returns an array of GLatLngs at the          *
*                   specified interval along the path.                *
*                   The distance is specified in metres               *
*                                                                     *
* .GetIndexAtDistance() returns the vertex number at the specified    *
*                   distance along the path.                          *
*                   The distance is specified in metres               *
*                   Returns null if the path is shorter than that      *
*                                                                     *
* .Bearing(v1?,v2?) returns the bearing between two vertices          *
*                   if v1 is null, returns bearing from first to last *
*                   if v2 is null, returns bearing from v1 to next    *
*                                                                     *
*                                                                     *
***********************************************************************
*                                                                     *
*   This Javascript is provided by Mike Williams                      *
*   Blackpool Community Church Javascript Team                        *
*   http://www.blackpoolchurch.org/                                   *
*   http://econym.org.uk/gmap/                                        *
*                                                                     *
*   This work is licenced under a Creative Commons Licence            *
*   http://creativecommons.org/licenses/by/2.0/uk/                    *
*                                                                     *
***********************************************************************
*                                                                     *
* Version 1.1       6-Jun-2007                                        *
* Version 1.2       1-Jul-2007 - fix: Bounds was omitting vertex zero *
*                                add: Bearing                         *
* Version 1.3       28-Nov-2008  add: GetPointsAtDistance()           *
* Version 1.4       12-Jan-2009  fix: GetPointsAtDistance()           *
* Version 3.0       11-Aug-2010  update to v3                         *
*                                                                     *
\*********************************************************************/

// === first support methods that don't (yet) exist in v3
google.maps.LatLng.prototype.distanceFrom = function(newLatLng) {
  var EarthRadiusMeters = 6378137.0; // meters
  var lat1 = this.lat();
  var lon1 = this.lng();
  var lat2 = newLatLng.lat();
  var lon2 = newLatLng.lng();
  var dLat = (lat2-lat1) * Math.PI / 180;
  var dLon = (lon2-lon1) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = EarthRadiusMeters * c;
  return d;
}

google.maps.LatLng.prototype.latRadians = function() {
  return this.lat() * Math.PI/180;
}

google.maps.LatLng.prototype.lngRadians = function() {
  return this.lng() * Math.PI/180;
}

// === A method for testing if a point is inside a polygon
// === Returns true if poly contains point
// === Algorithm shamelessly stolen from http://alienryderflex.com/polygon/ 
google.maps.Polygon.prototype.Contains = function(point) {
  var j=0;
  var oddNodes = false;
  var x = point.lng();
  var y = point.lat();
  for (var i=0; i < this.getPath().getLength(); i++) {
    j++;
    if (j == this.getPath().getLength()) {j = 0;}
    if (((this.getPath().getAt(i).lat() < y) && (this.getPath().getAt(j).lat() >= y))
    || ((this.getPath().getAt(j).lat() < y) && (this.getPath().getAt(i).lat() >= y))) {
      if ( this.getPath().getAt(i).lng() + (y - this.getPath().getAt(i).lat())
      /  (this.getPath().getAt(j).lat()-this.getPath().getAt(i).lat())
      *  (this.getPath().getAt(j).lng() - this.getPath().getAt(i).lng())<x ) {
        oddNodes = !oddNodes
      }
    }
  }
  return oddNodes;
}

// === A method which returns the approximate area of a non-intersecting polygon in square metres ===
// === It doesn't fully account for spherical geometry, so will be inaccurate for large polygons ===
// === The polygon must not intersect itself ===
google.maps.Polygon.prototype.Area = function() {
  var a = 0;
  var j = 0;
  var b = this.Bounds();
  var x0 = b.getSouthWest().lng();
  var y0 = b.getSouthWest().lat();
  for (var i=0; i < this.getPath().getLength(); i++) {
    j++;
    if (j == this.getPath().getLength()) {j = 0;}
    var x1 = this.getPath().getAt(i).distanceFrom(new google.maps.LatLng(this.getPath().getAt(i).lat(),x0));
    var x2 = this.getPath().getAt(j).distanceFrom(new google.maps.LatLng(this.getPath().getAt(j).lat(),x0));
    var y1 = this.getPath().getAt(i).distanceFrom(new google.maps.LatLng(y0,this.getPath().getAt(i).lng()));
    var y2 = this.getPath().getAt(j).distanceFrom(new google.maps.LatLng(y0,this.getPath().getAt(j).lng()));
    a += x1*y2 - x2*y1;
  }
  return Math.abs(a * 0.5);
}

// === A method which returns the length of a path in metres ===
google.maps.Polygon.prototype.Distance = function() {
  var dist = 0;
  for (var i=1; i < this.getPath().getLength(); i++) {
    dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i-1));
  }
  return dist;
}

// === A method which returns the bounds as a GLatLngBounds ===
google.maps.Polygon.prototype.Bounds = function() {
  var bounds = new google.maps.LatLngBounds();
  for (var i=0; i < this.getPath().getLength(); i++) {
    bounds.extend(this.getPath().getAt(i));
  }
  return bounds;
}

// === A method which returns a GLatLng of a point a given distance along the path ===
// === Returns null if the path is shorter than the specified distance ===
google.maps.Polygon.prototype.GetPointAtDistance = function(metres) {
  // some awkward special cases
  if (metres == 0) return this.getPath().getAt(0);
  if (metres < 0) return null;
  if (this.getPath().getLength() < 2) return null;
  var dist=0;
  var olddist=0;
  for (var i=1; (i < this.getPath().getLength() && dist < metres); i++) {
    olddist = dist;
    dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i-1));
  }
  if (dist < metres) {
    return null;
  }
  var p1= this.getPath().getAt(i-2);
  var p2= this.getPath().getAt(i-1);
  var m = (metres-olddist)/(dist-olddist);
  return new google.maps.LatLng( p1.lat() + (p2.lat()-p1.lat())*m, p1.lng() + (p2.lng()-p1.lng())*m);
}

// === A method which returns an array of GLatLngs of points a given interval along the path ===
google.maps.Polygon.prototype.GetPointsAtDistance = function(metres) {
  var next = metres;
  var points = [];
  // some awkward special cases
  if (metres <= 0) return points;
  var dist=0;
  var olddist=0;
  for (var i=1; (i < this.getPath().getLength()); i++) {
    olddist = dist;
    dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i-1));
    while (dist > next) {
      var p1= this.getPath().getAt(i-1);
      var p2= this.getPath().getAt(i);
      var m = (next-olddist)/(dist-olddist);
      points.push(new google.maps.LatLng( p1.lat() + (p2.lat()-p1.lat())*m, p1.lng() + (p2.lng()-p1.lng())*m));
      next += metres;    
    }
  }
  return points;
}

// === A method which returns the Vertex number at a given distance along the path ===
// === Returns null if the path is shorter than the specified distance ===
google.maps.Polygon.prototype.GetIndexAtDistance = function(metres) {
  // some awkward special cases
  if (metres == 0) return this.getPath().getAt(0);
  if (metres < 0) return null;
  var dist=0;
  var olddist=0;
  for (var i=1; (i < this.getPath().getLength() && dist < metres); i++) {
    olddist = dist;
    dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i-1));
  }
  if (dist < metres) {return null;}
  return i;
}

// === A function which returns the bearing between two vertices in decgrees from 0 to 360===
// === If v1 is null, it returns the bearing between the first and last vertex ===
// === If v1 is present but v2 is null, returns the bearing from v1 to the next vertex ===
// === If either vertex is out of range, returns void ===
google.maps.Polygon.prototype.Bearing = function(v1,v2) {
  if (v1 == null) {
    v1 = 0;
    v2 = this.getPath().getLength()-1;
  } else if (v2 ==  null) {
    v2 = v1+1;
  }
  if ((v1 < 0) || (v1 >= this.getPath().getLength()) || (v2 < 0) || (v2 >= this.getPath().getLength())) {
    return;
  }
  var from = this.getPath().getAt(v1);
  var to = this.getPath().getAt(v2);
  if (from.equals(to)) {
    return 0;
  }
  var lat1 = from.latRadians();
  var lon1 = from.lngRadians();
  var lat2 = to.latRadians();
  var lon2 = to.lngRadians();
  var angle = - Math.atan2( Math.sin( lon1 - lon2 ) * Math.cos( lat2 ), Math.cos( lat1 ) * Math.sin( lat2 ) - Math.sin( lat1 ) * Math.cos( lat2 ) * Math.cos( lon1 - lon2 ) );
  if ( angle < 0.0 ) angle  += Math.PI * 2.0;
  angle = angle * 180.0 / Math.PI;
  return parseFloat(angle.toFixed(1));
}




// === Copy all the above functions to GPolyline ===
google.maps.Polyline.prototype.Contains             = google.maps.Polygon.prototype.Contains;
google.maps.Polyline.prototype.Area                 = google.maps.Polygon.prototype.Area;
google.maps.Polyline.prototype.Distance             = google.maps.Polygon.prototype.Distance;
google.maps.Polyline.prototype.Bounds               = google.maps.Polygon.prototype.Bounds;
google.maps.Polyline.prototype.GetPointAtDistance   = google.maps.Polygon.prototype.GetPointAtDistance;
google.maps.Polyline.prototype.GetPointsAtDistance  = google.maps.Polygon.prototype.GetPointsAtDistance;
google.maps.Polyline.prototype.GetIndexAtDistance   = google.maps.Polygon.prototype.GetIndexAtDistance;
google.maps.Polyline.prototype.Bearing              = google.maps.Polygon.prototype.Bearing;

function scriptImport(src) {
    var scriptElem = document.createElement('script');
    scriptElem.setAttribute('src',src);
    scriptElem.setAttribute('type','text/javascript');
    document.getElementsByTagName('head')[0].appendChild(scriptElem);
}
