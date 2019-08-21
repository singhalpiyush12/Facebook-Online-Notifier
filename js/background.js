var fbobj = {
	dtsg:null,
	ajax:null,
	c_user:null,
	activelist:[]
};
var otpobj = {
	notifications:true,
	sound:true,
	sort:true,
	interval:30
};
var username = prompt("Who are you waiting for?");
var timerid = null;
var ignorelist = [];
document.addEventListener("DOMContentLoaded", function(){
	loadOptions();
	var audio = document.createElement("audio");
	audio.setAttribute("id","audio");
	audio.setAttribute("src","sound/alart.mp3")
	document.body.appendChild(audio);
	setTimeout(function(){
		getFBM("https://m.facebook.com/buddylist.php");
		init(otpobj.interval)	
	},1500)
	loadIgnoreList();
}, false);

function loadIgnoreList(){
	var lcobj = localStorage.getItem("__ignorelist__");
	if(lcobj){
		ignorelist = JSON.parse(lcobj);
	}
}
function setIgnoreList(id,setflg){
	id = id-0;
	if(setflg){
		if(ignorelist.indexOf(id) === -1){
			ignorelist.push(id)
		}
	}else{
		var idx = ignorelist.indexOf(id);		
		if(idx !== -1){
			ignorelist.splice(idx,1);
		}
	}
	localStorage.setItem("__ignorelist__",JSON.stringify(ignorelist));
}
function checkIgnoreList(id){
	id = id-0;
	if(ignorelist.indexOf(id) !== -1){
		return true;
	}else{
		return false;
	}
}
function storeOptions(obj){
	otpobj = obj;
	init(otpobj.interval)
	localStorage.setItem("__options__",JSON.stringify(otpobj));
}
function loadOptions(){
	var lcsobj = localStorage.getItem("__options__");
	if(lcsobj){
		otpobj = JSON.parse(lcsobj);
	}
}
function init(sec){
	clearTimeout(timerid)
	timerid = setInterval(function(){
		getFBM("https://m.facebook.com/buddylist.php");
	},(sec-0)*1000);
}
function getFBM(url){
	if(fbobj.dtsg&&fbobj.ajax&&fbobj.c_user){
		postFBM("https://m.facebook.com/buddylist_update.php",fbobj.dtsg,fbobj.ajax,fbobj.c_user)
	}else{
		getToken(url);
	}
}
function getToken(url){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4){
            if(xhr.status == 200) {
                var txt = xhr.responseText;
                var parser = new DOMParser();
                var html = parser.parseFromString(txt, "text/html");
				var scripts = html.querySelectorAll("script");
				var flg = false;
				for(var i = 0; i < scripts.length; i++){
					var t = scripts[i].textContent;
					if(t.match(/MRequestConfig/)){
						var tt = t.split(/\"MRequestConfig\"\s*\,\s*\[\]\s*\,/)[1];
						var tts = tt.split(/\}\s*\,/);
						var ttt = tts[0]+"},"+tts[1]+"}}"
						var json = JSON.parse(ttt)
						fbobj.dtsg = json.dtsg.token;
						fbobj.ajax = json.dtsg_ag.token;
						flg = true;
						break;
					}
				}
				if(flg){
					for(var i = 0; i < scripts.length; i++){
						flg = false;
						var t = scripts[i].textContent;
						if(t.match(/\{\"USER_ID\"\:/)){
							var tt = t.split(/\{\"USER_ID\"\:/)[1];
							var tts = tt.split(/\,/)[0].replace('"',"");
							fbobj.c_user = parseInt(tts);
							flg = true;
							break;
						}
					}
				}
				if(flg)postFBM("https://m.facebook.com/buddylist_update.php",fbobj.dtsg,fbobj.ajax,fbobj.c_user)
            }else{
				initialize();        	
            }
        }
    };
    xhr.send(null);
}
function postFBM(url,fb_dtsg,fb_ajax,c_user){
	var data = 'data_fetch=true&send_full_data=true&m_sess=&fb_dtsg='+fb_dtsg+'&__req=1&__ajax__='+fb_ajax+'&__user='+c_user;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4){
            if(xhr.status == 200) {
                var txt = xhr.responseText;
                var obj = extractJSON(txt)
                if(obj.payload&&obj.payload.buddylist)getActiveList(obj.payload);
            }else{
				initialize();        	
            }
        }
    };
	xhr.setRequestHeader("x-requested-with", ":XMLHttpRequest");
	xhr.setRequestHeader("x-response-format", "JSONStream");
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send(data);
}
function getActiveList(obj){
	var buddylist = obj.buddylist;
	var flist = obj.friend_data;
	var nactlist = [];
	for (var i = 0; i < buddylist.length; i++) {
		var item = buddylist[i];
		var jtem = flist[item.id];
		if(!jtem)continue;
		var obj = {
			id:item.id,
			name:jtem.name,
			thumb:jtem.thumbSrc
		};
		nactlist.push(obj)
	}
	checkActiveList(nactlist)
}
function checkActiveList(nactlist){
	var oactlist = fbobj.activelist;
	var inflist = [];
	var nnlist = [];
	for (var i = 0; i < nactlist.length; i++) {
		var item = nactlist[i];
		var flg = false;
		for (var j = 0; j < oactlist.length; j++) {
			var jtem = oactlist[j];
			if(jtem.id-0 === item.id-0){
				flg = true;
				break;
			}
		}
		if(!flg){
			inflist.push(item);
		}
		nnlist.push(item);
	}
	fbobj.activelist = nnlist;
	showNotification(inflist,nnlist);
}
function initialize(){
	fbobj.dtsg = null;
	fbobj.ajax = null;         	
	fbobj.activelist = [];
	chrome.browserAction.setBadgeBackgroundColor({color:"#bb0000"})
	chrome.browserAction.setBadgeText({text:""});
}
function showNotification(inflist,nnlist){

	if(nnlist.length > 0){
		chrome.browserAction.setBadgeBackgroundColor({color:"#3b5998"});
	}else{
		chrome.browserAction.setBadgeBackgroundColor({color:"#bb0000"})
	}
	chrome.browserAction.setBadgeText({text:nnlist.length+""});
	var sundflg = false;
	for (var i = 0; i < inflist.length; i++) {
		var item = inflist[i];
		if(checkIgnoreList(item.id))continue;
		sundflg = true;
        
		if(otpobj.notifications&&item.name===username){
			chrome.notifications.create('listid-'+item.id,{   
				type: 'basic', 
				title: "Facebook Online",
				message: item.name,
				iconUrl:"img/icon128.png",
				priority: 0
			},function() {if(otpobj.sound){
			var audio = document.getElementById("audio");
			if(audio)audio.play();
		}});
		}
	}
}
chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
	var isRefererSet = false,isOriginSet = false;
	var headers = details.requestHeaders,blockingResponse = {};
	for (var i = 0, l = headers.length; i < l; ++i) {
	    if (headers[i].name == 'Referer') {
	        headers[i].value = "https://m.facebook.com/buddylist_update.php";
	        isRefererSet = true;
	    }
	    if (headers[i].name == 'Origin') {
	        headers[i].value = "https://m.facebook.com";
	        isOriginSet = true;
	    }
	}
	if (!isRefererSet) {
	    headers.push({
	        name: "Referer",
	        value: "https://m.facebook.com/buddylist_update.php"
	    });
	}
	if (!isOriginSet) {
	    headers.push({
	        name: "Origin",
	        value: "https://m.facebook.com"
	    });
	}
	blockingResponse.requestHeaders = headers;
	return blockingResponse;
},{urls: ["https://m.facebook.com/buddylist_update.php"]},['requestHeaders', 'blocking']);
function extractJSON(str) {
  var firstOpen, firstClose, candidate;
  firstOpen = str.indexOf('{', firstOpen + 1);
  var countOpen = 0, countClose = 0;
  do {
    countOpen++;
    firstClose = str.lastIndexOf('}');
    if (firstClose <= firstOpen) {
      return null;
    }
    countClose = 0;
    do {
      countClose++;
      candidate = str.substring(firstOpen, firstClose + 1);
      var res;
      try {
        res = JSON.parse(candidate);
        return res;
      } catch (e) {}
      try {
        res = eval("(" + candidate + ")");
        return res;
      } catch (e) {}
      firstClose = str.substr(0, firstClose).lastIndexOf('}');
    } while (firstClose > firstOpen && countClose < 20);
    firstOpen = str.indexOf('{', firstOpen + 1);
  } while (firstOpen != -1 && countOpen < 20);
}
chrome.runtime.onInstalled.addListener(function(details) {
    if(details.reason == "install"){
        setTimeout(function(){
            openOptionsPage();
        },800);
    }
});
function openOptionsPage(){
    var extviews = chrome.extension.getViews({"type": "tab"});
    for (var i=0; i <= extviews.length; i++) { 
        if (i == extviews.length) { 
            chrome.tabs.create({
                url: "options.html"
            });
        }else if (extviews[i].location.href == chrome.extension.getURL("options.html")) { 
            extviews[i].chrome.tabs.getCurrent(function (focusTab){
                chrome.tabs.update(focusTab.id, {"active": true}); 
            }); 
            break; 
        } 
    } 
}


