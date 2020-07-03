//a custom made DATE object that parses Memento entries into strings. I intend to use this in most Memento scripts where necessary.
/*2020-03-31
1515
added string input method.
1715
corrected not stepping back a day for dayStart if hour < 4.
this causes problems at the start of a month... so we cheat and use the Date object for a bit.
1800
added in stepBackDate, split out subroutines to avoid repeated definitions.

2020-07-03
1300
added in Date object input
*/

function correctHour(h){
	h += 1;
	return  h > 23 ? 0 : h;
}
//returns a double digit string from a number - ie 1 => "01"
function dd(n){
	return n < 10 ? "0" + n : "" + n;
}
//returns the previous start of day
function stepBackDate(y, m, d){
	d--;
	if(d < 1){
		m--;
		if(m < 1){
			y--;
			m = 12;
			d = 31;
		} else {
			d = daysInMonth(m);
		}
	}
	return y + "-" + dd(m) + "-" + dd(d) + " 04:00";
}

function isLeapYear(y){
	return (y % 100 === 0) ? (y % 400 === 0) : (y % 4 === 0);
}

//return days in the month, Jan = 1
function daysInMonth(y, m){
	switch(m){
		case 11:
		case 9:
		case 6:
		case 4:
			return 30;
		case 2:
			return isLeapYear(y) ? 29 : 28;
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

	this.year = "empty";
	try{this.year = input.getFullYear();}
	catch(e){message(this.year);}
	//if entry object given as string
	if(typeof input == "string"){
		var m = input.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
		if(m != null){
			this.year 	= parseFloat(m[1]);
			this.month 	= parseFloat(m[2]);
			this.day 	= parseFloat(m[3]);
			this.hour 	= parseFloat(m[4]);
			this.minute	= parseFloat(m[5]);
		}
	} else if(this.year == "empty"){
		this.year 	= input.field("Date").getFullYear();
		this.month 	= input.field("Date").getMonth()+1;
		this.day 	= input.field("Date").getDate();
		this.hour 	= correctHour(input.field("Time").getHours());
		this.minute = input.field("Time").getMinutes();
	} else {
		this.month 	= input.getMonth()+1;
		this.day 	= input.getDate();
		this.hour 	= input.getHours();
		this.minute = input.getMinutes();
	}
	
	this.dateStamp = 	this.year		+ "-" + 
						dd(this.month) 	+ "-" + 
						dd(this.day )	+ " " + 
						dd(this.hour) 	+ ":" + 
						dd(this.minute);

	//04:00 defined as the start of the day, so if time is 00:00 < time < 03:39, step back a day
	if(this.hour < 4){
		this.dayStart = stepBackDate(this.year, this.month, this.day);
	} else {
		this.dayStart = this.year		+ "-" + 
						dd(this.month) 	+ "-" + 
						dd(this.day )	+ " " +
						"04:00";
	}
					
	this.date = this.year		+ "-" + 
				dd(this.month) 	+ "-" + 
				dd(this.day )	+ " ";
	
	this.time = dd(this.hour) 	+ ":" + 
				dd(this.minute);
	
}

//2020-07-03 16:15
