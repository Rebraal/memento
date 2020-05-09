//ON ENTRY CREATION
//SYMPTOMS
//Takes symptoms from previous entry and copies them

//INTAKE
//Copy and load Intake fields from library "Reference"

message ("A Creation - on creation" +
"\nWorking:\n" +
"2019-07-20 19:30"
);


//COPY FROM PREVIOUS

var intLast = 0, intTime, intEnt, intCnt = 5;
var entries = lib().entries();
var intLim = entries.length;

if(intLim < 5){
	intCnt = intLim;
}
			
//store the timestamp from the previous five entries
//there really shouldn't be more than a couple of retroactive entries
for(let a=0; a < intCnt ; ++a){
	//store the time for entry
	intTime = entries[a].field("Date time");
	//if the time for the entry is the biggest so far
	if(intTime > intLast){
		//store it and note the entry index
		intLast = intTime;
		intEnt = a;
	}
}
var entPrev = entries[intEnt];

var arToCopy = [
"Symptoms - current",
"Symptoms - inactive"
];

//Copy across
for(let n=0; n<arToCopy.length; ++n){
	entryDefault().set(strFld, entPrev.field(arToCopy[n]));
};


//COPY FROM REFERENCE 

//The assumption is that the latest entry in the library will be the working entry
var entRef = libByName("References").entries()[0];
//NOTE THAT USING DASHES IN THIS IS A PROBLEM WHEN PASTING FROM OTHER PROGRAMS
// EN-DASH AND EM-DASH ARE INDISTINGUISHABLE.

arToCopy = [

"Intake - liquid",
"Intake - meat and fish",
"Intake - fruit",
"Intake - vegetables",
"Intake - nuts",
"Intake - misc",

"Supplements - taken"
];

//Copy across
for(let n=0; n<arToCopy.length; ++n){
	entryDefault().set(strFld, entRef.field(arToCopy[n]));
};
