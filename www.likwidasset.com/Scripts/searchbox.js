/*
Author  : Se Chien Yiing 
Description: This file contains functions that are used on search box with typeahead.js
*/


$(document).ready(function () {
    $('#search-box').on("typeahead:autocomplete typeahead:select", function (e, sData) {
        $('#search-box').typeahead('val', sData.terms[0].value);
        //alert(JSON.stringify(sData))
        
        //Get place ID
        $('#placeID').val(sData.place_id);
        $('#viewport').val('');
        $('#zoom').val('16');

        var request = {
            placeId: sData.place_id
        }

        //Send Request to Google PlacesService to get details of the Place_ID
        var service = new google.maps.places.PlacesService(document.createElement('div'));
        service.getDetails(request, function (place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {                
                $('#lat').val(parseFloat(place.geometry.location.lat()));
                $('#lng').val(parseFloat(place.geometry.location.lng()));                                

                //Construct Viewport with 4 points
                if (place.geometry.viewport != null)
                    $('#viewport').val(place.geometry.viewport.getNorthEast().lat() + ',' + place.geometry.viewport.getNorthEast().lng() + ',' + place.geometry.viewport.getSouthWest().lat() + ',' + place.geometry.viewport.getSouthWest().lng());

                //Submit Search Form
                $('#searchForm').submit();
            }
        });
    });

    //on Key down handle: Click
    $('#searchForm').on('keydown', '.twitter-typeahead #search-box', function (e) {
        if (e.which == 13) {
            e.preventDefault();
            $('.tt-selectable').first().click();
        }
    });

    //on button click handler
    $('#submit-search').on('click', function (e) {                        
        if ($('.tt-selectable').length > 0){
            e.preventDefault();
            $('.tt-selectable').first().click();
        }           
    });

    
    //initialize search box with typeahead scripts - restrict to Malaysia only
    $('#search-box, #location-box, #travelTime-box, #small-search-box #rental-search-box').typeahead(null, {
        name: 'search-box',
        limit: Infinity,
        display: 'description',
        /*source: function (query, syncResults, asyncResults) {
            var service = new google.maps.places.AutocompleteService();
            var place = service.getQueryPredictions({ input: 'klcc' },displaySuggestions );*/
        source: function (query, syncResults, asyncResults) {
            var service = new google.maps.places.AutocompleteService();
            var request = {
                input: query,
                componentRestrictions: { country: 'my' },
            };
            //Call Google PlacePrediction Services
            var place = service.getPlacePredictions(request, function (predictions, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    asyncResults(predictions)
                    return;
                }                
            });
        },
        templates: {
            empty: [
              '<div class="empty-message">',
                'No result found.',
              '</div>'
            ].join('\n'),
            suggestion:
                function (data) {
                    //Construct Auto Suggestion drop dodwn list strings                    
                    var suggestionText = data.terms[0].value;
                    suggestionText = suggestionText.substring(0, data.matched_substrings[0].offset) + '<strong>' + suggestionText.substring(data.matched_substrings[0].offset, data.matched_substrings[0].offset + data.matched_substrings[0].length) + '</strong>' + suggestionText.substring(data.matched_substrings[0].offset + data.matched_substrings[0].length)
                    
                    var addressText = data.description.substring(data.terms[1].offset);
                    if (addressText.substring(addressText.length - 9).toUpperCase() == ' MALAYSIA') {
                        addressText = addressText.substring(0, addressText.length - 10);
                        addressText = addressText.replace('Federal Territory of Kuala Lumpur', '');
                        addressText = addressText.replace('Kuala Lumpur,', 'Kuala Lumpur');
                    }
                    //Add Icon according to type of location
                    var iconText = '<td rowspan=\'2\'><span class="fa ';
                    if (data.types[0] == 'transit_station')
                        iconText += 'fa-subway';
                    else
                        iconText += 'fa-map-marker';

                    iconText += ' typeaheadicon"></span></td>';
                    return '<table><tr>' + iconText + '<td>' + suggestionText + '</td></tr><tr><td><small class=\'smalltext\'>' + $('<div/>').text(addressText).html() + '</small></td></tr></table>';
                }
        }
    });


    //initialize International search box - No Location Restriction
    $('#international-location-box').typeahead(null, {
        name: 'international-search-box',
        limit: Infinity,
        display: 'description',
        source: function (query, syncResults, asyncResults) {
            var service = new google.maps.places.AutocompleteService();
            var request = {
                input: query,
                componentRestrictions: { },
            };
            //Call Google PlacePrediction Services
            var place = service.getPlacePredictions(request, function (predictions, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    asyncResults(predictions)
                    return;
                }
            });
        },
        templates: {
            empty: [
              '<div class="empty-message">',
                'No result found.',
              '</div>'
            ].join('\n'),
            suggestion:
                function (data) {
                    //Construct Auto Suggestion drop dodwn list strings
                    var suggestionText = data.terms[0].value;
                    suggestionText = suggestionText.substring(0, data.matched_substrings[0].offset) + '<strong>' + suggestionText.substring(data.matched_substrings[0].offset, data.matched_substrings[0].offset + data.matched_substrings[0].length) + '</strong>' + suggestionText.substring(data.matched_substrings[0].offset + data.matched_substrings[0].length)
                   // console.log(data);
                    if (data.terms.length > 2) {
                        var addressText = data.description.substring(data.terms[1].offset);
                    }
                    //Add Icon according to type of location
                    var iconText = '<td rowspan=\'2\'><span class="fa ';
                    if (data.types[0] == 'transit_station')
                        iconText += 'fa-subway';
                    else
                        iconText += 'fa-map-marker';

                    iconText += ' typeaheadicon"></span></td>';
                    return '<table><tr>' + iconText + '<td>' + suggestionText + '</td></tr><tr><td><small class=\'smalltext\'>' + $('<div/>').text(addressText).html() + '</small></td></tr></table>';
                }
        }
    });

});

