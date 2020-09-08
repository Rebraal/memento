//Analysis
//Run on and add to Overview


/* DO NOT USE
function name(){
	var.map(()=>{
		if(condition met){
			return value
			//intending to break out of map and return to calling function.
			// MAP USES RETURN TO RETURN A VALUE ITSELF!
		}
	})
}

parseInt("01") == NaN.
parseFloat("01") == 1.
*/

message("Analysis started");

var logFile = file("/storage/emulated/0/memento/Analysis log.txt"), strLog = "";
var arEntries = lib().entries();
var score = {};
var diff = {num: 0, date: ""};
var endLogged;
var MAPos = [	
	"Contentment", 
	"Tranquility", 
	"Enthusiasm",
	"Mental clarity",
	"Processing speed",
	"Focus",
	"Energy",
	"Motivation",
	];
var MANeg = [
	"Fatigue",
	"Sleepiness",
	"Torso, leaden",
	"Arms, leaden",
	"Legs, leaden"
];
var CAANeg = [
	"Fatigue",
	"Sleepiness",
	"Anxiety", 
	"Depression", 
	"Irritation	",
	"Confrontational", 
	"Paranoia", 
	"Clumsiness",
	"Torso, leaden",
	"Arms, leaden",
	"Legs, leaden"
];
var arExercises = [
	{n: "glutes 1", i: 3},
	{n: "glutes 2", i: 5},
	{n: "squat",	i: 30},
	{n: "press up", i: 30}
];

/*	Morning awakeness
	=	-	Overview										Higher								
	=	-	First major intake								Earlier					
	=	-	Exercised										More					fn
	=	-	Contentment, Tranquility, Enthusiasm			Higher
	=		Mental clarity, Processing speed,				Higher
	=		Focus, Energy, Motivation						Higher
	=	-	Fatigue, Sleepiness								Lower					inv
	=	-	Torso, Arms and Legs leaden						Lower					inv
	=	-	Sleep Cycle terminated against sleep logged		Lower difference		fn
		-	Comments
*/

/*Contentment and alertness
-	Happy, content, stable
	
		-	Overview										Higher
		-	Contentment, Tranquility, Enthusiasm			Higher
			Mental clarity, Processing speed,				Higher
			Focus, Energy, Motivation						Higher
		-	Fatigue, Sleepiness								Lower
			Anxiety, Depression, Irritation					Lower
			Confrontational, Paranoia, Clumsiness			Lower
		-	Sleep logged									Lower
		-	Exercise										More
		-	Comments
		*/


function overviewAnalysis(){
	//strLog += "Analysis main\n";
	var e;
	for(var c1=0; c1<arEntries.length; c1++){
		e = arEntries[c1];
		score = {ma: 0, caa: 0, ovd: 0};
		
		strLog += "\n\n" + e.field("Day start") + "\nscore: " + JSON.stringify(score);
		
		/*
		//Morning awakeness
		//Sleep cycle needs to come first to get first entry on wakening
		updateScoreSleepCAACycle(e);
		updateOverviewMA(e);
		updateScoreMA(e);
		updateScoreFirstIntake(e);
		updateScoreExerciseMA(e);
		
		//Contentment and alertness
		updateScoreCAA(e, MAPos, CAANeg);
		updateScoreSleepCAA(e);
		updateScoreExerciseCAA(e);
		
		//strLog += "\nend: score: " + JSON.stringify(score);
		e.set("Morning awakeness", parseFloat(score.ma.toFixed(2)));
		e.set("Contentment and alertness",  parseFloat(score.caa.toFixed(2)));
		*/
		
		//Overview duration
		//updateOverviewDuration(e);
		//e.set("Overview duration",  parseFloat(score.ovd.toFixed(2)));
		
		//Symptoms change
		//Rather than using i#, calculate using only i#[1] > i#[0], ie better or worse
		//As i# subjective, this should be more reliable
		
		
		message(c1 + " of " + arEntries.length);
	}
	
	logFile.write(strLog);
	logFile.close();
}

