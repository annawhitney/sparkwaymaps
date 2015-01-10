/**
 * service.js
 *
 * Computer Science 50
 * Problem Set 8
 *
 * Implements a shuttle service.
 */

// default height
var HEIGHT = 0.8;

// default latitude
var LATITUDE = 42.3745615030193;

// default longitude
var LONGITUDE = -71.11803936751632;

// default heading
var HEADING = 1.757197490907891;

// default number of seats
var SEATS = 10;

// default velocity
var VELOCITY = 50;

// global reference to shuttle's marker on 2D map
var bus = null;

// global reference to 3D Earth
var earth = null;

// global reference to 2D map
var map = null;

// global reference to shuttle
var shuttle = null;

// load version 1 of the Google Earth API
google.load("earth", "1");

// load version 3 of the Google Maps API
google.load("maps", "3", {other_params: "sensor=false"});

// once the window has loaded
$(window).load(function() {

    // listen for keydown anywhere in body
    $(document.body).keydown(function(event) {
        return keystroke(event, true);
    });

    // listen for keyup anywhere in body
    $(document.body).keyup(function(event) {
        return keystroke(event, false);
    });

    // listen for click on Drop Off button
    $("#dropoff").click(function(event) {
        dropoff();
    });

    // listen for click on Pick Up button
    $("#pickup").click(function(event) {
        pickup();
    });

    // load application
    load();
});

// unload application
$(window).unload(function() {
    unload();
});

/**
 * Renders seating chart.
 */
function chart()
{
    var html = "<ol start='0'>";
    for (var i = 0; i < shuttle.seats.length; i++)
    {
        if (shuttle.seats[i] == null)
        {
            html += "<li>Empty Seat</li>";
        }
        else
        {
            html += "<li>" + shuttle.seats[i].name + " to " + shuttle.seats[i].house + "</li>";
        }
    }
    html += "</ol>";
    $("#chart").html(html);
}

/**
 * Calculates distance between two points, given latitude and longitude for each.
 */
function distance(lat1, lng1, lat2, lng2)
{
    var R = 6371;
    var dLat = (lat1 - lat2) * Math.PI / 180;
    var dLon = (lng1 - lng2) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat2 * Math.PI / 180) * Math.cos(lat1 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000;
};

/**
 * Drops up passengers if their stop is nearby.
 */
function dropoff()
{
    // initialize number of passengers dropped off
    droppedOff = 0;

    // iterate over seats to find any whose house is in range
    for (var i = 0; i < SEATS; i++)
    {
        // if there's someone in the seat
        if (shuttle.seats[i] != null)
        {
            // distance between shuttle and passenger's house
            var d = shuttle.distance(HOUSES[shuttle.seats[i].house].lat, HOUSES[shuttle.seats[i].house].lng);

            // if in 30m range
            if (d <= 30)
            {
                // if this is the first person we've dropped off on this click
                if (droppedOff == 0)
                {
                    $("#announcements").html("You dropped off " + shuttle.seats[i].name);
                }
                else
                {
                    $("#announcements").append(", " + shuttle.seats[i].name);
                }
                // remove passenger from seat
                shuttle.seats[i] = null;

                // increment dropped off number
                droppedOff++;
                
                // increment points
                points++;

                // update chart
                chart();
            }
        }
    }

    // if no passengers' houses in range
    if (droppedOff == 0)
    {
        $("#announcements").html("Nobody to drop off here.");
    }
    else
    {
        // announce current score
        $("#announcements").append("<br/>+" + droppedOff + " point(s). Score: " + points);
    }
}

/**
 * Called if Google Earth fails to load.
 */
function failureCB(errorCode) 
{
    // report error unless plugin simply isn't installed
    if (errorCode != ERR_CREATE_PLUGIN)
    {
        alert(errorCode);
    }
}

/**
 * Handler for Earth's frameend event.
 */
function frameend() 
{
    shuttle.update();
    var rotated = {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "red",
            fillOpacity: 0.8,
            strokeWeight: 2,
            rotation: shuttle.headingAngle * 180 / Math.PI
        }
    bus.setIcon(rotated);
}

/**
 * Called once Google Earth has loaded.
 */
