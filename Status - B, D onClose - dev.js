//On close

var entRef = libByName("References").entries()[0];

var fileSymptoms = file("/storage/emulated/0/memento/Symptoms graph/Symptoms fields.txt");
fileSymptoms.write(lib().title + "\n");

var arAllIntakes = [
"Intake - liquid",
"Intake - vegetables",
"Intake - meat and fish",
"Intake - fruit",
"Intake - nuts",
"Intake - misc"
];

var strRet = "", msg = "";
var symptomsGraph = [], symptomsErrors = "";


function onClose(){

	message("onClose" +
	"\nDeveloping:\n" +
	"2020-08-03 19:00"
	);

	entry().set("Date stamp", new DATE(entry()).dateStamp);

	intakes(arAllIntakes);

	symptoms();

	supplements();
	
	if(symptomsErrors != ""){
		log("symptomsErrors:\n" + symptomsErrors);
		throw new Error(symptomsErrors);
	} else {
		message("onClose end");
	}
}

//INTAKE
//Takes editted intakes and compares them to the stored version
//Stores only intaken foods
//Updates reference file with new foods
//	deletes content of intake
//	deletes content of temporary intakes
function intakes(){
	
	//Name of field to work with
	var strFldNm;
	//contents of field
	var strToParse, arToParse;
	//contents of references
	var strRef, arRef;
	var arOP;

	for(var a=0; a<arAllIntakes.length; ++a){
		//get the field name, field value and reference value
		strFldNm = arAllIntakes[a];
		strToParse = entry().field(strFldNm).trim();
		strRef = entRef.field(strFldNm);
		

		//check if string is empty, if so, move on
		if(strToParse == ""){
			entry().set(strFldNm, "")
			return;
		}  else {
		//update stuff.
			arToParse = intakeRead(strToParse);
			//we do need to get the field contents from the reference library
			//and check nothing has been added. To remove content, or alter xx# numbers,
			//the reference library must be editted
			arRef = intakeRead(entRef.field(strFldNm));
			
			arOP = intakeUpdateWhitespace(intakeSort(intakeUnique(arToParse.concat(arRef))));
			entry().set(strFldNm, intakeOutput(arOP, true));
			entRef.set(strFldNm, intakeOutput(arOP, false));
			strRet += strFldNm + "\n";
		}				
	}//for all intakes in array
	
	return;
}//intakes

//INTAKE FUNCTIONS
//reads a complete field of intakes (string) and converts to an array of intake objects
//using parseIntake(), returns an array of intake objects
function intakeRead(str){
			
	var arIntake = str.split("\n");
	var arToSort = [];

	//fills arToSort with intake objects
	for(var a = 0; a<arIntake.length; ++a){
		//ensures the line isn't empty
		if(arIntake[a].trim() != ""){
			arToSort.push(parseIntake(arIntake[a]));
			}//if
	}//for
	return arToSort;
}//function intakeRead
			
//takes a single intake string and returns an intake object
function parseIntake(str){

//var obj = new Object();
var intA, intB, intC, intD, intE, intF, ret;

//declaring the object this way controls the order that the keys display in
var obj = {
	ind: "",
	alg: "",
	ws: "",
	sub: "",
	qty: "",
	len: 0,
};

//index
//locate "#"
intA = str.indexOf("#") + 1;
//if it exists, get all characters before and including it
if(intA > 0){
	obj["ind"] = str.substring(0, intA) + " ";
} else {
	obj["ind"] = "99# ";
}

//allergens
//locate "*"
intB = str.indexOf("*");
//if it exists, get string between it and the next "*"
if(intB >= 0){
	intC = str.indexOf("*", intB + 1) + 1;
	obj["alg"] = str.substring(intB, intC) + " ";
}

//whiteSpace 
//if there is an allergen, start from there
if(intC >= 0){
	//strip beginning of string away from the alg
	str = str.substring(intC);
//otherwise use the index as the start of the string
} else if(intA > 0){
	str = str.substring(intA);
}
//with a stripped string, we can now search for the next non whitespace character
intD = str.search(/\S/);
obj["ws"] = str.substring(0, intD);

//substance
intE = str.indexOf(":") + 1;
obj["sub"] = str.substring(intD, intE) + " ";
	
//quantity
//the replace() in this is equivalent to string.trim();
//replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
str = str.substring(intE).trim(); 
if(str != ""){
	obj["qty"] = str;
}

obj["len"] = 	obj.ind.length + 
				obj.alg.length + 
				obj.sub.length;

return obj;
}//parseIntake
			
