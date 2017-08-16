var otpobj = {};
document.addEventListener("DOMContentLoaded", function(){
	var bg = chrome.extension.getBackgroundPage();
	otpobj = bg.otpobj;

	var nt = document.getElementById("notifications_inpt");
	nt.checked = otpobj.notifications;
	nt.addEventListener("change",changeNotification,false);

	var nts = document.getElementById("notifications_sound_inpt");
	nts.checked = otpobj.sound;
	nts.addEventListener("change",changeSound,false);

	var srt = document.getElementById("sort_list");
	srt.checked = otpobj.sort;
	srt.addEventListener("change",changeSort,false);

	var plng = document.getElementById("polling_inpt");
	plng.value = otpobj.interval;
	plng.addEventListener("change",changePolling,false);
});
function changeNotification(){
	if(this.checked){
		otpobj.notifications = true;
	}else{
		otpobj.notifications = false;
	}
	setOptions();
}
function changeSound(){
	if(this.checked){
		otpobj.sound = true;
	}else{
		otpobj.sound = false;
	}
	setOptions();
}
function changeSort(){
	if(this.checked){
		otpobj.sort = true;
	}else{
		otpobj.sort = false;
	}
	setOptions();
}
function changePolling(){
	var val = this.value-0;
	if(val > 900 || val < 15){
		val = 30;
	}
	otpobj.interval = val;
	setOptions();
}
function setOptions(){
	var bg = chrome.extension.getBackgroundPage();
	bg.storeOptions(otpobj);
}
