//Memento database
//Overview creation
//DEPENDENCIES:
//D:\Google Drive Sync\Programs\Memento - Standardising\DATE.js or 
//https://raw.githubusercontent.com/Rebraal/memento/master/DATE.js (minified version now exists)
//This needs to be debugged as it's not currently working.
//D:\Google Drive Sync\Programs\Memento - Analysis\Analysis.js or 
//https://github.com/Rebraal/memento/blob/master/minified/Analysis%20minified.js

/*

2020-05-12 
2105
working supplement summary output. Some real silliness with arrays - seems to need ar1 = parse(stringify(ar2)) to delink it completely.

1930
debugging. MUST use JSON.parse("{object}") to set a default object, or the pointers get copied across.
D'oh. Just seen the first comment at this stage. I'd forgotten all about the issue...

2020-07-15
1840
Sorted out sleep. toFixed() returns a string...

1753
Think I've sorted the floating point stupidity with a few extra Math.round(x * 100) / 100

2020-10-12
1624
Still getting odd 7.66666666666s around. Not sure if that's in the new stuff, or if it's just hanging around from old executions.
Have started to edit the overviews, so almost want to discard old libraries and continue only on overview info.
Editted in some analysis, adding in total intake fields now.
*/

message("Overview creation started");


//uses the last entry in references to determine the source of the overview
var arRef = libByName("References").entries();
var arEntries = libByName(arRef[0].field("Overview source")).entries();
var suppsOverviewRef = arRef[0].field("Supplements - taken");
var libOverviews = lib();
var arOverviews = libOverviews.entries();
//seems that write only works if whole file works - use //log(text) for intermediate logging...
var errorLogFile = file("/storage/emulated/0/memento/OverviewErrors.txt"), errorString = "", errors = false;
var lgFile = file("/storage/emulated/0/memento/OverviewLog.txt");
var lg = new Date() + "\n";
var dayStart, date, time;
var arWorking, arDays = [], arSortable = [];
var oEnt = {};
var d, ao1, ao2;
var l, lc = 0, lt;
var is = "", il, ic = "", it, itt;
var ss = "", ts = "", st, ssl, sdl, suppsArray, slo, srs, ol;
var sc = "", scs = "", symptomsCurrentArray = [], sl, si, sct;
var suppsOverviewSourceArray = [], suppsOverviewArray = [], sos, ind, os, bin;
var sleep = {night: [], day: []};
var elim = {ur: [], mo: []}, ev;
var results = {created: 0, updated: 0};
var sd, sdts, sdar, sda, sds, ex = "", pl;
var syc, inc, suc, pro;
var liquidIntake, solidIntake;
var liquidIntakeCombined = [];
var solidIntakeCombined = [];
var intakeSpecificDecode = JSON.parse(file("/storage/emulated/0/memento/Intake decode.json").readLines().join(""));
var intakeGeneralDecode = {
	l: 5, y: 3, u: 3, s: 1, a: 1, t: 0.1
};
var intakeLiquidDecode = {
	l: 1.5, y: 1, u: 1, s: 0.5, a: 0.5, t: 0.125
};		
var intakeAppends = {
	prefix: " - ", l: "cooled", s: "soaked", c: "cooked", r: "raw"
};

var intakes = [	
	"Intake - vegetables",
	"Intake - meat and fish",
	"Intake - fruit",
	"Intake - nuts",
	"Intake - misc"
];

var simpleData = {};
var simpleDataDefault = JSON.stringify({ct: 0, sum: 0, mean: 0, lg: ""});


