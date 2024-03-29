/* jshint browser: true, white: true, esversion: 8 */
/* globals L */

// set up leaflet map
var ohioCenter = [40.2, -82.8];
// unavoidably political
var abroadCenter = [0.0, 33.0];
var ohioMap = L.map("ohioMap").setView(ohioCenter, 6);
var abroadMap = L.map("abroadMap").setView(abroadCenter, 0);

var ohioLayer = L.tileLayer(
  "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }
);

var abroadLayer = L.tileLayer(
  "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }
);


ohioMap.addLayer(ohioLayer);
abroadMap.addLayer(abroadLayer);


var allPairs = [];
var quizPairs = [];
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
    allPairs = shuffle(pairs);
    
    startQuiz();
}

function startQuiz() {
    // get subset of pairs for quiz
    var quizLen = 10;
    quizPairs = getQuizPairs(allPairs, quizLen);
    showNext();
}

function getQuizPairs(pairs, quizLen) {
    /// get quizLen pairs from pairs, without repeating locations
    var pickedPairs = [];
    while (pickedPairs.length < quizLen) {
        // naive just keep trying to pick until one meets criteria
        var randomIndex = Math.floor(Math.random() * pairs.length);
        var candidatePair = pairs[randomIndex];
        if (newLocs(candidatePair, pickedPairs)) {
            pickedPairs.push(candidatePair);
        }
    }
    return pickedPairs;
}

function newLocs(candidatePair, pairs) {
    // check whether candidatePair has new locations compared to pairs
    var loc1 = candidatePair.ohio.locations[0].name;
    var loc2 = candidatePair.ohio.locations[1].name;
    for (let i = 0; i < pairs.length; i++) {
        var check1 = pairs[i].ohio.locations[0].name;
        var check2 = pairs[i].ohio.locations[1].name;
        if ( (loc1 == check1) || (loc1 == check2) || (loc2 == check1) ||
             (loc2 == check2) ) {
            return false;
        }
    }
    return true;
}

function getPairs() {
    // update global state and display
    currentPairs = quizPairs[numAttempted];
    displayPair(currentPairs);
}

function displayPair(pair) {
    var ohioNameFirst = pair.ohio.locations[0].name + ", Ohio";
    var ohioNameSecond = pair.ohio.locations[1].name + ", Ohio";
    var ohioNames = ohioNameFirst + " ⇔ " + ohioNameSecond;
    var ohioLabel = document.getElementById("ohio-answer").labels[0];
    ohioLabel.innerHTML = ohioNames;

    var abroadNameFirst = pair.abroad.locations[0].name;
    var abroadNameSecond = pair.abroad.locations[1].name;
    var abroadNames = abroadNameFirst + " ⇔ " + abroadNameSecond;
    var abroadLabel = document.getElementById("abroad-answer").labels[0];
    abroadLabel.innerHTML = abroadNames;
}


function clearMap(map, center, zoom) {
  // https://stackoverflow.com/a/68555471
  map.eachLayer((layer) => {
    const hasEmptyContrib = !(layer.getAttribution && layer.getAttribution());
    const hasNoContrib = !layer.getAttribution;
    if (hasEmptyContrib || hasNoContrib) {
        map.removeLayer(layer);
    }
  });
  map.setView(center, zoom);
}

function makeArc(start, end) {
    // show great circle arc between start and end
    var polyline = L.Polyline.Arc( start, end, { color: "red" });
    return polyline;
}

function getLatLon(loc) {
    return [loc.lat, loc.lon];
}

function updateMap(locs, map, doFitBounds, center, zoom) {
    clearMap(map, center, zoom);

    var polyline = makeArc(getLatLon(locs[0]), getLatLon(locs[1]), map);

    var marker0 = L.marker(getLatLon(locs[0]));
    var tt0 = marker0.bindTooltip(locs[0].name, { permanent: true, direction: 'auto' });
    var marker1 = L.marker(getLatLon(locs[1]));
    var tt1 = marker1.bindTooltip(locs[1].name, { permanent: true, direction: 'auto' });

    var fGroup = L.featureGroup([polyline, marker0, marker1, tt0, tt1]);

    fGroup.addTo(map);

    if (doFitBounds) {
      map.fitBounds(fGroup.getBounds(), {padding: [50, 50], maxZoom: 6});
    }
}