//rates how much I've slept on after turning off sleep cycle
function updateScoreSleepCAACycle(e){
	//strLog += "\n\nupdateScoreSleepCAACycle\nscore: " + JSON.stringify(score);
	//end times in form {h, m}
	var el = getEndLogged(e);
	if(el != null){
		endLogged = parseInt(parseFloat(el.h)) < 10 ? "0" + el.h : el.h;
		endLogged += ":" + parseInt(parseFloat(el.m)) < 10 ? "0" + el.m : el.m;
		var endSC = getEndSC(e);
		//strLog += "\nendLogged: " + JSON.stringify(endLogged) + "\nel: " + JSON.stringify(el) + "\nendSC: " + JSON.stringify(endSC);
		if(endSC != null){
			eDiff = getDiff(el, endSC);
				if(eDiff != null){
					score.ma += (3 - eDiff) / 3;
					//strLog += "\nscore: " + JSON.stringify(score);
				} else {
					//strLog += "\nupdateScoreSleepCAACycle: eDiff == null\nscore: " + JSON.stringify(score);
					return null;
				}
		}
		//strLog += "\nupdateScoreSleepCAACycle: endSC == null";
		return null;
	}
	//strLog += "\nupdateScoreSleepCAACycle: endLogged == null";
	return null;
}

//sorts the entries into time order, discards Rest entries and returns latest Sleep entry
function getEndLogged(e){
	var m, r, el, ret = [];
	//convert array to list of end times
	e.field("Sleep - night").split("\n").map((l)=>{
		if(typeof l == "string"){
			el = l.match(/Sleep @ (\d+):(\d+), (\d+)(.\d+).*/);
			if(el != null){
				//hours, should be over 24
				el[1] = parseInt(parseFloat(el[1])) + parseInt(parseFloat(el[3]));
				if(el[1] > 24){
					el[1] -= 24;
				} 
				//minutes
				el[2] = Math.round(parseFloat(el[2]) + (parseFloat(el[4]) * 60));
				if(el[2] > 60){
					el[2] -= 60;
					el[1] += 1;
				}
				r = {h: el[1], m: el[2]};
				ret.push(r);
			} else {
				return null;
			}
		} else {
			return null;
		}
	});
	if(ret.length > 0){
		//now have array of objects in ret
		r = {h: 0, m: 0};
		ret.map((l)=>{
			//if night and greated than previous, log.
			if((l.h < 12) && (l.h > r.h)){
				r = l;
			}
		});
		return r;
	} else {
		return null;
	}
}

function getEndSC(e){
	var el = e.field("Sleep Cycle data");
	el = el.match(/.* to (\d+):(\d+)/);
	if(el != null){
		var r = {h: parseInt(parseFloat(el[1])), m: parseInt(parseFloat(el[2]))};
		return r;
	} else {
		return null;
	}
}

//calculates difference in hours and returns
function getDiff(el, endSC){
	
	//strLog += "\ngetDiff: el: " + JSON.stringify(el) + " endSC: " + JSON.stringify(endSC);
	el.m -= endSC.m;
	if(el.m < 0){
		el.m += 60;
		el.h -= 1;
	}
	var res = parseFloat(((el.h - endSC.h) + (el.m / 60)).toFixed(2));
	//strLog += "\ngetDiff: res: " + res;
	if(res >= 0){
		//strLog += "\ngetDiff: res: " + res;
		return res;
	} else {
		//strLog += "\ngetDiff: Negative difference, res: " + res;
		return null;
	}
}
	
//sym [["##:##", "#"], [],...]
function getSymValMA(e, s){
	//if only one entry
	//	use that
	//else
	//	start with first (earliest) entry
	//	if entry after endLogged, (or before 04:00, meaning at the end of the day).
	//		if no stored value
	//			use that entry
	//		else
	//			use stored value
	//	else
	//		store value and check next entry

	var arSymptoms = e.field("Symptoms - current").split("\n");
	for (var a=0; a<arSymptoms.length; a++){
		var m = arSymptoms[a].match(new RegExp(".*" + s + ".*?(\\[.*\\])"));
		if(m != null){
			//strLog += "\ngetSymValMA: m: " + m;
			m = JSON.parse(m[1]);
			//if only one entry
			if(m.length == 1){
				//["12:34", "5"], return 5
				var r = parseInt(parseFloat(m[0][1]));
				//strLog += "\ngetSymValMA: length == 1\ns: " + s + " r: " + r;
				return r;
			} else {
				var val = null;
				for(var b=0; b<m.length; b++){
					//start with first (earliest) entry
					//if entry after endLogged, (or before 04:00, meaning at the end of the day).
					if((m[b] > endLogged) || (m[b] < "04:00")){
						//if no stored value
						if(val == null){
							r = parseInt(parseFloat(m[b][1]));
							//strLog += "\ngetSymValMA: no stored value\ns: " + s + " r: " + r;
							return r;
						} else {
							r = parseInt(parseFloat(val));
							//strLog += "\ngetSymValMA: stored value\ns: " + s + " r: " + r;
							return r;
						}
					} else {
						val = m[b][1];
					}
				}
			}
		}
	}
	//strLog += "\ngetSymValMA: failed to find symptom: " + s;
	return 0;
}