function initCB(instance) 
{
    // retain reference to GEPlugin instance
    earth = instance;

    // specify the speed at which the camera moves
    earth.getOptions().setFlyToSpeed(100);

    // show buildings
    earth.getLayerRoot().enableLayerById(earth.LAYER_BUILDINGS, true);

    // disable terrain (so that Earth is flat)
    earth.getLayerRoot().enableLayerById(earth.LAYER_TERRAIN, false);

    // prevent mouse navigation in the plugin
    earth.getOptions().setMouseNavigationEnabled(false);

    // instantiate shuttle
    shuttle = new Shuttle({
        heading: HEADING,
        height: HEIGHT,
        latitude: LATITUDE,
        longitude: LONGITUDE,
        planet: earth,
        seats: SEATS,
        velocity: VELOCITY
    });

    // align icon to shuttle's heading
    var image = {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "red",
            fillOpacity: 0.8,
            strokeWeight: 2,
            rotation: shuttle.position.heading * 180 / Math.PI 
        }
    bus.setIcon(image);

    // synchronize camera with Earth
    google.earth.addEventListener(earth, "frameend", frameend);

    // synchronize map with Earth
    google.earth.addEventListener(earth.getView(), "viewchange", viewchange);

    // update shuttle's camera
    shuttle.updateCamera();

    // show Earth
    earth.getWindow().setVisibility(true);

    // render seating chart
    chart();

    // populate Earth with passengers and houses
    populate();

    // initialize points at zero
    points = 0;
}

/**
 * Handles keystrokes.
 */
function keystroke(event, state)
{
    // ensure we have event
    if (!event)
    {
        event = window.event;
    }

    // left arrow
    if (event.keyCode == 37)
    {
        shuttle.states.turningLeftward = state;
        return false;
    }

    // up arrow
    else if (event.keyCode == 38)
    {
        shuttle.states.tiltingUpward = state;
        return false;
    }

    // right arrow
    else if (event.keyCode == 39)
    {
        shuttle.states.turningRightward = state;
        return false;
    }

    // down arrow
    else if (event.keyCode == 40)
    {
        shuttle.states.tiltingDownward = state;
        return false;
    }

    // A, a
    else if (event.keyCode == 65 || event.keyCode == 97)
    {
        // clear announcements
        $("#announcements").html("No announcements at this time.");

        shuttle.states.slidingLeftward = state;
        return false;
    }

    // D, d
    else if (event.keyCode == 68 || event.keyCode == 100)
    {
        // clear announcements
        $("#announcements").html("No announcements at this time.");

        shuttle.states.slidingRightward = state;
        return false;
    }
  
    // S, s
    else if (event.keyCode == 83 || event.keyCode == 115)
    {
        // clear announcements
        $("#announcements").html("No announcements at this time.");

        shuttle.states.movingBackward = state;     
        return false;
    }

    // W, w
    else if (event.keyCode == 87 || event.keyCode == 119)
    {
        // clear announcements
        $("#announcements").html("No announcements at this time.");

        shuttle.states.movingForward = state;    
        return false;
    }
  
    return true;
}

/**
 * Loads application.
 */
function load()
{
    // embed 2D map in DOM
    var latlng = new google.maps.LatLng(LATITUDE, LONGITUDE);
    map = new google.maps.Map($("#map").get(0), {
        center: latlng,
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        zoom: 17,
        zoomControl: true
    });

    // prepare shuttle's icon for map
    bus = new google.maps.Marker({
        icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "red",
            fillOpacity: 0.8,
            strokeWeight: 2,
            rotation: 0
        },
        map: map,
        title: "you are here"
    });

    // embed 3D Earth in DOM
    google.earth.createInstance("earth", initCB, failureCB);
}

/**
 * Picks up nearby passengers.
 */
function pickup()
{
    // initialize variable for number of passengers picked up
    var pickedUp = 0;
    
    // initialize seat check variable
    var seatCheck = true;

    // iterate over passengers to find any in range
    for (var i = 0, n = PASSENGERS.length; i < n; i++)
    {
        // initialize house check variable
        var houseCheck = false;

        // distance between shuttle and passenger
        var d = shuttle.distance(PASSENGERS[i]["lat"], PASSENGERS[i]["lng"]);

        // if in 15m range
        if (d <= 15)
        {
            // check passenger's house against each house
            for (var house in HOUSES)
            {
                if (PASSENGERS[i]["house"] == house)
                {
                    houseCheck = true;
                    break;
                }

                // set house check back to false if passenger wasn't in a house
                houseCheck = false;
            }

            // skip anyone whose house isn't on the list
            if (houseCheck == false)
            {
                continue;
            }
            else
            {
                // seat check default is false
                seatCheck = false;

                // iterate through seats
                for (var j = 0; j < SEATS; j++)
                {
                    // if seat is empty 
                    if (shuttle.seats[j] == null)
                    {
                        // set seat check to true
                        seatCheck = true;

                        // add passenger to seat
                        shuttle.seats[j] = PASSENGERS[i];

                        // remove placemark from 3D map
                        var features = earth.getFeatures();
                        features.removeChild(PASSENGERS[i]["placemark"]);

                        // remove marker from 2D map
                        PASSENGERS[i].marker.setMap(null);

                        // remove location from passenger array
                        PASSENGERS[i]["lat"] = null;
                        PASSENGERS[i]["lng"] = null;
                        PASSENGERS[i]["marker"] = null;
                        PASSENGERS[i]["placemark"] = null;

                        // if this is the first passenger we picked up on this click
                        if (pickedUp == 0)
                        {
                            // announce that we picked someone up
                            $("#announcements").html("You picked up " + PASSENGERS[i].name);
                        }
                        
                        // if we picked up more than one person on this click
                        else
                        {
                            // append next name to announcement
                            $("#announcements").append(", " + PASSENGERS[i].name);
                        }

                        // register that we picked someone up
                        pickedUp++;

                        // update chart
                        chart();

                        // don't continue checking seats
                        break;
                    }

                    // set seat check to false if seat wasn't empty
                    seatCheck = false;
                }
            }
        }
    }

    // if no passengers in range
    if (pickedUp == 0)
    {
        // if all seats are full
        if (seatCheck == false)
        {
            $("#announcements").html("No empty seats!");
        }
        else
        {
            $("#announcements").html("No passengers in range.");
        }
    }
}