//Strip duplicate values of intake.sub from array, removing the second instance
function intakeUnique(ar){
//This line creates a copy of the array which seems to be needed by memento,
//returning ar doesn't seem to work
var a = ar.concat();
for(var i=0; i<a.length; ++i){
	for(var j=i+1; j<a.length; ++j){
		if(a[i].sub == a[j].sub)
			a.splice(j--, 1);
		}		
	}
return a;
}//function intakeUnique

//sorts an array of intake objects and returns sorted array
//remove all output functions
function intakeSort(arToSort){

var  arSorted = [];

arSorted = arToSort.sort(intakeSort);

//compare function to be used in sort.
function intakeSort(a, b){
	//Check the index first
	if(a.ind < b.ind){
		return -1;
	}
	if(a.ind > b.ind){
		return 1;
	}
	//if index is equal
	if(a.sub < b.sub){
		return -1;
	}
	if(a.sub > b.sub){
		return 1;
	}
	return 0;
}//function intakeSort
	
return arSorted;
}//function arrayIntakeSort	
		
//updates the whitespace in an array of intake objects, returns an updated array of objects
//takes an array of intake objects
//note that this leaves the len and lws keys incorrect. This shouldn't matter, as the object will 
//shortly be discarded
function intakeUpdateWhitespace(arToUpdate){

var max = 0;
var ar = arToUpdate;

//gets maximum of length of intake objects
//given len = overall length - whiteSpace length
for(var a=0; a<ar.length; ++a){
	var len = ar[a].len;
	if(len > max){
		max = len;
	}//if
}//for

//set whiteSpace
for(var a=0; a<ar.length; ++a){
	ar[a].ws = " ".repeat(max - ar[a].len);
}//for

return ar;

}//function outputIntake
		
//takes an array of intake objects and converts them to a string, ready to be output to a field
//returns a string.
//ar is input array of intake objects. quantity is boolean
//if quantity is true, output ONLY objects with a quantity, and output their qty
//ELSE, output all objects, with no qty
function intakeOutput(ar, quantity){

	var strOP = "";
	
	//if quantity true, only output objects with a quantity
	if(quantity){
	//for each intake object		
		for(var a=0; a<ar.length; ++a){
			//if there is a qty 
			if(ar[a].qty != ""){
					//add the contents of the object to the output string
					strOP += 	ar[a].ind + 
								ar[a].alg + 
								ar[a].ws + 
								ar[a].sub +
								ar[a].qty +
								"\n";
			}//if qty
		}//for
	} else {
	//for each intake object		
		for(var a=0; a<ar.length; ++a){
			//add the contents of the object to the output string
			strOP += 	ar[a].ind + 
						ar[a].alg + 
						ar[a].ws + 
						ar[a].sub +
						"\n";
			
		}//for
	}//else
		
	return strOP;

}//function arrayIntakeOutput