function showResult(event) {
    event.preventDefault();
    numAttempted++;
    var correct = checkAnswer();
    if (correct) {
      numCorrect++;
    }

    var ohioDistMsg = "<b>"+currentPairs.ohio.dist.toFixed(0) + " km</b>";
    var abroadDistMsg = "<b>"+currentPairs.abroad.dist.toFixed(0) + " km</b>";

    // update css to indicate which pair truly shorter
    var trueShorter = "";
    if (currentPairs.ohio.dist < currentPairs.abroad.dist) {
      trueShorter = "ohio-pair";
    } else {
      trueShorter = "abroad-pair";
    }
    var shorterDiv = document.getElementById(trueShorter);
    shorterDiv.classList.add("correct");

    // display distances
    var ohioDist = document.getElementById("ohio-dist");
    ohioDist.innerHTML = ohioDistMsg;
    var abroadDist = document.getElementById("abroad-dist");
    abroadDist.innerHTML = abroadDistMsg;

    // add :) or :( to choice
    var choice = document.forms.inputForm.elements.answer.value;
    var mood = "";
    if (correct) {
      mood = "&nbsp;🥳";
    } else {
      mood = "&nbsp;😞";
    }
    var answeredDist = document.getElementById(choice + "-dist");
    answeredDist.innerHTML += mood;

    var numRemaining = quizPairs.length - numAttempted;
    var score = "📈 " + numCorrect + "/" + numAttempted + " (" + numRemaining + ")";

    var message = "";
    if (numAttempted == quizPairs.length) {
        message += "<p><b>Quiz over! &#x1F38A Press Restart or <a href='all_ohio.html'>see all Ohio towns</a></p>";
    }

    message += "<h3>Find on Wikipedia</h3>";

    message += "<p>" + makeWikiLink(currentPairs.ohio.locations[0].name + ", Ohio") + "</p>";
    message += "<p>" + makeWikiLink(currentPairs.ohio.locations[1].name + ", Ohio") + "</p>";
    message += "<p>" + makeWikiLink(currentPairs.abroad.locations[0].name) + "</p>";
    message += "<p>" + makeWikiLink(currentPairs.abroad.locations[1].name) + "</p>";

    var scoreDisplay = document.getElementById("score-display");
    scoreDisplay.innerHTML = score;

    var resultDisplay = document.querySelector("#result-display");
    resultDisplay.innerHTML = message;

    updateMap(currentPairs.ohio.locations, ohioMap, false, ohioCenter, 6);
    updateMap(currentPairs.abroad.locations, abroadMap, true, abroadCenter, 0);

    var checkButton = document.getElementById("check-button");
    checkButton.disabled = true;
    var nextButton = document.getElementById("next-button");
    if (numAttempted < quizPairs.length) {
        nextButton.disabled = false;
    }
}


function makeWikiLink(nameString) {
    // Use wikipedia search string to show results if page doesn't exist
    return "<a href='https://en.wikipedia.org/w/index.php?search=" + nameString +
        "' target='_blank' rel='noopener noreferrer'>" +nameString + "</a>";
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
    resultDisplay.innerHTML = "";
    var numRemaining = quizPairs.length - numAttempted;

    // toggle buttons for answer state
    var checkButton = document.getElementById("check-button");
    checkButton.disabled = false;
    var nextButton = document.getElementById("next-button");
    nextButton.disabled = true;

    // reset maps
    clearMap(ohioMap, ohioCenter, 6);
    clearMap(abroadMap, abroadCenter, 0);

    // reset answers
    resetAnswers();

    getPairs();
}

function resetAnswers() {
    // remove class indicating correct answer
    document.getElementById("ohio-pair").classList.remove("correct");
    document.getElementById("abroad-pair").classList.remove("correct");

    // clear distances
    var ohioDist = document.getElementById("ohio-dist");
    ohioDist.innerHTML = "<br />";
    var abroadDist = document.getElementById("abroad-dist");
    abroadDist.innerHTML = "<br />";

    // deselect radio buttons
    document.getElementById("ohio-answer").checked = false;
    document.getElementById("abroad-answer").checked = false;
}

function resetScore() {
    // reset store
    numCorrect = 0;
    numAttempted = 0;
    // begin again
    startQuiz();
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

const el = document.getElementById("inputForm");
el.addEventListener("submit", showResult, false);

window.onload = initPage(data_file);
