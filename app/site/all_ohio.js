/* jshint browser: true, white: true, esversion: 8 */
/* globals L */

// set up leaflet map
var oh_center = [40.3, -82.5];
var ohioMap = L.map("ohioMap", {"tap": false}).setView(oh_center, 7);

var ohioLayer = L.tileLayer(
  "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }
);



ohioMap.addLayer(ohioLayer);


// define file to load
var data_file = "./ohio_places.json";

async function initPage(data_file) {
    // load json
    // fetch returns a promise
    var pairs = await fetch(data_file)
      .then((response) => response.json())
      .catch((error) => console.log(error));
    // make accessible as global in random order
    allPairs = pairs;
    // show on Ohio map
    updateMap(allPairs, ohioMap);
}

function displayPair(pair) {
    var ohioNameFirst = pair.ohio.locations[0].name + ", Ohio";
    var ohioNameSecond = pair.ohio.locations[1].name + ", Ohio";
    var ohioNames = ohioNameFirst + " ⇔ " + ohioNameSecond;
    var ohioLabel = document.getElementById("ohio").labels[0];
    ohioLabel.textContent = ohioNames;

    var abroadNames = pair.abroad.locations[0].name + " ⇔ " + pair.abroad.locations[1].name;
    var abroadLabel = document.getElementById("abroad").labels[0];
    abroadLabel.textContent = abroadNames;
}

function getOhioLatLon(record) {
    return [record.ohio_lat, record.ohio_lon];
}

function updateMap(locs, map) {
    var features = [];
    for (let i = 0; i < locs.length; i++) {
        var ohioPlace = locs[i];
        var marker = L.marker(getOhioLatLon(ohioPlace));
        var ohioStr = makeWikiLink(ohioPlace.ohio + ", Ohio");
        var abroadStr = makeWikiLink(ohioPlace.abroad);
        var popStr = ohioStr + "<br />(" + abroadStr + ")";
        var pop = marker.bindPopup(popStr);
        features.push(marker);
        features.push(pop);
    }
    var fGroup = L.featureGroup(features);

    fGroup.addTo(map);

    map.fitBounds(fGroup.getBounds(), {padding: [50, 50]});
}

function makeWikiLink(nameString) {
    // Use wikipedia search string to show results if page doesn't exist
    return "<a href='https://en.wikipedia.org/w/index.php?search=" + nameString +
        "' target='_blank' rel='noopener noreferrer'>" +nameString + "</a>";
}


window.onload = initPage(data_file);

