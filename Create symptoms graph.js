//edit multiple previous entries - single symptom.
//display as edittable graph
//DEPENDENCIES:
//D:\Google Drive Sync\Programs\Memento - Standardising\DATE.js or 
//https://raw.githubusercontent.com/Rebraal/memento/master/DATE.js (minified version now exists)


//note when constructing RegExps from strings, I need to check for special characters and escape them.

/*
2020-08-03
2015
Updated code to automatically create entries from editting Current status
Need to also rework to use DATE

2115
Falling over somewhere with the regexp in createSymptomGraph. Graphs are being created with all i# as 0

2020-08-05 1100
Solved - Status - B, D onClose was sending the full symptoms line including i# and £, so was messing up the regexp.
*/

var fileDate = new DATE(new Date()).dateStamp;
var backup = file("/Memento/Symptoms graph/Backup/Backup " + fileDate + ".txt");
var dstLog = file("/Memento/Symptoms graph/dstLog.txt");

var graphLibrary = libByName("Symptoms graphing");

//this is the library to edit
var symptomEntries = [], sourceEntries, workingEntries;
var entryDate;

var arDataToGraph = [];
var strBackup = "";
//this character is what the graph looks like, ie +, ++, +++, ++++, +++++
var graphChar = "+";


//main function sequence
function createAllSymptomGraphs(ed, symptomsGraph){
	log("createAllSymptomGraphs called");
	entryDate = ed;
	readSymptoms(symptomsGraph);
	createGraphEntries();
	backup.close();
	log("graph entries created");
	return "Graph entries created";
}
//end main function sequence

//reads the smptoms list and creates graph entries for each symptom
function readSymptoms(symptomsGraph){
		//creates a sortable mask for the library of entries - library can't be sorted directly.
		log("readSymptoms:\n" + JSON.stringify(symptomsGraph));
		
		sourceEntries = libByName(symptomsGraph[0].library).entries();
		sourceEntries.map((ent, i)=>{
			symptomEntries.push({i: i, date: ent.field("Date stamp")});
		});
		symptomEntries = symptomEntries.sort((a, b)=>{
		if(a.date > b.date){
			return -1;
		} else {
			return 1;
		}
		});
		
	//creates graph info for all symptoms	
	symptomsGraph.map((obj)=>{
		graph = createSymptomGraph(obj.symptom, obj.edit);
		log("readSymptoms: obj.symptom: " + obj.symptom);
		arDataToGraph.push({	Library	:	obj.library,
								Date	:	fileDate,
								Symptom : 	obj.symptom,
								Graph	:	graph.graph,
								Log		:	graph.log
							});
	});
}

//creates graph entries for each symptom
function createGraphEntries(){
	var data;
	arDataToGraph.map((data)=>{
		graphLibrary.create(data);
		strBackup += "*" + data.Symptom + "\n\n" + data.Log + "\n\n";
	});
	
	backup.write(strBackup);
}

//creates graph entry for a single symptom
//graph is STAMP + - +++++
//log is STAMP i#
function createSymptomGraph(symptom, edit){
	//loop through symptomLibrary, storing each occurrence of symptom into array
	//parse symptom into:
	//	date	time	value (o - oooooo)
	var strGraph = "";
	var strLog = "";
	var strSymptoms, result, entry, stepBack, startDate;
	log("\ncreateSymptomGraph: edit: " + edit);
	//symptom followed by an "i" and a digit (0-5), not followed by an " x"
	//var re = new RegExp(symptom + " i[0-5]" + "(?! x)");
	//replace all "*" with "\*", as * is a special character
	var regSymptom = symptom.replace(/\*/g, "\\*");
	//as above, but splitting return into "symptom", "i value", "value", "other stuff"
	var re = new RegExp("(" + regSymptom + ")" + "( i([0-5]))?" + "(.*)?");
	strLog += re + "\n";
	/*returns [	0: complete match
				1: symptom
				2: " i#"
				3: #
				4: other stuff
				]
	*/
	
	//create workingEntries here by filtering symptomEntries
	stepBack = edit.match(/£\s*(?=(\d*))/)[1];
	log("\ncreateSymptomGraph: stepBack: " + stepBack + 
		"stepBack == \"\"" + (stepBack == "")
		);
	if(stepBack == ""){
		log("\ncreateSymptomGraph: no valid stepBack, defaulting");
		startDate = DATE_dateSubtract(new DATE(entryDate), 2).dateStamp;
	} else {
		log("\ncreateSymptomGraph: valid stepBack");
		startDate = DATE_dateSubtract(new DATE(entryDate), stepBack).dateStamp;
	}
	workingEntries = symptomEntries.filter((ent)=>{
		if(ent.date > startDate){
			return ent;
		}
	});
	
	log("\ncreateSymptomGraph: stepBack: " + JSON.stringify(stepBack) + 
		"\nstartDate: " + startDate + 
		"workingEntries:\n" + JSON.stringify(workingEntries)
		);
	
	
	//workingEntries = symptomEntries;
	
	for(var a=0; a<workingEntries.length; ++a){
		//this should return the right entry in the right order.
		entry = sourceEntries[workingEntries[a].i];
		strSymptoms = entry.field("Symptoms - current");
		//search the symptoms field as a whole
		result = strSymptoms.match(re);
		//if there is no match
		if(result == null){
			//add an entry with value 0
			strGraph += entry.field("Date stamp") + "\n";
			strLog 	+= 	entry.field("Date stamp") + "\n";
		//if there is something after the i# and it isn't white space
		} else if(	result[4] != undefined &&
					result[4].trim() != ""
				){
			strGraph += entry.field("Date stamp") + " ERROR\n";
			strLog += 	entry.field("Date stamp") + result[0] + " ERROR\n";
		//otherwise, there is a result, and there is no error	
		} else {
			//display timestamp and value of graph
			strGraph +=	entry.field("Date stamp") + " " + graphChar.repeat(parseInt(result[3])) + "\n";
			strLog 	+=	entry.field("Date stamp") + " " + result[2].trim() + "\n";
		}
	}
	return {graph: strGraph.slice(0, -1), log: strLog.slice(0, -1)};
}

log("Create symptoms graphs.js 2020-08-06 14:12");