var fieldsToUpdate = [
	//date / time - WORKING
	{	name: "Day start",
		calc: function(day){
			log(new DATE(day[0]).dayStart);
			return new DATE(day[0]).dayStart;
		}
	},	
	//numeric - WORKING
	{	name: "Average overview",
		calc: function(day){
			return Math.round((day.reduce((sum, ent)=>{
				return sum + ent.field("Overview");
			}, 0) / day.length) * 100) / 100;
		}
	},
	{	name: "Average overview breakdown",
	calc: function(day){
		ao1 = 4;
		ao2 = 4;
			return day.reduce((sum, ent, i)=>{
				if(i < 1){
					ao1 = ent.field("Overview");
					sum = new DATE(ent).time + " - " + ao1 + "\n" + sum;
				} else {
					ao2 = ent.field("Overview");
					if(ao2 != ao1){
						sum = new DATE(ent).time + " - " + ao2 + "\n" + sum;
						ao1 = ao2;
					}
				}
				return sum;
			}, "").slice(0, -1);
		}
	},
	//"Supplements"	
	{	name: "Supplements",
		calc: function(day){
			
			ss = "", suppsArray = [], srs = "", ssl = 0, sdl = 0, ol = "";
			suppsOverviewSourceArray = [];
			//creates string with times and supplements
			day.map((ent)=>{
				d = new DATE(ent);
				date = d.date;
				st = ent.field("Supplements - taken").trim();
				ts = "";
				//if there's any information in the field
				if(st.length > 0){
					ts += d.time + "\n";
					ol = ent.field("B12 oils location");
					if(JSON.stringify(ol) != "{}"){
						ts += "B12 - " + JSON.stringify(ol) + "\n";
					}
					ol = ent.field("Magnesium oil location");
					if(JSON.stringify(ol) != "{}"){
						ts += "Mg - " + JSON.stringify(ol) + "\n";
					}
					if(ent.field("Sublingual terminated") == true){
						ts += "Sublingual terminated \n";
					}
					ss = ts + "\n" + st + "\n\n" + ss;
				}
			});	
			//parse this string to objects for use with overview
			//format objects and output to string for use here.
			//note with split("\n") - lines consisting only of "\n" are not deleted.
			suppsArray = ss.split("\n");
			suppsArray = suppsArray.map((line)=>{
				slo = supplementsLineToObject(line);
				//update maximum lengths
				if(typeof slo == "object"){
					ssl = slo.sl 			> ssl ? slo.sl 			: ssl;
					sdl = slo.dose.length	> sdl ? slo.dose.length	: sdl;
				}
				return slo;
			});
			suppsArray.map((el)=>{
				//if el is an object
				if(typeof el == "object"){
					srs += supplementsOutputObject(el);
					if(isNumeric(el.qty)){
						el.qty = Math.round(parseFloat(el.qty) * 1000) / 1000;
					} else {
						el.qty = 0;
						errorString += date + " " + time + " " + "\nsupplementsOutputObject: el.qty: " + el.qty + "\n";
						errors = true;
					}
					//push info to the overview		
					suppsOverviewSourceArray.push(el);
				//if the el is not whitespace, 
				} else if(el.trim().length > 0){
					//if we've a spray location line
					if(el.match("{") != null){
						srs += el + "\n";
					} else {
						srs += supplementsOutputObject(el);
						time = el.trim();
					}
				//else if the el is whitespace
				} else {
					srs += el;

				}
			});
			//lop off the first \n
			return srs.substring(1);
		}
	},
	//"Supplements - overview",
	//suppsOverview(Source)Array in the form [{n: "brand *supp* dose:", q: qty},...]
	{	name: "Supplements - overview",
		calc: function(day){
			sos = "", ind = -1, ssl = 0, sdl = 0;
			suppsOverviewArray = JSON.parse(JSON.stringify(suppsOverviewRef));
			
			//loop through the source, placing into bins or creating new ones as needed
			//also update maximum spacings.
			suppsOverviewSourceArray.map((el)=>{
				ind = suppsOverviewArray.findIndex(suppExists, el);
				ssl = el.sl 			> ssl ? el.sl 			: ssl;
				sdl = el.dose.length	> sdl ? el.dose.length	: sdl;
				if(ind > -1){
					suppsOverviewArray[ind].qty += el.qty;
				} else {
					suppsOverviewArray.push(el);
				}
			});
			//space things out a bit
			ssl += 5;
			sdl += 1;
			//loop through the bins and output
			suppsOverviewArray.map((o)=>{
				sos += supplementsOutputObject(o);
			});
			return sos;
		}
	},
	//numeric - WORKING
	//possibly worth reworking to take advantage of the loops in the Intake - liquid field
	{	name: "Total liquid intake", 
		calc: function(day){
			lc = 0;
			day.map((ent)=>{ 
				ent.field("Intake - liquid").split("\n").map((line)=>{
					l = intakeLineToObject(line);
					if(l && (l.sub != "Coffee - shot")){
						lt = Math.round(parseFloat(l.qty) * 1000) / 1000;
						if(isNumeric(lt)){
							lc += lt;
						} else {
							lc += intakeLiquidDecode[l.qty];
						}
					}
				});
			});
			return Math.round(parseFloat(lc) * 1000)/ 1000;
		}
	},				
	//text - WORKING
	{	name: "Intake - liquid",
		calc: function(day){
			is = "";
			day.map((ent)=>{
				il = ent.field("Intake - liquid").trim();
				if(il.length > 0){
					//edit 2020-09-08 12:20
					is = new DATE(ent).time + "\n" + il.replace(/[0-9]+# +|[0-9]+\.[0-9]+# +/g, "") + "\n\n" + is;
				}
			});
			return intakeSpace(is);
		}
	},
	//text - WORKING
	{	name: "Intake - combined",
		calc: function(day){
			//#1 Add in "Rushed intake"
			ic = "";
			day.map((ent)=>{
				itt = "";
				intakes.map((intake)=>{
					it = ent.field(intake).trim();
					if(it.length > 0){
						itt = it.replace(/[0-9]+# +|[0-9]+\.[0-9]+# +/g, "") + "\n" + itt;
					}
				});
				if(itt.trim().length > 0){
					if(ent.field("Rushed intake") == true){
						ic = "Rushed intake - " + new DATE(ent).time + "\n" + itt + "\n" + ic;
					} else {
						ic = new DATE(ent).time + "\n" + itt + "\n" + ic;
					}
				}
			});
			return intakeSpace(ic);
		}
	},
	//Symptoms - comments
	{	name: "Symptoms - comments",
		calc: function(day){
			//#1 Add in "Supplements - comments" and "Intake - comments"
			scs = "";
			day.map((ent)=>{
				sct = "";
				syc = ent.field("Symptoms - comments").trim();
				inc = ent.field("Intake - comments").trim();
				suc = ent.field("Supplements - comments").trim();
				//If there's anything there, stick a date stamp on.
				if(	(syc.length > 0) || 
					(inc.length > 0) || 
					(suc.length > 0)
					){
					sct += new DATE(ent).time + " O: " + ent.field("Overview") + "\n";
				}
				if(syc.length > 0){
					sct += syc + "\n\n";
				}				
				if(inc.length > 0){
					sct += inc + "\n\n";
				}
				if(suc.length > 0){
					sct += suc + "\n\n";
				}				
				scs = sct + scs;
			});
			return scs.slice(0, -1);
		}
	},
	//Symptoms - current
	{	name: "Symptoms - current",
		calc: function(day){
			scs = "";
			symptomsCurrentArray = [];
			sl = {};
			/*(create array of symptoms
				//[{n: sym1}, {n: sym2}]
				//populate with array of intensities
				//[{	n: sym1, 
						d: [
							[08:15, 3], 
							[09:00, 5]
							]
						}, 
						{}
					]
			*/
			day.map((ent)=>{
				ent.field("Symptoms - current").split("\n").map((sym)=>{
					sym = sym.trim();
					if(sym.length > 0){ 
						sl = symptomsLineToObject(sym);
						si = symptomsCurrentArray.findIndex(findSym, sl.sym);
						//if symptom does exist
						if(si > -1){
							//if it has changed
							if(last(symptomsCurrentArray[si].d)[1] != sl.isy){
								//log it, move on
								symptomsCurrentArray[si].d.push([new DATE(ent).time, sl.isy]);
							}
							//else 
								//move on
						} else {
						//if symptom doesn't exist
							//add it, move on
							symptomsCurrentArray.push({n: sl.sym, d: [[new DATE(ent).time, sl.isy]]});
						}
					}
				});
			});
			//output data
			symptomsCurrentArray = symptomsCurrentArray.sort(symSort);
			symptomsCurrentArray.map((el)=>{
				scs += el.n + JSON.stringify(el.d.reverse()) + "\n";
			});
			return scs.slice(0, -1);
		}
	},
	//Sleep at night 8pm to 8am, sleep in day.
	//calculates raw data for all sleep fields
	{	name: "Sleep - total night",
		calc: function(day){
			sleep = {night: [], day: []};
			var e;
			day.map((ent)=>{
				if(ent.field("Sleep duration") != 0){
					
					e = {	ss: new DATE(ent.field("Sleep start")).time, 
							se: new DATE(ent.field("Sleep end")).time, 
							sd: Math.round(parseFloat((ent.field("Sleep duration") / 60).toFixed(2)) * 100) / 100,
							tp:	ent.field("Sleep type"),
							sq: ent.field("Sleep quality") != null ? ent.field("Sleep quality") : "-",
							sr: ent.field("Sleep regularity") != null ? ent.field("Sleep regularity") : "-" 
						};
					//if night sleep
					//if 
					//-starting between 2000 & 0800
					//-ss < 2000 < se
					//-ss < 0800 < se
					if(e.ss > "20:00"){
						sleep.night.push(e);
					} else if(e.ss < "08:00"){
						sleep.night.push(e);
					} else if((e.ss < "20:00") && ("20:00" < e.se)){
						sleep.night.push(e);					
					} else {
						sleep.day.push(e);
					}
				}
			});
			var z = sleep.night.reduce((sum, e)=>{
				return sum + e.sd;
			}, 0);
			return z;
		}
	}, 
	{	name: "Sleep - total day",
		calc: function(day){
			return sleep.day.reduce((sum, e)=>{
				return sum + e.sd;
			}, 0);
		}
	},
	{	name: "Sleep - night",
		calc: function(day){
			return sleep.night.reduce((sum, e)=>{
				return sum + e.tp + " @ " + e.ss + ", " + e.sd + "h q:" + e.sq + ", r:" + e.sr + "\n";
			}, "").slice(0, -1);
		}
	},
	{	name: "Sleep - day",
		calc: function(day){
			return sleep.day.reduce((sum, e)=>{
				return sum + e.tp + " @ " + e.ss + ", " + e.sd + "h q:" + e.sq + ", r:" + e.sr + "\n";
			}, "").slice(0, -1);
		}
	},
	//elim - 
	//Summary - count, av val, 
	//breakdown ["00:00", val, notes], 
	//gathers all urination data
	{	name: "Urination count",
		calc: function(day){
			elim = {ur: [], mo: []};
			day.map((ent)=>{
				if(ent.field("Urination") != "NA"){
					elim.ur.push([new DATE(ent).time, ent.field("Urination").slice(0, 1), ent.field("Urination notes")]);
				}
			});
			return elim.ur.length;
		}
	},
	{	name: "Urination average",
		calc: function(day){
			return (elim.ur.reduce((sum, e)=>{
				//if value is "Unkown", call it 2
				ev = e[1] == "U" ? "2" : e[1];
				return sum + parseFloat(ev);	
			}, 0) / elim.ur.length).toFixed(2);
		}
	},
	{	name: "Urination breakdown",
		calc: function(day){
			return elim.ur.reverse().reduce((sum, e)=>{
				return sum + JSON.stringify(e) + "\n";
			}, "").slice(0, -1);
		}
	},
	//gathers all motion data
	{	name: "Motion count",
		calc: function(day){
			elim = {ur: [], mo: []};
			day.map((ent)=>{
				if(ent.field("Motion") != "NA"){
					elim.mo.push([new DATE(ent).time, ent.field("Motion").slice(0, 1), ent.field("Motion notes")]);
				}
			});
			return elim.mo.length;
		}
	},
	{	name: "Motion average",
		calc: function(day){
			return (elim.mo.reduce((sum, e)=>{
				//if value is "Unkown", call it 2
				ev = e[1] == "U" ? "2" : e[1];
				return sum + parseFloat(ev);	
			}, 0) / elim.mo.length).toFixed(2);
		}
	},
	{	name: "Motion breakdown",
		calc: function(day){
			return elim.mo.reverse().reduce((sum, e)=>{
				return sum + JSON.stringify(e) + "\n";
			}, "").slice(0, -1);
		}
	},	
	{	name: "6x6 Schulte average",
		calc: function(day){
			getSimpleData(day, "6x6 Schulte", null);
			return simpleData["6x6 Schulte"].mean;
		}
	},
	{	name: "6x6 Schulte breakdown",
		calc: function(day){
			return simpleData["6x6 Schulte"].lg.slice(0,-1);
		}
	},
	//If exercised, pulse invalid other than for exercise.
	{	name: "Pulse average",//
		calc: function(day){
			simpleData["Pulse"] = JSON.parse(simpleDataDefault);
			day.map((ent)=>{
				sd = ent.field("Pulse");
				if((sd != null) && (ent.field("Exercise - comments") == "")){
					simpleData["Pulse"].ct++;
					simpleData["Pulse"].sum += sd;
					//log(d.date + " " + this.name);
					simpleData["Pulse"].lg = new DATE(ent).time + " - " + sd + "\n" + simpleData["Pulse"].lg;
				}
			});
			simpleData["Pulse"].mean = (simpleData["Pulse"].sum / simpleData["Pulse"].ct).toFixed(2);
			return simpleData["Pulse"].mean;
		}
	},
	{	name: "Pulse breakdown",//
		calc: function(day){
			return simpleData["Pulse"].lg.slice(0,-1);
		}
	},
	{	name: "Weight average",//
		calc: function(day){
			getSimpleData(day, "Weight", "");
			return simpleData["Weight"].mean;
		}
	},
	{	name: "Weight breakdown",//
		calc: function(day){
			return simpleData["Weight"].lg.slice(0,-1);
		}
	},
	{	name: "New Timespan average",//
		calc: function(day){
		simpleData["New Timespan"] = JSON.parse(simpleDataDefault);
		simpleData["New Average Reaction"] = JSON.parse(simpleDataDefault);
		simpleData["Accuracy"] = JSON.parse(simpleDataDefault);
		simpleData["Stupidity"] = JSON.parse(simpleDataDefault);
		//log("NTa: simpleData initialised:\n" + JSON.stringify(simpleData));
		day.map((ent)=>{
			sdts = null, sdar = null;
				try{
					sdts = ent.field("Timespan");
					sdar = ent.field("Average Reaction");
					log(new DATE(ent).dateStamp + "\nOLD: sdts: " + sdts + " sdar: " + sdar);
				}
				catch(e){
				}
				if(sdts == null){
					sdts = ent.field("New Timespan");
					sdar = ent.field("New Average Reaction");
					log(new DATE(ent).dateStamp + "\nNEWs: sdts: " + sdts + " sdar: " + sdar);
				}
				log(new DATE(ent).dateStamp + "\nsdts: " + sdts + " sdar: " + sdar);
				if(sdts != null){
					simpleData["New Timespan"].ct++;
					simpleData["New Timespan"].sum += sdts;
					//log(d.date + " " + this.name);
					simpleData["New Timespan"].lg = new DATE(ent).time + " - " + sdts + "\n" + simpleData["New Timespan"].lg;
					simpleData["New Average Reaction"].ct++;
					simpleData["New Average Reaction"].sum += sdar;
					//log(d.date + " " + this.name);
					simpleData["New Average Reaction"].lg = new DATE(ent).time + " - " + sdar + "\n" + simpleData["New Average Reaction"].lg;
					sda = ent.field("Accuracy");	
					simpleData["Accuracy"].ct++;
					simpleData["Accuracy"].sum += sda;
					//log(d.date + " " + this.name);
					simpleData["Accuracy"].lg = new DATE(ent).time + " - " + sda + "\n" + simpleData["Accuracy"].lg;
					sds = ent.field("Stupidity");	
					simpleData["Stupidity"].ct++;
					simpleData["Stupidity"].sum += sds;
					//log(d.date + " " + this.name);
					simpleData["Stupidity"].lg = new DATE(ent).time + " - " + sds + "\n" + simpleData["Stupidity"].lg;
				}
			});
		simpleData["Accuracy"].mean 			= (simpleData["Accuracy"].sum / simpleData["Accuracy"].ct).toFixed(2);
		simpleData["New Timespan"].mean 		= (simpleData["New Timespan"].sum / simpleData["New Timespan"].ct).toFixed(2);
		simpleData["New Average Reaction"].mean = (simpleData["New Average Reaction"].sum / simpleData["New Average Reaction"].ct).toFixed(2);
		simpleData["Stupidity"].mean 			= (simpleData["Stupidity"].sum / simpleData["Stupidity"].ct).toFixed(2);
		log("NTa: simpleData populated:\n" + JSON.stringify(simpleData));
		return simpleData["New Timespan"].mean;
		}
	},
	{	name: "New Timespan breakdown",
		calc: function(day){	
			return simpleData["New Timespan"].lg.slice(0,-1);
		}
	},
	{	name: "New Average Reaction average",//
		calc: function(day){	
			return simpleData["New Average Reaction"].mean;
		}
	},	
	{	name: "New Average Reaction breakdown",
		calc: function(day){	
			return simpleData["New Average Reaction"].lg.slice(0,-1);
		}
	},	
	{	name: "Accuracy average",
		calc: function(day){	
			return simpleData["Accuracy"].mean;
		}
	},	
	{	name: "Accuracy breakdown",
		calc: function(day){	
			return simpleData["Accuracy"].lg.slice(0,-1);
		}
	},	
	{	name: "Stupidity average",
		calc: function(day){	
			return simpleData["Stupidity"].mean;
		}
	},	
	{	name: "Stupidity breakdown",
		calc: function(day){	
			return simpleData["Stupidity"].lg.slice(0,-1);
		}
	},	
	{	name: "Exercise breakdown",
		calc: function(day){
			return day.reduce((sum, ent)=>{
				sd = ent.field("Exercise - comments");
				ex = "";
				if(sd != ""){
					//log(d.date + " " + this.name);
					ex += new DATE(ent).time;
					if(ent.field("Pulse") != null){
						ex += " - " + ent.field("Pulse") + "bpm";
					}
					sum = ex + "\n" + sd + "\n" + sum;
				}
				return sum;
			}, ""). slice(0,-1);
		}
	},	
	{	name: "Procedures breakdown",
		calc: function(day){		
			return day.reduce((sum, ent)=>{
				pl = JSON.stringify(ent.field("Procedures list"));
				if(pl != "{}"){
					sum = new DATE(ent).time + " - " + pl + "\n" + sum;
				}
				return sum;
			}, "").slice(0, -1);
		}
	},
	{	name: "Sleep Cycle data", 
		calc: function(day){
			var sce = null;
			var scs = null;
			for(var c1=0; c1<day.length; c1++){
				sce = day[c1].field("Sleep Cycle end");
				if(sce.length > 0){
					scs = new DATE(day[c1].field("Sleep start")).time;
					break;
				}
			}
			if(sce != null){
				return scs + " to " + sce;
			} else {
				return "";
			}
		}
	},
	{	name: "Location breakdown", 
		calc: function(day){
			var ent = day[0]; 
			var precision = 2;
			var objLoc;
			var arLocs = [{dt: new DATE(ent).time, la: ent.field("Location").lat, lo: ent.field("Location").lng}];
			for(var c1=1; c1<day.length; c1++){
				ent = day[c1];
				objLoc = {dt: new DATE(ent).time, la: ent.field("Location").lat, lo: ent.field("Location").lng};
				if(
					(roundToDP(objLoc.la, precision) != roundToDP(arLocs[arLocs.length-1].la, precision)) ||
					(roundToDP(objLoc.lo, precision) != roundToDP(arLocs[arLocs.length-1].lo, precision))
					){
				
					arLocs.push(objLoc);
				}
			}
			return arLocs.map((loc)=>{
				return JSON.stringify(loc);
			}).join("\n");
		}
	}
];

function main(){
	
	//set up stuff for the calculations
	
	//SUPPLEMENTS - OVERVIEW
	//loop through the references - a manually ordered list of supplements to create bins to store suppsOverviewSourceArray results in.
	suppsOverviewRef.split("\n").map((l)=>{
		bin = supplementsLineToObject(l);
		if(typeof bin == "object"){
			bin.qty = 0;
			suppsOverviewArray.push(bin);
		}
	});
	suppsOverviewRef = JSON.parse(JSON.stringify(suppsOverviewArray));
	
	//sort arEntries by most recent first
	arEntries.map((ent, i)=>{
		arSortable.push({i: i, date: ent.field("Date stamp")});
	});

			
	arSortable = arSortable.sort((a, b)=>{
		if(a.date > b.date){
			return -1;
		} else {
			return 1;
		}
	});

	//for some reason sorting arEntries doesn't work. Seems to work fine for non-entry objects
	//so we work around it, arSortable is now used creating an extra layer to address an entry

	//if arOverviews.length == 0, overview all
	//else overview from start of day of last updated entry

	arWorking = getArWorking();
	arSortable = null;
	//lg += "arWorking\n" + JSON.stringify(arWorking) + "\n\n";
	//array of entries, with the .date property added to them. Might save time...					
					
	dayStart = new DATE(arWorking[0].date).dayStart;
	//splice returns the bit cut off, and stores the spliced array in one operation.
	arDays.push([arWorking.splice(0, 1)[0].i]);
	
	//arWorking == [] is still an object in existence, so while(arWorking) ends badly.
	while(arWorking.length > 0){
		//if the timestamp is earlier than dayEnd, store it and chop it off.
		if(arWorking[0].date >= dayStart){
			//#2 arDays[arDays.length-1].push(arWorking.splice(0,1)[0]);
			arDays[arDays.length-1].push(arWorking.splice(0,1)[0].i);
		} else {
			//chop entry off and create a new day
			//#2 arDays.push([arWorking.splice(0,1)[0]]);
			arDays.push([arWorking.splice(0,1)[0].i]);
			//check if we've chopped the last one off...
			if(arWorking.length > 0){
				dayStart = new DATE(arWorking[0].date).dayStart;
			}

		}
		message(arDays.length + " days processed.");
	} 	
	
	//lg += "arWorking.length: " + arWorking.length;
	//lg += "arDays\n" + JSON.stringify(arDays);
	//parse arDays - reverse means it starts creation from the earliest date. Better for picking up after failures.
	arDays = arDays.reverse();
	arDays.map((day, i)=>{
		try{	
			oEnt = {};
			fieldsToUpdate.map((fld)=>{
				log(fld.name + " update beginning.");
				//#2 oEnt[fld.name] = fld.calc(day);
				oEnt[fld.name] = fld.calc(day.map((j)=>{
					return arEntries[j];
				}));
			});

			//create library object in libOverviews
			//check if the day has already been overviewed, 
			var doe = dayOverviewExists(oEnt);
			//lg += "doe: " + doe + "\n";
			
			if(isNumeric(doe)){
				//if so, update rather than create.
				updateEntry(oEnt, arOverviews[doe]);
				overviewAnalysis(doe);
				intakeTotals(doe);
				results.updated++;
			} else {
				libOverviews.create(oEnt);
				overviewAnalysis(0);
				intakeTotals(0);
				results.created++;
			}
			
			log("results: " + JSON.stringify(results) + "\nOverview creation complete\n" + 
				results.updated + " updated, " + results.created + " created, " + (i+1) + " of " + 
				arDays.length + "\n\n");
			message(results.updated + " updated, " + results.created + " created, " + (i+1) + " of " + arDays.length);
		}
		catch(error){
			var e = new Error("Rethrowing the " + error.message + " error, line: " + error.lineNumber);
			errorString += "\n\n" + JSON.stringify(error);
			errorLogFile.write(errorString);
			errorLogFile.close();
			throw e;
		}
	});
	
	
	
	message("Overview creation complete\n " + results.updated + " updated, " + results.created + " created");
	if(errors){
		message("ERRORS");
		errorLogFile.write(errorString);
		errorLogFile.close();
	}
	//lgFile.write(lg);
	//lgFile.close();

}

//returns an entry from a sor element in arSortable
function getEntry(sor){
	return arEntries[sor.i];
}

//return arWorking
function getArWorking(){
	//arSortable in form [{i: entry index in library, date: DATE object of entry}, {},...]
	
	//if arOverviews.length == 0, overview all
	//otherwise, overview from the start of day of the latest overview entry
	var workingStart = "";
	//workingStart = arOverviews.length == 0 ? arSortable[arSortable.length-1].date : arOverviews[0].field("Day start");
	if(arOverviews.length == 0){
		workingStart = arSortable[arSortable.length-1].date;
	} else { 
		arOverviews.map((e)=>{
			workingStart = e.field("Day start") > workingStart ? e.field("Day start") : workingStart;
		});
	}

	var ret, fv;
	//return all entries after workingStart
	/*#2
	return arSortable.filter((sor)=>{
		if(sor.date >= workingStart){
			return sor;
		}
	}).map((sor)=>{
		ret = getEntry(sor);
		ret.date = sor.date;		
		return ret;
	});
	*/
	return arSortable.filter((sor)=>{
		if(sor.date >= workingStart){
			return sor;
		}
	});
}

//INTAKES

//reads a single line from an intake
//returns an object
function intakeLineToObject(s){
	s = s.trim();
	//C indicates capturing, NC non-capturing
	//1#C 	index		(1+ [0-9] followed by # or 
	// 					1+ [0-9] followed by . and 1+ [0.9] followed by #) optional
	//NC				(0+ spaces)
	//2#C	allergens	(* then something then *) optional
	//NC				(0+ spaces)
	//3#C 	food		(anything)
	//NC				(: then 0+ spaces)
	//4#C 	quantities	(anything else) optional

	var r = s.match(/([0-9]+#|[0-9]+\.[0-9]+#)?(?:\s*)(\*.*\*)?(?:\s*)(\D.*)(?::\s*)(.*)?/);	
	var keys = ["ind", "alg", "sub", "qty"];
	var o = {}, fill;
	//i is index
	if(r){
		keys.map((el, i) => {
			fill = r[i+1];
			if(fill == undefined){
				fill = "";
			}
			o[el] = fill;
		});
		o.tl =	o.ind.length + 
				o.alg.length + 
				o.sub.length;		
		return o;
	}
}

//spaces an unspaced intake overview
function intakeSpace(ov){
	var iRes, maxsp=0, ops = "";
	ov = ov.trim().split("\n").map((il)=>{
		iRes = intakeLineToObject(il);
		if(iRes){
			if(iRes.tl > maxsp){
				maxsp = iRes.tl;
			}
			return iRes;
		} else {
			return il;
		}
	});
	ov.map((il)=>{
		if(typeof il == "object"){
			ops += 	il.ind + " " +
					il.alg + " ".repeat(maxsp - il.tl + 1) + 
					il.sub + ": " +
					il.qty + "\n";
		} else if(il.length > 1){
			//offsets 5 characters to the left. Right justified.
			ops += " ".repeat(maxsp + 5 - il.length) + il + "\n";
		} else {
			ops += il + "\n";
		}
	});
	return ops;
}

//SUPPLEMENTS

//reads a single line from an supplements field
//returns an object or the input if there's no info
function supplementsLineToObject(s){
	var t = s.trim();
	
	//C indicates capturing, NC non-capturing
	//2#C 	brand		(anything), up until...
	//NC				(1+ spaces)
	//3#C	supp		an *, including the *, (anything) and an * until...
	//NC				(1+ spaces)
	//4#C 	dose		(anything and a :), until...
	//NC				(0+ spaces)
	//5#C 	qty			(anything else) 
	//6#C	spacer		a digit followed by #

	var r = t.match(/^(.*?)(?=(?:\s+(\*.*\*)(?=(?:\s+(.*:)(?:\s*)(.*)$))))|(\d#)/);	
	if(r != null){
		//if this is a spacer line, there's no useful info.
		if(r[5] == undefined){
			var keys = ["brand", "supp", "dose", "qty"];
			var o = {};
			//i is index
			keys.map((el, i) => {
				o[el] = r[i+1];
			});
			o.sl = o.brand.length + o.supp.length;
			return o;
		} else {
			return s;
		}
	} else {
		//log("supplementsLineToObject: return input:\n" + JSON.stringify(s));
		return s;
	}
}

//takes a supplement object from suppsArray and outputs it to a string
function supplementsOutputObject(o){
	var ops, c1, c2;
	//log("supplementsOutputObject: o:\n" + JSON.stringify(o) + "\nssl: " + ssl + " sdl: " + sdl);		
	//if it's not a time stamp
	if(typeof o == "object"){
		//make sure that the count for repeat is always > 1
		c1 = 	ssl - o.sl + 1;
		c1 = 	c1 > 1 ? c1 : 1;
		c2 = 	sdl - o.dose.length + 1;
		c2 = 	c2 > 1 ? c2 : 1;
		os = 	o.brand	+ " ".repeat(c1) + 
				o.supp 	+ " ".repeat(c2) +  
				o.dose;
		ops = 	os 		+ " " + 
				o.qty 	+ "\n";

		//log("supplementsOutputObject: return supplement: \n" + ops);
		return ops;
	} else {
		ops = "\n" + " ".repeat(ssl + sdl - 1) + o + "\n";
		//log("supplementsOutputObject: return date: \n" + ops);
		return ops;
	}
}

function suppExists(comp){
	//if any of the properties don't match, return false
	if(	this.brand 	!= comp.brand ||
		this.supp	!= comp.supp ||
		this.dose	!= comp.dose
	){
		return false;
	} else {
		return true;
	}
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

//returns the index if an entry already exists in the overview library, else null.
function dayOverviewExists(oEnt){
	for(var i=0; i<arOverviews.length; i++){
		if(arOverviews[i].field("Day start") == oEnt["Day start"]){
			return i;
		}
	}
	return null;
}


//if an entry already exists, updates it.
function updateEntry(oEnt, existingEnt){
	//lg += "uE: " + JSON.stringify(oEnt) + ", " + existingEnt + "\n";
	for(var key in oEnt){
		existingEnt.set(key, oEnt[key]);
	}
}

//takes array input and outputs a string with an element per line
function arrayOutput(ar){
	var s = "";
	ar.map((el)=>{
		s += JSON.stringify(el) + "\n";
	});
	return s;
}

//reads a single line from an symptoms field
//returns an object
function symptomsLineToObject(s){
	s = s.trim();

	//where parsing naked symptoms with no i#, this pulls out "... itchy" as "..." i"tchy"
	//var r = s.match(/(\d{2}\s\d{2}\s\d{2})(?:\s*)(?:(.*)(?=\s(?:i(\d)))|(.*$))/);
	//var r = s.match(/((.*)(?=\s(?:i(\d)))|(.*$))/);
	var r = s.match(/(.*)(?=\s(?:i(\d)))/);
	if(r != null){
		var o = {	sym:	r[1],
					isy:	r[2]
				};
		if(o.sym == undefined){
			errorString += s;
		}
		//log("symptomsLineToObject\ns: " + s + "\n" + o.sym);
		return o;
	} else {
		return false;
	}
}

//returns the last element of an array
function last(ar){
	return ar[ar.length-1];
}

//used in findIndex for symptoms
function findSym(comp){
	if(this == comp.n){
		return true;
	} else {
		return false;
	}
}

//sort for symptoms
function symSort(a, b){
	if(a.n < b.n){
		return -1;
	} else {
		return 1;
	}
}

//Collects all simpleData for name from a day
//day, name of field, default for field
function getSimpleData(day, name, def){
			simpleData[name] = JSON.parse(simpleDataDefault);
			day.map((ent)=>{
				sd = ent.field(name);
				if((name == "Weight") && (sd != def)){
					sd = parseFloat(parseFloat(sd).toFixed(2));
				}
				if(sd != def){
					simpleData[name].ct++;
					simpleData[name].sum += sd;
					simpleData[name].lg = new DATE(ent).time + " - " + sd + "\n" + simpleData[name].lg;
				}
			});
		simpleData[name].mean = (simpleData[name].sum / simpleData[name].ct).toFixed(2);
}


function intakeTotals(doe){
	
	var line, ent;
	ent = lib().entries()[doe];
	liquidIntakeCombined = [];		
	solidIntakeCombined = [];
	liquidIntake = ent.field("Intake - liquid").split("\n");
	for(var liC=0; liC<liquidIntake.length; liC++){
		line = totalsIntakeLineToObject(liquidIntake[liC]);
		if(line != null){
			totalsStoreToOverview(line, liquidIntakeCombined, intakeLiquidDecode);
		}
	}
	solidIntake = ent.field("Intake - combined").split("\n");
	for(var liC=0; liC<solidIntake.length; liC++){
		line = totalsIntakeLineToObject(solidIntake[liC]);
		if(line != null){
			totalsStoreToOverview(line, solidIntakeCombined, intakeGeneralDecode);
		}
	}
	ent.set("Liquid - overview", totalsIntakeSpace(liquidIntakeCombined));
	ent.set("Combined - overview", totalsIntakeSpace(solidIntakeCombined));
}

function totalsIntakeLineToObject(s){
	s = s.trim();
	if(
		(s.match(/.*Rushed.*/) == null) &&
		(s.match(/\d\d:\d\d/) == null)
		){
		var r = s.match(/([0-9]+#|[0-9]+\.[0-9]+#)?(?:\s*)(\*.*\*)?(?:\s*)(\D.*)(?::\s*)(.*)?/);	
		var keys = ["ind", "alg", "sub", "qty"];
		var o = {}, fill;
		//i is index
		if(r != null){
			keys.map((el, i) => {
				fill = r[i+1];
				if(fill == undefined){
					fill = "";
				}
				o[el] = fill;
			});
			var append = o.qty.match(/(.*)(?=, (.*))/);
			if(append != null){
				o.qty = append[1];
				o.sub += intakeAppends.prefix + intakeAppends[append[2]];
			}
			o.tl =	o.ind.length + 
					o.alg.length + 
					o.sub.length;	
			return o;
		}
	}
}

function totalsStoreToOverview(line, array, objDecode){
	if(isNumeric(line.qty)){
		line.qty = parseFloat(line.qty);
	} else {
		line.qty = totalsDecode(line, objDecode);
	}
	for(var c1=0; c1<array.length; c1++){
		if(
			//(array[c1].ind == line.ind) &&
			(array[c1].alg == line.alg) &&
			(array[c1].sub == line.sub)
			){
				array[c1].qty += line.qty;
				return;
		}
	}
	array.push(line);
	return;
}

function totalsDecode(line, objDecode){
	for(var c1=0; c1<intakeSpecificDecode.length; c1++){
		if(line.sub == intakeSpecificDecode[c1].n){
			return intakeSpecificDecode[c1][line.qty];
		} 
	}
	//log("line.qty: " + line.qty + " decode: " + objDecode[line.qty]);
	return objDecode[line.qty];
}

//spaces an unspaced intake overview string
function totalsIntakeSpace(ov){
	var maxsp=0, ops = "";
	ov.map((il)=>{	
		if(il.tl > maxsp){
			maxsp = il.tl;
		}
	});
	return ov.reduce((ops, il)=>{
			return ops += 	il.ind + " " +
							il.alg + " ".repeat(maxsp - il.tl + 1) + 
							il.sub + ": " +
							Math.round(parseFloat(il.qty) * 100) / 100 + "\n";

	}, "");
}

function roundToDP(num, dp){
	var den = Math.pow(10, dp);
	return Math.round(num * den) / den;
}

log("Memento - Overview: updated: 2021-01-16 13:30");
main();
