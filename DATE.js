//a custom made DATE object that parses Memento entries into strings. I intend to use this in most Memento scripts where necessary.
/*2020-03-31
1515
added string input method.
*/
function DATE (input){
	
	//this assumes (briefly tested) that "2020-03-31 10:40" > "2020-03-31 10:39" 
	//as of 2020-03-31 with phone date set to both pre and post DST, all Time.getHours() values are 1 hour behind where they should be.
	this.correctHour = function(h){
		h += 1;
		return  h > 23 ? 0 : h;
	};
	//returns a double digit string from a number - ie 1 => "01"
	this.dd = function(n){
		return n < 10 ? "0" + n : "" + n;
	};
	//if entry object given as string
	if(typeof input == "string"){
		var m = input.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
		if(m != null){
			this.year 	= m[1];
			this.month 	= m[2];
			this.day 	= m[3];
			this.hour 	= m[4];
			this.minute	= m[5];
		}
	} else {
		this.year 	= input.field("Date").getFullYear();
		this.month 	= input.field("Date").getMonth()+1;
		this.day 	= input.field("Date").getDate();
		this.hour 	= this.correctHour(input.field("Time").getHours());
		this.minute = input.field("Time").getMinutes();
	}
	this.dateStamp = 	this.year				+ "-" + 
						this.dd(this.month) 	+ "-" + 
						this.dd(this.day )		+ " " + 
						this.dd(this.hour) 		+ ":" + 
						this.dd(this.minute);
				
	//04:00 defined as the start of the day.
	this.dayStart = this.year	+ "-" + 
					this.dd(this.month) + "-" + 
					this.dd(this.day )	+ " " +
					"04:00";
					
	this.date = this.year			+ "-" + 
				this.dd(this.month) + "-" + 
				this.dd(this.day )	+ " ";
	
	this.time = this.dd(this.hour) 		+ ":" + 
				this.dd(this.minute);
}
