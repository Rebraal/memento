//populates fields from reference on demand
var entRef = libByName("References").entries()[0];


arToCopy = [

"Intake - liquid",
"Intake - meat and fish",
"Intake - fruit",
"Intake - vegetables",
"Intake - nuts",
"Intake - misc",
"Symptoms - inactive",
"Supplements - taken"
];


//For each element in the array to copy
for(let n=0; n<arToCopy.length; ++n){
	strFld = arToCopy[n];
	//append it from reference fileCreatedDate
	entry().set(strFld, entry().field (strFld) + "\n" + entRef.field(strFld));
 
};
