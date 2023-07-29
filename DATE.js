//a custom made DATE object that parses Memento entries into strings. I intend to use this in most Memento scripts where necessary.
/*2020-03-31 1515
added string input method.

2020-07-03 1300
added in Date object input

2020-07-19 1500
corrected error where DATE_stepBackDate was only passing one argument to DATE_daysInMonth, resulting in wrong dayStart
2045
added method for subtracting days from date.

2020-08-03 2015
renamed all function with a DATE_ prefix to prevent duplication
*/
var editDateDATE = "2023-07-29 1526"
var LOG = libByName("Logs")
LOG.create({Log : "DATE.js " + editDateDATE+ " load start"})
log("DATE.js " + editDateDATE+ " load start"})

function DATE_correctHour(h){
	h += 1; 
	return  h > 23 ? 0 : h;
}
//returns a double digit string from a number - ie 1 => "01"
function DATE_dd(n){
	return n < 10 ? "0" + n : "" + n;
}

//returns the previous start of day
//if this is generalised to use DATE_dateSubtract, I think there's potential for infinite recursion.
function DATE_stepBackDate(y, m, d){
	d--;
	if(d < 1){
		m--;
		if(m < 1){
			y--;
			m = 12;
			d = 31;
		} else {
			d = DATE_daysInMonth(y, m);
		}
	}
	return y + "-" + DATE_dd(m) + "-" + DATE_dd(d) + " 04:00";
}

//only need to deal with day at the moment
//d = DATE object, sub = real
//returns altered DATE object
function DATE_dateSubtract(d, sub){
	while(sub > 0){
		if(sub >= d.day){
			sub -= d.day;
			d.month--;
			if(d.month < 1){
				d.month = 12;
				d.year--;
			}
			d.day = DATE_daysInMonth(d.year, d.month);
		} else {
			d.day -= sub;
			sub = 0;
		}
	}
	d.updateProperties();
	return d;
}

function DATE_isLeapYear(y){
	return (y % 100 === 0) ? (y % 400 === 0) : (y % 4 === 0);
}

//return days in the month, Jan = 1
function DATE_daysInMonth(y, m){
	switch(m){
		case 11:
		case 9:
		case 6:
		case 4:
			return 30;
		case 2:
			return DATE_isLeapYear(y) ? 29 : 28;
		default:
			return 31;
	}
}

function DATE (input){
	
	//properties
	//year, month, day, hour, minute
	//dateStamp, dayStart, 
	//date, time
	
	//this assumes (briefly tested) that "2020-03-31 10:40" > "2020-03-31 10:39" 
	//as of 2020-03-31 with phone date set to both pre and post DST, all Time.getHours() values are 1 hour behind where they should be.
	//log("DATE: input: " + JSON.stringify(input));	
	
	//if entry object given as string
	if(typeof input === "string"){
		var m = input.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
		if(m == null){
			//odd date format seems to crop up from time fields?			
			m = input.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
			//m[4] = DATE_correctHour(parseFloat(m[4]));
		}
		if(m != null){
			this.year 	= parseFloat(m[1]);
			this.month 	= parseFloat(m[2]);
			this.day 	= parseFloat(m[3]);
			this.hour 	= parseFloat(m[4]);
			this.minute	= parseFloat(m[5]);
		} else {
			log("DATE error. " + JSON.stringify(input) + " is not a valid date string.");
			throw "DATE error. Input is not a valid date string."
		}
	} else if(typeof input.field === "function"){
		this.year 	= input.field("Date").getFullYear();
		this.month 	= input.field("Date").getMonth()+1;
		this.day 	= input.field("Date").getDate();
		this.hour 	= DATE_correctHour(input.field("Time").getHours());
		this.minute = input.field("Time").getMinutes();
	} else if(typeof input.getFullYear === "function"){
		this.year 	= input.getFullYear();
		this.month 	= input.getMonth()+1;
		this.day 	= input.getDate();
		this.hour 	= DATE_correctHour(input.getHours());
		this.minute = input.getMinutes();
	} else {
		log("DATE error. " + JSON.stringify(input) + " is not a valid input.");
		throw "DATE error. Input is not valid."
	}
	
	this.updateProperties = function(){
		
		this.dateStamp = 	this.year		+ "-" + 
							DATE_dd(this.month) 	+ "-" + 
							DATE_dd(this.day )	+ " " + 
							DATE_dd(this.hour) 	+ ":" + 
							DATE_dd(this.minute);

		//04:00 defined as the start of the day, so if time is 00:00 < time < 03:39, step back a day
		if(this.hour < 4){
			this.dayStart = DATE_stepBackDate(this.year, this.month, this.day);
		} else {
			this.dayStart = this.year		+ "-" + 
							DATE_dd(this.month) 	+ "-" + 
							DATE_dd(this.day )	+ " " +
							"04:00";
		}
						
		this.date = this.year		+ "-" + 
					DATE_dd(this.month) 	+ "-" + 
					DATE_dd(this.day )	+ " ";
		
		this.time = DATE_dd(this.hour) 	+ ":" + 
					DATE_dd(this.minute);
	}
	
	this.updateProperties();
}

log("DATE " + editDateDATE + " loaded");
LOG.create({Log : "DATE " + editDateDATE + " loaded"});
