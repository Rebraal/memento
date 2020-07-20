//edit multiple previous entries - single symptom.
//display as edittable graph
//Dependencies: DATE.js from github

//note when constructing RegExps from strings, I need to check for special characters and escape them.

//2020-07-19 REWORK 
//to allow Status B, D - On close to write graph files directly.
//to allow a x day limit on how far back the library is constructed
//to use DATE

var fileDate = new DATE(new Date()).dateStamp;
var backup = file("/storage/emulated/0/memento/Symptoms graph/Backup " + fileDate + ".txt");
var dstLog = file("/storage/emulated/0/memento/Symptoms graph/dstLog.txt");

var arSymptomsToGraph;
var graphLibrary = libByName("Symptoms graphing");

//this is the library to edit
//var symptomsLibraryName = "2019-10-01 Copy";
var symptomLibrary, symptomEntries = [], arEntries;

var arDataToGraph = [];
var strBackup = "";
//this character is what the graph looks like, ie +, ++, +++, ++++, +++++
var graphChar = "+";

//symptomsToGraph = {s: symptom, l: time limit}
function writeSymptomsGraph(libName, symptomsToGraph){
	
	message("Editing " + symptomsLibraryName);
	log("writeSymptomsGraph called: " + libName + "\n" + JSON.stringify(symptomsToGraph));
	
	arSymptomsToGraph = symptomsToGraph;
	symptomLibrary = libByName(libName);
	arEntries = symptomLibrary.entries();
	
	//sort arEntries by most recent first
	arEntries.map((ent, i)=>{
		symptomEntries.push({i: i, date: ent.field("Date stamp")});
	});
			
	symptomEntries = symptomEntries.sort((a, b)=>{
		if(a.date > b.date){
			return -1;
		} else {
			return 1;
		}
	});
	
	
	//main function sequence
	readSymptoms();
	createGraphEntries();
	fileSymptoms.close();
	backup.close();
	//end main function sequence
}


//reads the smptoms list and creates graph entries for each symptom
function readSymptoms(){
	var graph;
	arSymptomsToGraph.map((sym)=>{
		graph = createSymptomGraph(sym);
		arDataToGraph.push({	Library	:	symptomsLibraryName,
								Date	:	fileDate,
								Symptom : 	sym.s,
								Graph	:	graph.graph,
								Log		:	graph.log
							});
	});
}

//creates graph entries for each symptom
function createGraphEntries(){
	arDataToGraph.map((data)=>{
		graphLibrary.create(data);
		strBackup += "*" + data.Symptom + "\n\n" + data.Log + "\n\n";
	});
	
	backup.write(strBackup);
}

//REWORK THIS ROUTINE
//creates graph entry for a single symptom
//graph is STAMP + - +++++
//log is STAMP i#
function createSymptomGraph(data){
	var limit;
	var symptom = data.s;
	//if the limit isn't a useful string
	if((typeof data.l != "string") || (data.l == "")){
		//grab the date from the last entry - ie use all the entries
		limit = symptomEntries[new DATE(symptomEntries.length-1].date).dateStamp;
	} else {
		//subtract limit from earliest date in entries
		limit = dateSubtract(new DATE(symptomEntries[0].date).dateStamp, date.l);
	}
	var d = "", ds = "", entry;
	//loop through symptomLibrary, storing each occurrence of symptom into array
	//parse symptom into:
	//	date	time	value (o - oooooo)
	var strGraph = "";
	var strLog = "";
	var strSymptoms, result, entry;
	//symptom followed by an "i" and a digit (0-5), not followed by an " x"
	//var re = new RegExp(symptom + " i[0-5]" + "(?! x)");
	//replace all "*" with "\*", as * is a special character
	var regSymptom = symptom.replace(/\*/g, "\\*");
	//as above, but splitting return into "symptom", "i value", "value", "other stuff"
	var re = new RegExp("(" + regSymptom + ")" + "( i([0-5]))?" + "(.*)?");
	strLog += re;
	/*returns [	0: complete match
				1: symptom
				2: " i#"
				3: #
				4: other stuff
				]
	*/
		
	symptomEntries.map((index, a)=>{
		entry = arEntries[index];
		d = new DATE(entry);
		ds = d.dateStamp;
		strSymptoms = entry.field("Symptoms - current");
		//if entry is more recent than the limit
		if(ds > limit){
			//search the symptoms field as a whole
			result = strSymptoms.match(re);
			//if there is no match
			if(result == null){
				//add an entry with value 0
				strGraph += ds + "\n";
				strLog 	+= 	ds + "\n";
			//if there is something after the i# and it isn't white space
			} else if(	result[4] != undefined &&
						result[4].trim() != ""
					){
				strGraph += ds + " ERROR\n";
				strLog += 	ds + result[0] + " ERROR\n";
			//otherwise, there is a result, and there is no error	
			} else {
				//display timestamp and value of graph
				strGraph +=	ds + "  " + graphChar.repeat(parseInt(result[3])) + "\n";
				strLog 	+=	ds + "  " + result[2].trim() + "\n";
			}
		}
	});
	return {graph: strGraph, log: strLog};
}

//2020-19-20 20:45
