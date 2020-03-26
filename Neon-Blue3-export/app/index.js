
import document from "document";
import { display } from "display";
import clock from "clock";
import { battery } from "power";
import { units } from "user-settings";
import { HeartRateSensor } from "heart-rate";
import { user } from "user-profile";
import { preferences } from "user-settings";
import { goals } from "user-activity";
import { today } from "user-activity";

import * as weekday from "../common/weekday"
import * as util from "../common/utils";

//Battery Section Begin
let batteryLine = document.getElementById("battery-line");
let batteryLabel = document.getElementById("batteryLabel");

let root = document.getElementById('root')
const screenHeight = root.height
const screenWidth = root.width

function drawBat() {
  let level = battery.chargeLevel;
  let batteryPercentage = Math.floor(level);
  let lineWidth = Math.floor(screenWidth*(batteryPercentage/100));
  if (batteryPercentage >= 75)
  {
    batteryLine.style.fill = "lawngreen";
    batteryLine.width = lineWidth;
  }
  else if (batteryPercentage >= 50)
  {
      batteryLine.style.fill = "gold";
      batteryLine.width = lineWidth;
  }
  else if (batteryPercentage >= 25)
  {
      batteryLine.style.fill = "darkorange";
      batteryLine.width = lineWidth;
  }
  else
  {
     batteryLine.style.fill = "crimson";
     batteryLine.width = lineWidth;
  }
  
}
//Battery Section End

//Date Section Begin
let dayLabel = document.getElementById("day");
let dateLabel = document.getElementById("date"); 

function drawDate(now, language) {
  let monthIndex = now.getMonth() + 1;
  let day = now.getDate();
  let year = now.getYear() % 100;
  
  
  let dayName = weekday.getWeekdayName(language, now.getDay());

  var dateText;  

  dateText= util.zeroPad(monthIndex) + "." + util.zeroPad(day)+ "." + year;    

  dayLabel.text = `${dayName}`;
  dateLabel.text =  dateText;
}
//Date Section End

//Time Section Begin
let root = document.getElementById('root')
const screenHeight = root.height
const screenWidth = root.width

let timeLabel = document.getElementById("time");
let secLabel = document.getElementById("second");
//let isAmPm = true;
//function setIsAmPm(val) { isAmPm = val}

function drawTime(now) {

  var hours = setHours(now);
  
  let mins = util.zeroPad(now.getMinutes());
  let secs = util.zeroPad(now.getSeconds());
  timeLabel.text = `${hours}:${mins}`;
  secLabel.text = `${secs}`;
  
}

function setHours(now) {
  var hours = now.getHours();
  var amPmdeviceType = (screenHeight === 300) ? 'versaAmPm' : 'ionicAmPm';
  var amPmLabel = document.getElementById(amPmdeviceType);
  var amPm = "";
  if (preferences.clockDisplay === "12h" ) {
    // 12h format    
    //if (isAmPm) {
      if (hours < 12) {
        amPm = " AM";
      } else {
        amPm = " PM";
      }
    //}
    amPmLabel.text = amPm;
    amPmLabel.style.display= 'inline';
    hours = util.zeroPad(hours % 12 || 12);    
  } else {
    // 24h format
    amPm = "";
    amPmLabel.text = amPm;
    amPmLabel.style.display= 'none';
    hours = util.zeroPad(hours);
  }
  
  return hours
}
//Time Section End

//HeartRate Section Begin
let hrm = new HeartRateSensor();
var isHeartbeatAnimation  = true;
function isHeartbeatAnimationSet(val) { isHeartbeatAnimation = val }
var hrmAnimationPhase = false;
var prevHrmRate = null;
var hrmRate = null;
var hrAnimated = false;
var hrAnimatedInterval = null;
let hrLabel = document.getElementById("hr");
let hrIconSystoleLabel = document.getElementById("hr-icon-systole");
let hrIconDiastoleLabel = document.getElementById("hr-icon-diastole");
let hrCountLabel = document.getElementById("hr-count");


function initHrInterval() {
  clearInterval(hrAnimatedInterval);
  hrAnimatedInterval = setInterval(animateHr, 30000/hrmRate);
}


function stopHrAnimation() {
  hrAnimated = false;
  clearInterval(hrAnimatedInterval);
  hrIconDiastoleLabel.style.display = "inline";
}

function hideHr() {
   hrmRate = null;
   prevHrmRate = null;   
   stopHrAnimation();
   hrLabel.style.display = "none";
} 