//SYMPTOMS
//Takes editted symptoms and processes
//Trims anything before the two digit symptom index, ##
//Deletes any symptoms marked for deletion, adding them to old inactive symptoms
//Removes any intensity level, i#, markers from new inactive symptoms
//See Parse old symptoms for documentation
function symptoms(){
	
var fldSC = "Symptoms - current";
var fldSI = "Symptoms - inactive";


//get the symptoms strings before editting
var strSC = entry().field(fldSC), strSI = entry().field(fldSI);

	//split current current and inactive symptoms into an array of strings, split at a new line character
	var arOSC = strSC.split("\n"), arOSI = strSI.split("\n");
	var i, j, res;
	var arNSC = [], arNSI = [];
	var z = {all: 0, symptom: 1, intensity: 2, del: 3, edit: 4};

	//for each string in Old Symptoms Current
	for(var n=0; n<arOSC.length; ++n){
		var s = arOSC[n].trim();
		//if for edit
		//(symptom, anything)(intensity)(deletion, optional)(edit, optional)
		res = s.match(/(.*)(\si[0-9])(\s*x)?\s*(£.*)?/);
		if(res != null){
			//if edit
			if(res[z.edit] != undefined){
				fileSymptoms.write(res[z.symptom] + "\n");
				symptomsGraph.push({library: lib().title, symptom: res[z.symptom], edit: res[z.edit]});
			}
			//if deletion
			if(res[z.del] != undefined){
				//Add result to the new Symptoms - inactive, minus intensity
				arNSI.push(res[z.symptom]);
			} else {
			//if no deletion command, store in new Symptoms  - current.
				arNSC.push(res[z.symptom] + res[z.intensity]);
			}
		//failed symptom sntax	
		} else {
			arNSC.push(s);
			symptomsErrors += "Error: " + s + "\n";
		}
	}//for n in array

	//For each string in old Symptoms - inactive
	//if there is an i level, add to new Symptoms - current
	//otherwise, add it to new Symptoms - inactive
	for(var n=0; n<arOSI.length; ++n){
		var s = arOSI[n];
		var i = s.search(/\si[0-9]/);
		if(i > -1){
			arNSC.push(s);
		} else {
			arNSI.push(s);
		}
	}


	//Strip anything before the ## location code from both arrays - SortCode
	//remove duplicates from both arrays - Unique
	//then sort. Due to ## code, 01 sorts correctly in ascending alphanumeric - sort()
	//then add the newline characters at the right place - NewLine
	arNSC = arrayAdjustNewLine(arrayUnique(arrayAdjustSortCode(arNSC)).sort());
	arNSI = arrayAdjustNewLine(arrayUnique(arrayAdjustSortCode(arNSI)).sort());

	//set the new fields to the new array values
	//Currently we only have arrays, so stringify with join("") ["Hi", "There"] => "HiThere"
	entry().set(fldSC, arNSC.join(""));
	entry().set(fldSI, arNSI.join(""));
	
	csg(symptomsGraph);
	return;

}//function symptoms
	
	
//SYMPTOMS FUNCTIONS
//Strip anything before the ## location code
//Probably doesn't work
function arrayAdjustSortCode(ar){
	var a = ar.concat();
	for(var i=0; i<a.length; ++i){
		var s = a[i];
		var j = s.search(/[0-9][0-9]/);
		//So if the first two characters are not numbers, 
		if(j > 0){
			//Chop them off
			s = s.substring(j);
		}
	}
return a;
}

//Strip duplicate values from an array
function arrayUnique(ar){
	//This line creates a copy of the array which seems to be needed by memento,
	//returning ar doesn't seem to work
	var a = ar.concat();
	for(var i=0; i<a.length; ++i){
		for(var j=i+1; j<a.length; ++j){
			if(a[i] === a[j])
				a.splice(j--, 1);
		}		
	}
return a;
}

//Insert "\n" characters at the end of each of the elements (strings) in an array, excepting the last element
function arrayAdjustNewLine(ar){
	var a = ar.concat();
	for(i=0; i<a.length-1; ++i){
		a[i] = a[i]+"\n";
	}
return a;
}

//Cut off i[0-9] from end of strings in array
function arrayAdjustILevel(ar){
	var a = ar.concat();
	for(var i=0; i<a.length; ++i){
		var s = a[i];
		var j = s.search(/\si[0-9]/);
		if(j > 0){
			a[i] = s.substring(0, j);
		}
	}
return a;
}



//SUPPLEMENTS
//Takes editted supplements and redisplays with only those that are taken
//contains subroutines for splitting supplements strings into objects
function supplements(){
		
	//parse supplements string into supplements array
	var arSupps = entry().field("Supplements - taken").split("\n");
	for(var a=0; a<arSupps.length; ++a){
		arSupps[a] = parseSupps(arSupps[a]);
		}
		
	//strip duplicate values - there really shouldn't ever be any.
	//DO NOT SORT as these are arranged to suit.
	arSupps = arrayObjectsUnique(arSupps, ["brand", "supp", "dose"]);
	arSupps = arraySupplementsUpdateWhitespace(arSupps);
	entry().set("Supplements - taken", arraySupplementsOutput(arSupps, true));
		
	return;
}//function supplements