//"Average overview breakdown" for first entry after sleep end.
// ##:## - #, ordered from early to late.
function updateOverviewMA(e){
	//strLog += "\n\nupdateOverviewMA\nendLogged: " + endLogged;
	var o = e.field("Average overview breakdown").split("\n");
	for(var a=0; a<o.length; a++){
		//strLog += "\no[a]: " + o[a];
		if(o[a] > endLogged){
			var r = o[a].match(/\d+:\d+ - (\d+)/)[1];
			//strLog += "\nr: " + r;
			score.ma += r / 8;
			return r;
		}
	}
	//strLog += "\nupdateOverviewMA: No time found";
	return null;
}

//Score based on symptom value at end of logged sleep
function updateScoreMA(e){
	//strLog += "\nupdateScoreMA\nscore: " + JSON.stringify(score);
	MAPos.map((s)=>{
		score.ma += getSymValMA(e, s) / 5;
	});
	MANeg.map((s)=>{
		score.ma += (5 - getSymValMA(e, s)) / 5;
	});
	//strLog += "\nscore: " + JSON.stringify(score);
}

//score based on how early first major intake is.
//ideal time 08:45, implies breakfast about 08:00
//between 04:00 and 13:00
function updateScoreFirstIntake(e){
	//strLog += "\nupdateScoreFirstIntake\nscore: " + JSON.stringify(score);
	//results in 
	//    ##:##
	//intake: qty
	//FIND TIME
	var i = e.field("Intake - combined").split("\n\n");
	var is, time = "", diff;
	for(var c1 = 0; c1<i.length; c1++){
		is = i[c1].split("\n");
		//if there's enough intakes
		if(is.length > 4){
			//return time
			time = is[0].trim();
			//strLog += "\nupdateScoreFirstIntake: time: " + time;
			break;
		}
	}
	//COMPARE TIME
	time = time == "" ? "08:45" : time;
	//strLog += "\nupdateScoreFirstIntake: time: " + time;
	if(time > "11:00"){//implies something has gone wrong with code or reality.
		diff = 0;
	} else if(time > "10:00"){
		diff = 0.4;
	} else if(time > "08:45"){
		diff = 0.75
	} else if(time > "06:30"){
		diff = 1;
	} else { //implies something has gone wrong with code or reality.
		diff = 0;
	}
	//strLog += "\nupdateScoreFirstIntake: diff: " + diff;
	score.ma += diff;
	//strLog += "\nupdateScoreFirstIntake\nscore: " + JSON.stringify(score);
}

//comparess amount of exercise with ideal
function updateScoreExerciseMA(e){
	//strLog += "\nupdateScoreExerciseMA\nscore: " + JSON.stringify(score);
	var ex = e.field("Exercise breakdown").split("\n\n");
	var time, exL;
	for(var c1=0; c1<ex.length; c1++){
		exLines = ex[c1].split("\n");
		time = exLines[0].match(/(\d+:\d+).*/);
		//if we've a timestamp and it's before 10:00
		if((time != null) && (time[1] < "10:00")){
			//strLog += "\nupdateScoreExerciseMA: time: " + time;
			//for each exercise
			for(var c2=0; c2<arExercises.length; c2++){
				exL = ex[c1].match(new RegExp("^(\\d+)\\s+" + arExercises[c2].n));
				if(exL != null){
					//strLog += "\nupdateScoreExerciseMA: exL" + JSON.stringify(exL);
					score.ma += exL[1] / arExercises[c2].i;
				}
			}
		}
	}
	//strLog += "\nupdateScoreExerciseMA\nscore: " + JSON.stringify(score);
}

