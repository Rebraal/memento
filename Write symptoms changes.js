//reads the graph data entries, then updates a log file and the Status database
//0830 11-28	S0, C1, E2
//0930 11-28	S1, C2, E3
//1030 10-01	S2, C3, E4 - date pre daylight saving
//maps to all:
//S1
//C0
//E2

//2020-07-19 REWORK
//to ensure that symptoms are added to the list when they aren't present
//to allow a blanket level to be set across a time period, eg yyyy-mm-dd hh:mm1 to yyyy-mm-dd hh:mm, i0

/*
yyyy-mm-dd hh:mm ++++
constant
yyyy-mm-dd hh:mm
yyyy-mm-dd hh:mm
yyyy-mm-dd hh:mm
yyyy-mm-dd hh:mm
constant
yyyy-mm-dd hh:mm ++++


2020-08-05 2200
Not working. Debug. Probably strip out entry creation entirely. Likely stupidity in comparing dates. Make sure dateStamp format being used for everything.

2020-08-06 1100
Reworked to throw error instead of creating new entry. Now to check behaviour
*/



var changes, changeStr = "";
var graphEntries = lib().entries();
var graphChar = "+";
var statusEntries;
var editDateWriteSymptomsChanges = "2023-07-29 1522"

//main function stream
updateStatus();


function updateStatus(){
	message("Write symptoms changes started");
	var objEntry;
	graphEntries.map((graphEnt)=>{
		
		if(graphEnt.field("Processed") == false){
			//read graph and parse to array of objects
			objEntry = readEntry(graphEnt);
			
			objEntry = parseEntry(objEntry);
			
			//update the change log and statusEntries
			updateAll(objEntry);
			
			//entry cannot be deleted, so use filter
			cleanUp(graphEnt);
		}
	});
	changes.write(changeStr);
	changes.close();
}

function readEntry(entry){
	changes = file("/storage/emulated/0/memento/Symptoms graph/Changes/Changes " + entry.field("Date").replace(":", "") + " " + entry.field("Symptom") + ".txt");
	changeLog("readEntry\n");
	
	var objEntry = {library	: entry.field("Library"),
					date	: entry.field("Date"),
					symptom	: entry.field("Symptom"),				
					};	
	objEntry.lines = entry.field("Graph").split("\n");	
	changeLog(JSON.stringify(objEntry) + "\nread\n");
	return objEntry;
}

function parseEntry(objEntry){
	
	//$1 = ####-##-## ##:## and some spaces
	//$2 = whatever gc is, (escaped), and some of it,
	//any white spaces afterwards
	re = new RegExp("(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2})\\s*" + "(\\" + graphChar + "*)\\s*");
	var result, val = null, date, entryVal;
	objEntry.entries = [];

	changeLog("\nparseEntry\n");

	objEntry.lines.map((line)=>{
		//check for i#							
		if((result = line.match(/i(\d)/)) != null){
			val = result[1];
		//check for e or end
		} else if((result = line.match(/e$|end$/)) != null){
			val = null;
		} else if(line.trim() == ""){
			result = "null string"
		} else if((result = line.match(re)) != null){
			objEntry.entries.push({	date 	: result[1],
									//i#
									entryVal: val == null ? "i" + result[2].length : "i" + val
									});
		} else {
			changes.write(	changeStr + 
							"\nWrite symptoms changes - dev.js: parseEntry: invalid line in graph: symptom\n" +
							objEntry.symptom + "\nline: " + line + 
							"end of error"
							);
			changes.close();
			throw new Error("Write symptoms changes - dev.js: parseEntry: invalid line in graph");
		}
		changeLog("val: " + val + "\nresult: " + JSON.stringify(result) + "\n");
	});
	changeLog("\nobjEntry:\n" + JSON.stringify(objEntry) + "\nparsed\n");
	return objEntry;
}

function updateAll(objEntry){
	changeLog("\nupdateAll\n");
	var str = 	objEntry.library + "\n" + 
				objEntry.date + "\n" +
				objEntry.symptom + "\n\n";	
	changeLog(str);
	objEntry.entries.map((lineObj)=>{
		changeLog(	"update " + 
					lineObj.date + " " +
					lineObj.entryVal + "\n"
					);
		entry = findEntry(objEntry.library, lineObj.date);
		if(entry != null){
			changeLog("found entry");
			updateEntry(entry, objEntry.symptom, lineObj.entryVal);
		} else {
			changes.write(changeStr);
			changes.close();
			throw new Error("Write symptoms changes - dev.js: updateAll: \nentry not found: " + lineObj.date + "\nin library: " + objEntry.library);
		}
	});
}

function findEntry(lib, date){
	changeLog("\nfindEntry\n");
	statusEntries = libByName(lib).entries();
	log("findEntry:\nlib: " + lib + "\nlen: " + statusEntries.length);
	changeLog("\nstatusEntries.length " + statusEntries.length + "\n");
	changeLog("date " + date + "\n");
	
	//loop through all entries in the library until the correct dateStamp is found
	var entry = null;
	for(var a=0; a<statusEntries.length; ++a){
		log("findEntry:\n" + statusEntries[a].field("Date stamp") + "\n" + date + "\ntest: " + (statusEntries[a].field("Date stamp") == date));
		if(statusEntries[a].field("Date stamp") == date){
			entry = statusEntries[a];
			break;
		}
	}
	return entry;
}

function updateEntry(entry, sym, ev){
	changeLog("\nupdateEntry\nstrSymptoms\n");
	var strSymptoms = entry.field("Symptoms - current");
	//changeLog(strSymptoms);
	//search and replace symptom
	//escape the special characters...
	sym = sym.replace(/\*/g, "\\*");
	var re = "(" + sym + "\\s+)" + "(i[0-5])";
	re = new RegExp(re);
	changeLog("re: " + re + "\nev: " + ev);
	var result = strSymptoms.replace(re, (matchedString, first, second)=>{
		//changeLog("first " + first + "\nsecond " + second + "\nval " + ev + "\n");
		return first + ev;
	});
	//changeLog("result " + JSON.stringify(result) + "\n");
	
	//if there is a replacement, use the result of the replacement
	if(result != strSymptoms){
		changeLog("\nresult: " + JSON.stringify(result));
		entry.set("Symptoms - current", result);
	//else, tack the symptom value on to the end, as order doesn't matter.	
	} else {
		changeLog("\nresult: no match");
		entry.set("Symptoms - current", 
					(strSymptoms + "\n" + 
					sym + " " + ev).split("\n").sort().join("\n")
					);
		entry.set(	"Symptoms - inactive", 
					entry.field("Symptoms - inactive").replace(new RegExp(sym + "\\s\*\n"), "").split("\n").sort().join("\n")
					);
	}
	changeLog("\nsymptoms updated\n" + entry.field("Symptoms - current") + "\n");
}

function cleanUp(graphEnt){
	//graphEnt.set("Processed", true);
 graphEnt.trash();
}

function changeLog(txt){
	if((txt.length > 50) && (txt.match("\n") != null)){
		txt = txt.split(",").join("\n");
	}
	changeStr += txt;
}

log("Write symptoms changes - dev.js" + editDateWriteSymptomsChanges);