function animateHr() {   
    if (hrmAnimationPhase) {
      hrIconDiastoleLabel.style.display = "none";
    } else {
      hrIconDiastoleLabel.style.display = "inline";  
    }
  
    hrmAnimationPhase =!hrmAnimationPhase;
  
    if (prevHrmRate != hrmRate) {
      clearInterval(hrAnimatedInterval);
      if (isHeartbeatAnimation) {
        prevHrmRate = hrmRate;
        initHrInterval();
      }
    }     
    prevHrmRate = hrmRate;
}

function drawHrm() { 
  hrmRate = hrm.heartRate;
  if (hrmRate && display.on) {
    hrCountLabel.text = `${hrmRate}`;
    
    if (!prevHrmRate) {
      hrLabel.style.display = "inline";    
    }
    if (!hrAnimated && isHeartbeatAnimation) {
      clearInterval(hrAnimatedInterval);   
      prevHrmRate = hrmRate;
      initHrInterval();
      hrAnimated = true;      
    }
  } else {
    hideHr();
  }
}

drawHrm();
hrm.onreading = drawHrm;
hrm.start();
//HeartRate Section End

//Activity Section Begin
var distanceUnit = "mi";
function distanceUnitSet(val) { distanceUnit = val }
function getProgressLabel(prefix) {  
  let containerLabel = document.getElementById(prefix);
  return {
    prefix: prefix,
    prevProgressVal: null,
    container: containerLabel,
    count: containerLabel.getElementsByClassName("count")[0],
    icon: containerLabel.getElementsByClassName("icon")[0]
  }
}

let goalTypes = [
  "steps",
  "distance",
  "elevationGain",
  "calories",
  "activeMinutes"
];

let progressLabels = [];

for (var i=0; i < goalTypes.length; i++) {
  var goalType = goalTypes[i];
  progressLabels.push(getProgressLabel(goalType)); 
}  
 
function drawProgress(progressLabel) {
  let prefix = progressLabel.prefix;
  
  let actual = (today.local[prefix] || 0);
  if (progressLabel.prevProgressVal == actual) {
    return;
  }  
  progressLabel.prevProgressVal = actual;
  
  var isGoalReached = false;
  
  var displayValue = actual;
  if (prefix === "distance" && actual) {
    
    if (distanceUnit === "mi") {
      displayValue = (actual / 1609.344).toPrecision(3);  
    }
  }  
  progressLabel.count.text = `${displayValue}`;
} 

function drawAllProgress() {
  for (var i=0; i < goalTypes.length; i++) {  
    drawProgress(progressLabels[i]);
  }
}

function resetProgressPrevState() {
  for (var i=0; i < goalTypes.length; i++) {  
    progressLabels[i].prevProgressVal = null;
  }
}
//Activity Section End

//Device Section Begin
function deviceSetup() {
  let root = document.getElementById('root');
  const screenHeight = root.height
  const screenWidth = root.width
  if (screenHeight === 300) {
    console.log("Versa");
    var versaTime = document.getElementById('time');
    var versaAmPm = document.getElementById('versaAmPm');
    var ionicAmPm = document.getElementById('ionicAmPm');
    ionicAmPm.style.display = 'none';
    versaAmPm.style.display = 'inlne';
    versaTime.style.fontSize = 124;
    versaTime.x = screenWidth-15;
    versaTime.y = 175;
    var versaSec = document.getElementById('second');
    versaSec.y = 235;
  }
  else {
    var versaAmPm = document.getElementById('versaAmPm');
    var ionicAmPm = document.getElementById('ionicAmPm');
    ionicAmPm.style.display = 'inline';
    versaAmPm.style.display = 'none';
    var ionicSec = document.getElementById('second');
    ionicSec.style.fontSize = 40;
  }
}
//Device Section End

//Settings Section Begin
var language = "en";

function loadSettings() {
  
    var defaults = {
      isHeartbeatAnimation: true,
      language: 'en'
    };    
    
    if (units.distance === "us") {
      defaults["distanceUnit"] = { values:[{value:"mi"}]}; 
    }   
    return defaults;
}
//Settings Section End

clock.granularity = "seconds";
loadSettings();
deviceSetup();
clock.ontick = (evt) => {  
  drawTime(evt.date);
  drawDate(evt.date, language);
  drawAllProgress();
  drawBat();
  batteryLabel.text = battery.chargeLevel + "%";
  hrm.start();
}