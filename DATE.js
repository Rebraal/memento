//a custom made DATE object that parses Memento entries into strings. I intend to use this in most Memento scripts where necessary.
function DATE (entry){
	//this assumes (briefly tested) that "2020-03-31 10:40" > "2020-03-31 10:39" 
	//as of 2020-03-31 with phone date set to both pre and post DST, all Time.getHours() values are 1 hour behind where they should be.
	this.correctHour = function(h){
		h += 1;
		return  h > 23 ? 0 : h;
	};
	//returns a double digit string from a number - ie 1 => "01"
	this.dd = function(n){
		return n < 10 ? "0" + n : "" + n;
	}
		
	this.year 	= entry.field("Date").getFullYear();
	this.month 	= entry.field("Date").getMonth()+1;
	this.day 	= entry.field("Date").getDate();
	this.hour 	= this.correctHour(entry.field("Time").getHours());
	this.minute = entry.field("Time").getMinutes();
	
	this.dateStamp = 	this.year				+ "-" + 
						this.dd(this.month) 	+ "-" + 
						this.dd(this.day )		+ " " + 
						this.dd(this.hour) 		+ ":" + 
						this.dd(this.minute);
				
	//04:00 defined as the start of the day.
	this.dayStart = this.year	+ "-" + 
					this.month 	+ "-" + 
					this.day 	+ " " + 
					04:00;
					
	this.date = this.year			+ "-" + 
				this.dd(this.month) + "-" + 
				this.dd(this.day )	+ " " + ;
	
	this.time = this.dd(this.hour) 		+ ":" + 
				this.dd(this.minute);
}