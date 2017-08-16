var fbobj = {
    activelist:[],
    lastactivelist:[]
};
var otpobj = {};
document.addEventListener("DOMContentLoaded", function(){
	var bg = chrome.extension.getBackgroundPage();
	otpobj = bg.otpobj;
    getMessengerPage("https://www.facebook.com/messages/");
}, false);

function getMessengerPage(url){
    var actobj = null,pobj = null;
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
                    if(t.match(/AvailableListInitialData/)&&!actobj){
                        var tt = t.split(/\"AvailableListInitialData\"\s*\,\s*\[\]\s*\,/)[1].split(/\}\s*\,/)[0];
                        var ts = tt.split(/\,/);
                        var rtxt = ts.join(",");
                        actobj = JSON.parse(rtxt+"}}");
                    }
                    if(t.match(/shortProfiles/)&&!pobj){
                        var p = t.split(/\"shortProfiles\"\s*\:\s*/)[1].split(/\"nearby\"\s*\:/)[0];
                        var pp = p.split(/\,/);
                        pp.pop();
                        var ptxt = pp.join(",");
                        pobj = JSON.parse(ptxt)
                    }
                }
                createUserList(actobj,pobj);
            }
        }
    };
    xhr.send(null);
}
function createUserList(actobj,pobj){
    if(!actobj || !pobj)return;
    var activelist = actobj.activeList;
    var cont = document.querySelector(".maincontainer");
    var a = actobj.lastActiveTimes
    var idlist = pobj;
    var d = [];
    var userlist = [];
    for(var id in a){
        var time = a[id];
        var name = idlist[id].name; 
        var uri = idlist[id].uri;      
        var t = new Date(time*1000);
        var year = t.getFullYear();
        var month = t.getMonth()+1;
        var day = t.getDate();
        var hour = t.getHours();
        var min = t.getMinutes();
        var sec = t.getSeconds();
        var nowtime = Math.floor((new Date())/1000);
        var dsec = (nowtime-time)%60;
        var dmin = Math.floor((nowtime-time)/60)%60;
        var dhour = Math.floor((nowtime-time)/3600)%24;
        var dday = Math.floor((nowtime-time)/86400);
        (dday==0 && dhour==0 && dmin==0 && dsec==0)?dsec="":dsec=dsec+"s";
        (dday==0 && dhour==0 && dmin==0)?dmin="":dmin=dmin+"m";
        (dday==0 && dhour==0)?dhour="":dhour=dhour+"h";
        dday==0?dday="":dday=dday+"d";

        var obj = {};
        obj.id = id;
        obj.name = name;
        obj.time = time;
        obj.uri = uri;
        obj.tstr = year+"/"+month+"/"+day+" "+((hour<10)?("0"+hour):hour)+":"+((min<10)?("0"+min):min)+":"+((sec<10)?("0"+sec):sec);
        obj.pstr = dday+" "+dhour+" "+dmin+" "+dsec;
        userlist.push(obj)
        d.push([id, name, year+"/"+month+"/"+day+" "+((hour<10)?("0"+hour):hour)+":"+((min<10)?("0"+min):min)+":"+((sec<10)?("0"+sec):sec), dday+" "+dhour+" "+dmin+" "+dsec]);
    }
    if(otpobj.sort){
	    var nuserlist = objectSort(userlist,"time")
    }else{
    	var nuserlist = userlist;
    }

    var bg = chrome.extension.getBackgroundPage();
    var ignorelist = bg.ignorelist;

    var table = document.createElement("table");
    cont.appendChild(table)
    table.setAttribute("border","1");
    table.style.borderCollapse = "collapse"

    for(i=0;i<nuserlist.length;i++){
        var item = nuserlist[i]
        var aflg = false;
        for (var j = 0; j < activelist.length; j++) {
            var jtem = activelist[j];
            if(jtem-0 === item.id-0){
                aflg = true;
                break;
            }
        }

        var tr = document.createElement("tr");
        table.appendChild(tr)

        var td = document.createElement("td");
        tr.appendChild(td)
        var spn = document.createElement("span");
        td.appendChild(spn)
        spn.setAttribute("class","onoffswitch")

        var chkbox = document.createElement("input");
        spn.appendChild(chkbox)
        chkbox.setAttribute("type","checkbox")
        chkbox.setAttribute("name","onoffswitch")
        chkbox.setAttribute("class","onoffswitch-checkbox")
        chkbox.setAttribute("id",item.id);
        chkbox.addEventListener("change",changeSwitch,false);

        if(ignorelist.indexOf(item.id-0) === -1){
            chkbox.setAttribute("checked","")
        }

        var lbl = document.createElement("label");
        spn.appendChild(lbl)
        lbl.setAttribute("class","onoffswitch-label")
        lbl.setAttribute("for",item.id)
        var cpsn = document.createElement("span");
        lbl.appendChild(cpsn)
        cpsn.setAttribute("class","onoffswitch-inner")
        var cpsn = document.createElement("span");
        lbl.appendChild(cpsn)
        cpsn.setAttribute("class","onoffswitch-switch")
        td.style.width = "90px";

        var td = document.createElement("td");
        tr.appendChild(td)

        if(aflg){
            td.style.backgroundColor = "lime"
        }

        var a = document.createElement("a");
        td.appendChild(a)
        a.setAttribute("target","_blank")
        a.setAttribute("href",item.uri)
        a.textContent = item.name;

        var td = document.createElement("td");
        tr.appendChild(td)
        td.style.textAlign = "right"
        td.textContent = item.tstr;

        var td = document.createElement("td");
        tr.appendChild(td)
        td.style.textAlign = "right"
        td.textContent = item.pstr;
    }
}
function changeSwitch(e){
    var elem = e.currentTarget;
    var id = elem.getAttribute("id");
    var bg = chrome.extension.getBackgroundPage();
    if(elem.checked){
        bg.setIgnoreList(id,false)
    }else{
        bg.setIgnoreList(id,true)
    }
}
function objectSort(data,key,order){
    var num_a = -1;
    var num_b = 1;
    if(order === 'asc'){
      num_a = 1;
      num_b = -1;
    }
    data = data.sort(function(a, b){
      var x = a[key];
      var y = b[key];
      if (x > y) return num_a;
      if (x < y) return num_b;
      return 0;
    });
    return data;
}