//Zoom in to fit the bounds nicely
function myFitBounds(myMap, bounds) {    
    myMap.fitBounds(bounds); // calling fitBounds() here to center the map for the bounds
    
    var overlayHelper = new google.maps.OverlayView();
    overlayHelper.draw = function () {
        if (!this.ready) {
            var extraZoom = getExtraZoom(this.getProjection(), bounds, myMap.getBounds());
            if (extraZoom > 0) {
                myMap.setZoom(myMap.getZoom() + extraZoom);
            }
            this.ready = true;
            google.maps.event.trigger(this, 'ready');
        }
    };
    overlayHelper.setMap(myMap);
}

//Get extra zoom in so that it wont have too much unrelated spaces at the borders
function getExtraZoom(projection, expectedBounds, actualBounds) {

    // in: LatLngBounds bounds -> out: height and width as a Point
    function getSizeInPixels(bounds) {
        var sw = projection.fromLatLngToContainerPixel(bounds.getSouthWest());
        var ne = projection.fromLatLngToContainerPixel(bounds.getNorthEast());
        return new google.maps.Point(Math.round(10000 * Math.abs(sw.y - ne.y)) / 10000, Math.round(10000 * Math.abs(sw.x - ne.x)) / 10000)
    }

    var expectedSize = getSizeInPixels(expectedBounds),
        actualSize = getSizeInPixels(actualBounds);

    if (Math.floor(expectedSize.x) == 0 || Math.floor(expectedSize.y) == 0) {
        return 0;
    }

    var qx = actualSize.x / expectedSize.x;
    var qy = actualSize.y / expectedSize.y;
    var min = Math.min(qx, qy);

    if (min < 1) {
        return 0;
    }

    return Math.floor(Math.log(min) / Math.LN2 /* = log2(min) */);
}