//turns "hh:mm" into {h: hh, m: mm}
function timeStringToObject(ts){
	ts = ts.match(/(\d+):(\d+)/);
	if(ts != null){
		return {
			h: parseFloat(ts[1]),
			m: parseFloat(ts[2])
		};
	} else {
		//strLog += "\ntimeStringToObject failed with " + ts;
		return null;
	}
}

//slightly different math to getDiff
//inputs t0, t1 == ##:##
function getSpan(t0, t1){
	strLog += "\ngetSpan: t0: " + t0 + ", t1: " + t1;
	t0 = timeStringToObject(t0);
	t1 = timeStringToObject(t1);
	strLog += "\ngetSpan: t0: " + JSON.stringify(t0) + "\nt1: " + JSON.stringify(t1);
	var r = {h: 0, m: t1.m - t0.m};
	if(r.m < 0){
		r.m += 60;
		r.h -= 1;
	}
	r.h += t1.h - t0.h;
	if(r.h < 0){
		r.h += 24;
	}
	strLog += "\ngetSpan 1: r: " + JSON.stringify(r);
	r = parseFloat((r.h + (r.m / 60)).toFixed(2));
	strLog += "\ngetSpan 2: r " + r;
	return r;
}

//for a given entry and symptom, finds symptom and creates a score of time duration * symptom intensity
//returns this corrected to 0-1
function getSymValCAA(e, s){
	
	var arSymptoms = e.field("Symptoms - current").split("\n");
	for (var a=0; a<arSymptoms.length; a++){
		var m = arSymptoms[a].match(new RegExp(".*" + s + ".*?(\\[.*\\])"));
		if(m != null){
			//strLog += "\ngetSymValCAA: m: " + m;
			m = JSON.parse(m[1]);
			//strLog += "\ngetSymValCAA: m: " + JSON.stringify(m);
			//if only one entry
			if(m.length == 1){
				var r = parseInt(parseFloat(m[0][1]));
				//strLog += "\ngetSymValCAA: length == 1\ns: " + s + " r: " + r;
				return r;
			} else {
				//rework to edit times of first and last entries of array.
				
				var t = "04:00";
				var sc = 0;
				for(var c1=0; c1<m.length; c1++){
					//strLog += "\ngetSymValCAA: val: " +  parseInt(parseFloat(m[c1][1]));
					sc += getSpan(t, m[c1][0]) * parseInt(parseFloat(m[c1][1]));
					t =  m[c1][0];
				}
				//strLog += "\nngetSymValCAA: last val: " +  parseInt(parseFloat(m[m.length -1][1]));
				sc += getSpan(t, "03:59") * parseInt(parseFloat(m[m.length -1][1]));
				var r = sc / 24;
				//strLog += "\ngetSymValCAA:\ns: " + s + " r: " + r;
				return r;
			}
		}
	}
	//strLog += "\ngetSymValCAA: no match for symptom " + s;
	return 0;
}

//updates to CAA pos and neg symptoms
function updateScoreCAA(e, MAPos, CAANeg){
	//strLog += "\nupdateScoreCAA\nscore: " + JSON.stringify(score);
	MAPos.map((s)=>{
		score.caa += getSymValCAA(e, s) / 5;
	});
	CAANeg.map((s)=>{
		score.caa += (5 - getSymValCAA(e, s)) / 5;
	});
	//strLog += "\nupdateScoreCAAscore: " + JSON.stringify(score);
}

//assume 6hrs max sleep during day.
function updateScoreSleepCAA(e){
	//strLog += "\nupdateScoreSleepCAA\nscore: " + JSON.stringify(score);
	var s = e.field("Sleep - total day");
	if(s > 6){
		s = 6;
	}
	score.caa += (6 - s) / 6;
	//strLog += "\nupdateScoreSleepCAA\nscore: " + JSON.stringify(score);
}