/**
 * Populates Earth with passengers and houses.
 */
function populate()
{
    // mark houses
    for (var house in HOUSES)
    {
        // plant house on map
        new google.maps.Marker({
            icon: "https://google-maps-icons.googlecode.com/files/home.png",
            map: map,
            position: new google.maps.LatLng(HOUSES[house].lat, HOUSES[house].lng),
            title: house
        });
    }

    // get current URL, sans any filename
    var url = window.location.href.substring(0, (window.location.href.lastIndexOf("/")) + 1);

    // scatter passengers
    for (var i = 0; i < PASSENGERS.length; i++)
    {
        // check passenger's house against each house in list
        for (var house in HOUSES)
        {
            if (PASSENGERS[i]["house"] == house)
            {
                houseCheck = true;
                break;
            }

            // set house check back to false if passenger wasn't in a house
            houseCheck = false;
        }

        if (houseCheck == true)
        {
            // ensure nobody ends up within 100 meters of home (by relocating them if they are)
            do
            {
                // pick a random building
                var building = BUILDINGS[Math.floor(Math.random() * BUILDINGS.length)];
                var dist = distance(building.lat, building.lng, HOUSES[PASSENGERS[i].house].lat, HOUSES[PASSENGERS[i].house].lng);
            }
            while (dist <= 100);
        }

        // prepare placemark
        var placemark = earth.createPlacemark("");
        placemark.setName(PASSENGERS[i].name + " to " + PASSENGERS[i].house);

        // prepare icon
        var icon = earth.createIcon("");
        icon.setHref(url + "/img/" + PASSENGERS[i].username + ".jpg");

        // prepare style
        var style = earth.createStyle("");
        style.getIconStyle().setIcon(icon);
        style.getIconStyle().setScale(4.0);

        // prepare stylemap
        var styleMap = earth.createStyleMap("");
        styleMap.setNormalStyle(style);
        styleMap.setHighlightStyle(style);

        // associate stylemap with placemark
        placemark.setStyleSelector(styleMap);

        // prepare point
        var point = earth.createPoint("");
        point.setAltitudeMode(earth.ALTITUDE_RELATIVE_TO_GROUND);
        point.setLatitude(building.lat);
        point.setLongitude(building.lng);
        point.setAltitude(0.0);

        // associate placemark with point
        placemark.setGeometry(point);

        // add placemark to Earth
        earth.getFeatures().appendChild(placemark);

        // add marker to map
        var marker = new google.maps.Marker({
            icon: "https://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/man.png",
            map: map,
            position: new google.maps.LatLng(building.lat, building.lng),
            title: PASSENGERS[i].name + " at " + building.name
        });

        // remember passenger's placemark and marker for pick-up's sake
        PASSENGERS[i]["placemark"] = placemark;
        PASSENGERS[i]["marker"] = marker;
        PASSENGERS[i]["lat"] = building.lat;
        PASSENGERS[i]["lng"] = building.lng;
    }
}

/**
 * Handler for Earth's viewchange event.
 */
function viewchange() 
{
    // keep map centered on shuttle's marker
    var latlng = new google.maps.LatLng(shuttle.position.latitude, shuttle.position.longitude);
    map.setCenter(latlng);
    bus.setPosition(latlng);
}

/**
 * Unloads Earth.
 */
function unload()
{
    google.earth.removeEventListener(earth.getView(), "viewchange", viewchange);
    google.earth.removeEventListener(earth, "frameend", frameend);
}