//SUPPLEMENTS FUNCTIONS	
//function to split a single supplement string into a supplement object	
function parseSupps(str){
	var objSupp = {
		brand: "",
		ws1: "",
		supp: "",
		ws2: "",
		dose: "",
		qty: 0,
		lenBrand: 0,
		lenSupp: 0,
		lenDose: 0
		};
		
	var intA, intB, intC, intZ;
	var intS = 0;

	//check for spacer lines
	intZ = str.indexOf("#");
	if(intZ >= 0){
		objSupp["brand"] = str.substring(0, intZ+1);
	} else {	
		//BRAND
		//search for the first "*", and get everything before it, then trim.
		intA = str.indexOf("*");
		objSupp["brand"] = str.substring(0, intA).trim() + " ";
		objSupp["lenBrand"] = objSupp.brand.length;
		
		//SUPP
		//search for second "*", get everything between them
		intB = str.indexOf("*", intA + 1) + 1;
		objSupp["supp"] = str.substring(intA, intB) + " ";
		objSupp["lenSupp"] = objSupp.supp.length;
		
		//DOSE
		//search for ":", get everything between second "*" and ":"
		intC = str.indexOf(":") + 1;
		objSupp["dose"] = str.substring(intB, intC).trim() + " ";
		objSupp["lenDose"] = objSupp.dose.length;
		
		//QTY
		//get everything after the ":"
		objSupp["qty"] = str.substring(intC).trim();	
	}
return objSupp;
}//function parseSupps

//Strip duplicate values from an array of objects (ar), checking an array of keys (keys)
function arrayObjectsUnique(ar, keys){
	
	var a = ar.concat(), dup = true;
	var k=0, elRef, elVar;
	//start looping through the array
	for(var i=0; i<a.length; ++i){
		//start with the next entry to compare with		
		for(var j=i+1; j<a.length; ++j){
				//reset variables for while loop
				k = 0, dup = true;
				elRef = a[i];
				elVar = a[j];
				//while there are still keys to be checked, and the object is looking like a duplicate
				while(k<keys.length && dup == true){
				//console.log("i: " + a[i][keys[k]] + " | j: " + a[j][keys[k]]);
				
				//check if still duplicate
				if(a[i][keys[k]] != a[j][keys[k]]){
					//if not, set flag to false to break out of while loop.
					dup = false;
					}
				++k;
				}//while
				//now we've checked all the keys we care about, or the entry isn't a duplicate
				if(dup == true){
					//if it is a duplicate, delete it
					a.splice(j--, 1);
					}
			}//for j		
		}//for i
return a;
	
}//function arrayObjectsUnique
		
//function to update the whitespaces in an array of supplement objects ready for output
function arraySupplementsUpdateWhitespace(arToUpdate){

	var ar = arToUpdate;
	var maxBrandSupp = 0, maxDose = 0;
	var brandSupp, dose;
	for(var a=0; a<ar.length; ++a){
		//if not a spacer
		if(ar[a].brand.indexOf("#") < 0){
			//total length of brand plus supplement to be constant
			brandSupp = ar[a].lenBrand + ar[a].lenSupp;
			//total length of dose to be constant
			dose = ar[a].lenDose;
			//store maximum total of brand and supplement so far
			if(brandSupp > maxBrandSupp){
				maxBrandSupp = brandSupp;
			}
			//store maximum dose so far
			if(dose > maxDose){
				maxDose = dose;
			}
		}//if not a spacer
	}//for each element in array of supplements
	
	//set whitespaces
	for(var a=0; a<ar.length; ++a){
		ar[a].ws1 = " ".repeat(maxBrandSupp - ar[a].lenBrand - ar[a].lenSupp);
		ar[a].ws2 = " ".repeat(maxDose - ar[a].lenDose);
	}
	return ar;
}//function arraySupplementsUpdateWhitespace

//function to output the contents of an array of supplement objects
//ar is array, quantity is boolean, true to output only supplements with a quantity
function arraySupplementsOutput(ar, quantity){

	var strOP = "";
	
	//if quantity true, only output objects with a quantity
	if(quantity){
	//for each intake object		
		for(var a=0; a<ar.length; ++a){
			//if there is a qty 
			if(ar[a].qty != ""){
					//add the contents of the object to the output string
					strOP += 	ar[a].brand + 
								ar[a].ws1 + 
								ar[a].supp + 
								ar[a].ws2 +
								ar[a].dose +
								ar[a].qty +
								"\n";
			}//if qty
		}//for
	} else {
	//for each intake object		
		for(var a=0; a<ar.length; ++a){
			//add the contents of the object to the output string
			strOP += 	ar[a].brand + 
						ar[a].ws1 + 
						ar[a].supp + 
						ar[a].ws2 +
						ar[a].dose +
						"\n";
			
		}//for
	}//else
		
	return strOP;

}//function arraySupplementsOutput

//for ease of commenting out
function csg(symptomsGraph){
	message(createAllSymptomGraphs(symptomsGraph));;
}

//2020-08-05 12:15