//comparess amount of exercise with ideal
function updateScoreExerciseCAA(e){
	//strLog += "\nupdateScoreExerciseCAA\nscore: " + JSON.stringify(score);
	var ex = e.field("Exercise breakdown").split("\n\n");
	var time, exL;
	for(var c1=0; c1<ex.length; c1++){
		exLines = ex[c1].split("\n");
		time = exLines[0].match(/(\d+:\d+).*/);
		//if we've a timestamp
		if((time != null)){
			//strLog += "\nupdateScoreExerciseCAA: time: " + time;
			//for each exercise
			for(var c2=0; c2<arExercises.length; c2++){
				exL = ex[c1].match(new RegExp("^(\\d+)\\s+" + arExercises[c2].n));
				if(exL != null){
					//strLog += "\nupdateScoreExerciseCAA: exL" + JSON.stringify(exL);
					score.caa += exL[1] / arExercises[c2].i;
				}
			}
		}
	}
	//strLog += "\nupdateScoreExerciseCAA\nscore: " + JSON.stringify(score);
}

//updates duration * overview value, 0 - 1
function updateOverviewDuration(e){
	var ov = e.field("Average overview breakdown").split("\n");
	strLog += "\nupdateOverviewDuration: ov:\n" + JSON.stringify(ov);
	if(ov.length > 0){
		var r, l;
		var re = new RegExp("(\\d+:\\d+) - (\\d+)");
		//format ##:## - #
		if(ov.length == 1){
			r = parseFloat((parseFloat(ov[0].match(re)[2]) / 8).toFixed(2));
			if(isNaN(r)){
				strLog += "\nupdateOverviewDuration: non-numeric overview";
			} else {
				strLog += "\nupdateOverviewDuration: r: " + r;
				score.ovd = r;
			}
		} else {
			var t = "04:00";
			var sc = 0;
			for(var c1=0; c1<ov.length; c1++){
				strLog += "\nupdateOverviewDuration: ov[c1]: " + ov[c1];
				l = ov[c1].match(re); 
				strLog += "\nupdateOverviewDuration: l: " + l;
				sc += getSpan(t, l[1]) * parseFloat(l[2]);
				t =  l[1];
			}
			sc += getSpan(t, "03:59") * parseInt(parseFloat(ov[ov.length -1].match(re)[2]));
			r = sc / 24;
			strLog += "\nupdateOverviewDuration:\nr: " + r;
			score.ovd = r;
		}
	}
}

//for a given entry and symptom, finds symptom and creates a score of time duration * symptom intensity
//returns this corrected to 0-1
function getSymChange(e, s){
	
	var arSymptoms = e.field("Symptoms - current").split("\n");
	for (var a=0; a<arSymptoms.length; a++){
		var m = arSymptoms[a].match(new RegExp(".*" + s + ".*?(\\[.*\\])"));
		if(m != null){
			//strLog += "\ngetSymChange: m: " + m;
			m = JSON.parse(m[1]);
			//strLog += "\ngetSymChange: m: " + JSON.stringify(m);
			//if only one entry
			if(m.length == 1){
				var r = 0;
				//strLog += "\ngetSymChange: length == 1\ns: " + s + " r: " + r;
				return r;
			} else {
				//rework to edit times of first and last entries of array.
				
				var ch;
				var sc = 0;
				for(var c1=1; c1<m.length; c1++){
					ch = parseFloat(m[cl][1]) > parseFloat(m[cl-1][1]);
					//strLog += "\ngetSymChange: val: " +  parseInt(parseFloat(m[c1][1]));
					if(ch > 0){
						sc++;
					} else if(ch < 0){
						sc--;
					} 
				}
				//strLog += "\nngetSymChange: last val: " +  parseInt(parseFloat(m[m.length -1][1]));
				//strLog += "\ngetSymChange:\ns: " + s + " r: " + r;
				return sc;
			}
		}
	}
	//strLog += "\ngetSymChange: no match for symptom " + s;
	return 0;
}


try{		
	overviewAnalysis();		
}
catch(error){
	var e = new Error("Rethrowing the " + error.message + " error");
	strLog += "\n\n" + JSON.stringify(error);
	logFile.write(strLog);
	logFile.close();
	throw e;
}	
message("Analysis updated 2020-09-08 14:21");	
