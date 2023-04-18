/*

Author  : Se Chien Yiing 
Description: This file contains functions that are used on listing page
*/

var map;
var bounds;
var markers = [];
var myLatLng;
var currentClick;
var nearbyDetail;
var centerLat = parseFloat($('#googleMap').data("lat"));
var centerLng = parseFloat($('#googleMap').data("lng"));
var directionsService;
var directionsDisplay;

//Initialize Google Map
function initMap() {
    myLatLng = { lat: centerLat, lng: centerLng };
    bounds = new google.maps.LatLngBounds();

    if (country != 'CN')
    {
        directionsService = new google.maps.DirectionsService;
        directionsDisplay = new google.maps.DirectionsRenderer;
    }
    
    //initialize map
    var mapProp = {
        center: myLatLng,
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        mapTypeControl: false,
        scrollwheel: true,
        scaleControl: true,
        gestureHandling: "cooperative"
    };
    map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap(map);
    
    //property marker
    var image = {
        url: '/content/images/locationmarker4.png',
        scaledSize: new google.maps.Size(40, 50),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(25, 50)
    };
    var propertyName = $('#googleMap').data("property-name") + ' - ' + $('#googleMap').data("property-address");
    var propertyContent = '<div id="content">' + propertyName + '</div>';

    infowindow = new google.maps.InfoWindow();
    var marker = new google.maps.Marker({
        position: myLatLng,
        icon: image,
        map: map,
        title: propertyName
    });

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(propertyContent);
        infowindow.open(map, this);
    });
    google.maps.event.addListener(marker, 'mouseover', function () {
        infowindow.setContent(propertyContent);
        infowindow.open(map, this);
    });
}

function callback(results, status) {    
    bounds = new google.maps.LatLngBounds();
    if (status === google.maps.places.PlacesServiceStatus.OK) {

        //start to build marker
        nearbyDetail = '<div class="pure-g nearby-detail">';
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i], i);
        }
        nearbyDetail += '</div>';

        currentClick.after(nearbyDetail);
        myFitBounds(map, bounds);
        showMarkers();
    }
}

//Create Markers
function createMarker(place, i) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        position: place.geometry.location
    });

    bounds.extend(marker.position);
    markers.push(marker);

    nearbyDetail += '<a class="nearby-place pure-u-1" data-nearby-place-index="' + i + '">';
    nearbyDetail += '<div class="pure-g">';
    nearbyDetail += '<p class="small pure-u-1 nearby-place-name ut-hide-text-overflow">' + place.name + '</p>';
    nearbyDetail += '</div>';
    nearbyDetail += '</a>';


    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(place.name);
        infowindow.open(map, this);
    });
    google.maps.event.addListener(marker, 'mouseover', function () {
        infowindow.setContent(place.name);
        infowindow.open(map, this);
    });
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
    markers = [];
}

// Shows any markers currently in the array.
function showMarkers() {
    setMapOnAll(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
    clearMarkers();
    markers = [];
}


$(document).ready(function () {
    $('#nearby').on('click', '.nearby-overview', function (e) {
        var type = $(this).data("nearby-category");
        var radius = $(this).data("radius");
        var active = $(this).data("active");
        var service;

        currentClick = $(this);
        clearMarkers();

        //reset all checkboxes
        $('#nearby').find(".fa-square-o").removeClass("hidden");
        $('#nearby').find(".fa-check-square").addClass("hidden");
        $('.nearby-detail').remove();

        if (active == false) {
            service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: myLatLng,
                radius: radius,
                type: [type]
            }, callback);
            $(".nearby-overview").data("active", false);
            $(this).data("active", true);
            $(this).find(".fa-square-o").addClass("hidden");
            $(this).find(".fa-check-square").removeClass("hidden");
        }
        else {
            $(this).data("active", false);
            $(this).find(".fa-square-o").removeClass("hidden");
            $(this).find(".fa-check-square").addClass("hidden");            
        }
    });

    $('#nearby').on('mouseover', '.nearby-place', function (e) {
        var index = $(this).data("nearby-place-index");
        google.maps.event.trigger(markers[index], 'click');
    });

    //Travel Time Textbox Auto Complete for typeahead
    $('#travelTime-box').on("typeahead:autocomplete typeahead:select", function (e, sData) {
        //Initialize Typeahead function
        $('#travelTime-box').typeahead('val', sData.terms[0].value);

        //Get Google Map DirectionService
        directionsService.route({
            origin: myLatLng,
            destination: { 'placeId': sData.place_id },
            travelMode: google.maps.TravelMode.DRIVING
        }, function (response, status) {
            if (status === google.maps.DirectionsStatus.OK) {                
                $('#mapLocation').text(sData.terms[0].value)
                $('#mapDuration').text(response.routes[0].legs[0].duration.text)
                $('#mapDistance').text(response.routes[0].legs[0].distance.text)

                directionsDisplay.setMap(null);
                directionsDisplay.setMap(map);
                directionsDisplay.setDirections(response);
                $('#mapDirection').removeClass('hidden');
            }
        });
    });

    $('#travelTimeSearch').on('keydown', '.twitter-typeahead #travelTime-box', function (e) {
        if (e.which == 13) {
            e.preventDefault();
            $('.tt-selectable').first().click();
        }
    });



});

