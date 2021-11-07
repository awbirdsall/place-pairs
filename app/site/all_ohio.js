/* jshint browser: true, white: true, esversion: 8 */
/* globals L */

// set up leaflet map
var oh_center = [40.3, -82.5];
var ohioMap = L.map("ohioMap").setView(oh_center, 7);

var ohioLayer = L.tileLayer(
  "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }
);



ohioMap.addLayer(ohioLayer);


var allPairs = [];
var currentPairs = {};

// set up score
var numCorrect = 0;
var numAttempted = 0;

// define file to load
var data_file = "./pairs_close.json";

async function initPage(data_file) {
    // load json
    // fetch returns a promise
    var pairs = await fetch(data_file)
      .then((response) => response.json())
      .catch((error) => console.log(error));
    // make accessible as global in random order
    allPairs = pairs;
    // show on Ohio map
    updateMap(ohioMap, allPairs);
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


function clearMap(map) {
  // https://stackoverflow.com/a/68555471
  map.eachLayer((layer) => {
    const hasEmptyContrib = !(layer.getAttribution && layer.getAttribution());
    const hasNoContrib = !layer.getAttribution;
    if (hasEmptyContrib || hasNoContrib) {
        map.removeLayer(layer);
    }
  });
}

function makeArc(start, end) {
    // show great circle arc between start and end
    var polyline = L.Polyline.Arc( start, end, { color: "red" });
    return polyline;
}

function getLatLon(loc) {
    return [loc.lat, loc.lon];
}

function updateMap(locs, map) {
    clearMap(map);

    var polyline = makeArc(getLatLon(locs[0]), getLatLon(locs[1]), map);

    var marker0 = L.marker(getLatLon(locs[0]));
    var tt0 = marker0.bindTooltip(locs[0].name, { permanent: true, direction: 'auto' });
    var marker1 = L.marker(getLatLon(locs[1]));
    var tt1 = marker1.bindTooltip(locs[1].name, { permanent: true, direction: 'auto' });

    var fGroup = L.featureGroup([polyline, marker0, marker1, tt0, tt1]);

    fGroup.addTo(map);

    map.fitBounds(fGroup.getBounds(), {padding: [50, 50]});
}

function showResult(event) {
    var correct = checkAnswer();
    numAttempted++;
    var message = "";
    if (correct) {
        numCorrect++;
        message += "<p>Correct!</p>";
    } else {
        message += "<p>Incorrect.</p>";
    }

    var distanceMessage = currentPairs.ohio.dist.toFixed(0) + " km apart in Ohio; " +
      currentPairs.abroad.dist.toFixed(0) + " km apart abroad.";
    message += "<p>" + distanceMessage + "</p>";


    var numRemaining = allPairs.length - numAttempted;
    message += "<p>" + numCorrect + " out of " + numAttempted + " correct. (" +
        numRemaining + " remain)</p>";

    if (numAttempted == allPairs.length) {
        message += "<p><b>Quiz over, you have answered for all pairs!</b> &#x1F38A</p>";
    }

    message += "<h3>Find on Wikipedia</h3>";

    message += "<p>" + makeWikiLink(currentPairs.ohio.locations[0].name + ", Ohio") + "</p>";
    message += "<p>" + makeWikiLink(currentPairs.ohio.locations[1].name + ", Ohio") + "</p>";
    message += "<p>" + makeWikiLink(currentPairs.abroad.locations[0].name) + "</p>";
    message += "<p>" + makeWikiLink(currentPairs.abroad.locations[1].name) + "</p>";

    var resultDisplay = document.querySelector("#result-display");
    resultDisplay.innerHTML = message;

    updateMap(currentPairs.ohio.locations, ohioMap);
    updateMap(currentPairs.abroad.locations, abroadMap);

    var checkButton = document.getElementById("check-button");
    checkButton.disabled = true;
    var nextButton = document.getElementById("next-button");
    if (numAttempted < allPairs.length) {
        nextButton.disabled = false;
    }
    var resetButton = document.getElementById("reset-button");
    resetButton.disabled = false;
}


function makeWikiLink(nameString) {
    // Use wikipedia search string to show results if page doesn't exist
    return "<p><a href='https://en.wikipedia.org/w/index.php?search=" + nameString +
        "' target='_blank' rel='noopener noreferrer'>" +nameString + "</a></p>";
}


function checkAnswer() {
    event.preventDefault();  // stop form from submitting
    var choice = document.forms.inputForm.elements.answer.value;
    // check vs ratio of ohio distance / abroad distance
    var correctChoice;
    if (currentPairs.ratio < 1) {
        correctChoice = "ohio";
    } else {
        correctChoice = "abroad";
    }
    var correctAnswer = (choice == correctChoice);
    return correctAnswer;
}

function showNext() {
    // clear result display
    var resultDisplay = document.querySelector("#result-display");
    resultDisplay.innerHTML = "<p></p>";

    // toggle buttons for answer state
    var checkButton = document.getElementById("check-button");
    checkButton.disabled = false;
    var nextButton = document.getElementById("next-button");
    nextButton.disabled = true;
    var resetButton = document.getElementById("reset-button");
    resetButton.disabled = true;
    getPairs();
}

function resetScore() {
    // reset score and also reorder
    allPairs = shuffle(allPairs);
    numCorrect = 0;
    numAttempted = 0;
    showNext();
}

function shuffle(array) {
  // https://stackoverflow.com/a/2450976
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

// add event listeners
// alternatively could use single listener and then event delegation https://gomakethings.com/listening-for-click-events-with-vanilla-javascript/
// or just button onclick
const el = document.getElementById("inputForm");
el.addEventListener("submit", showResult, false);

window.onload = initPage(data_file);

