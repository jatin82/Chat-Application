//each token gid:::uid:::name::status:::message
var userID = null;
var gid = 0;
var chatName=null;
var senderID = null;
var message = null;
var part={name:null,status:null};
var webSocket = null;
var decoded = null;
var mainHost = null;
var wsAddresss = null;
var currentChat = null;
var particpants = {};
var chats = {};
var selected = [];
var isLoad = false;
var isNew = false;
var isPrivate = false;
var size = 0;
// helper functions

// remove space , > , : , -
function validation(txt){
	while(txt.indexOf('>')!=-1 || txt.indexOf(':')!=-1 || txt.indexOf('-')!=-1 ){
		txt = txt.replace('>','');
		txt = txt.replace(':','');
		txt = txt.replace('-','');
	}
	return txt;
}

function createGroupList(){
	node = '<div class="card pBody fg-white bg-black" chatid="'+gid+'" ispart="no">'+
				'<div class="pImg"><span class="fa fa-user"></span></div>'+
				'<div class="pName">'+chatName+'</div>'+
			'</div>';
	$('#list #particpants').append(node);
	$('.hidden-xs #particpants').append(node);
}

function createListModal(){
	$('.modal-body').html('');
	for(var key in particpants){
		node = ''+'<div class="fg-main selectList" id="'+key+'">'+
					'<div class="item row">'+
					'<div class="itemName col-sm-10"><span class="fa fa-user-o fa-2x"></span>'+key.split('-')[0]+'</div>'+
					'<div class="itemStatus col-sm-2"><span class="customRadio"></span><span class="fa fa-check-circle fa-2x" style="display: none"></span></div>'+
				'</div>'+
				'</div>';
		$('.modal-body').append(node);
	}
}

// msg = >groupname:::reqID-1::reqID-2::reqID-3:::userID:::message
function requestGroupDecod(Chatname){

	loadOn();
	if(selected.length==0)
		return;
	gname = $('#gname').val();
	gname = validation(gname);
	temp = '>'+gname+':::';
	for(i=0;i<selected.length;i++){
		if(i==0)
			temp +=selected[i];
		else
			temp+="::"+selected[i];
		}
	temp+=':::'+userID+':::'+'Created Group';
	decoded = temp;
	wsSendMessage();
}
//msg = >null:::reqID-1:::userID:::message
function requestChatAndEncrypt(reqId,message){
	if(reqId!=userID)
	{
		decoded = '>null:::'+reqId+':::'+userID+':::'+message;
		wsSendMessage();
	}
}

function resetSelected(){
	for(i=0;i<selected.length;i++){
		$('#'+selected[i]+' .item .itemStatus .customRadio').toggle();
		$('#'+selected[i]+' .item .itemStatus .fa').toggle();				
	}	
	selected = [];
	
}

setHeight = function(x,tag){
	y = $(window).height();
	tag.height(y-x);
}
setWidth = function(x,tag){
	y = $(window).width();
	tag.width(y-x);
}

function loadOn(){
	isLoad = true;
	$('.chatmain').css({'display':'none'});
	$('#load').css({'display':'block'});
}
function loadOff(){
	isLoad = false;
	$('#load').css({'display':'none'});
	$('.chatmain').css({'display':'block'});
}


function selectParticpant(id,isSelect){
	if(isSelect)
		selected.push(id);
	else
		selected.splice(selected.indexOf(id),1);
}



function notification(tag){

	temp ="";
	
	if(message.length>=10)
		temp = message.substring(0,10)+'...';
	else
		temp = message;
	
	node =  '<div class="notification" style="display:none">'+
		   		'<span class="fa fa-close exit fg-white"></span>'+ 
				'<div class="content">'+
					'<div class="header">@'+senderID.split('-')[0]+'</div>'+
					'<div class="body">'+temp+'</div>'+
				'</div>'+
			'</div>';

	node = $(node);
	$(tag).append(node);
	$(node).fadeIn('fast', function() {
		$(this).fadeOut(4000,function(){
			$(this).remove();
		});
	});
}

function switchChat(node){
	$(currentChat).css({"display":"none"});
	currentChat = node;
	$(node).css({"display":"block"});
}

function getMessageAndSend(){
	message = $("#message").val();
	message = validation(message);
	if(message!=""){
		gid = $(currentChat).attr('id');
		messageEncrypt();
		wsSendMessage();
	}
	$('#message').val('');
}

function showMsg(isScroll){

	if(senderID==userID){
		align = "text-right";
		color = "bg-totiya";
	}else{
		align = "text-left";
		color = "bg-main";
	}
	
	sendMessage = '<div class="col-sm-12"><div class="row"><div class="message '+align+'"><div class="mContent '+color+' fg-white"><h4 class="text-left">'+senderID.split("-")[0]+'</h4>'+
	'<h5>'+message+'</h5></div></div></div></div>';	
	$('#'+gid+' #chatbook').append(sendMessage);
	if(isScroll)
		$('#'+gid+' #chatbook').animate({scrollTop: $('#'+gid+' #chatbook').prop("scrollHeight")}, 500);
}

function updateMainParticpant(){
	users = part.name.split(":");
	statusAll = part.status.split(":");
	
	n = users.length
	size = 0;
	for(var i=0;i<n;i++){

		if(statusAll[i]=="remove"){
			
			if($(currentChat).attr('id')==gid&&"room-0"!=gid){
				switchChat($('#room-0'));
				setHeight($('#header').height() + $('#room-0 #hChatMain').height()+ $('#inputChatMain').height()+12,$("#room-0 #chatbook"));
				notification($('.notifications'));
				$('#'+gid).remove();
			}
			
			//  close all particpants lists
			if(particpants.hasOwnProperty(users[i])){
				cur = $('.hidden-xs #particpants').find("[chatid='"+gid+"']");
				
				
				cur = $('.hidden-xs #particpants').find("[chatid='"+users[i]+"']");
				$(cur).remove();
				
				
				cur = $("#list #particpants").find("[chatid='"+users[i]+"']");
				$(cur).remove();
				
				delete particpants[users[i]];
				size = size-1;
			}
		}
		else if(statusAll[i]=="add"){

			cur = $('.hidden-xs #particpants').find("[chatid='"+users[i]+"']");

			if(userID!=users[i])
			{
				if(isPrivate==true)
					particpants[users[i]] = gid;
				else
					particpants[users[i]] = false;
			}
			if(cur.length==0){
				size = size+1;
				
				
				
				node = '<div class="card pBody fg-white bg-black" chatid="'+users[i]+'" ispart="yes">'
				+'<div class="pImg"><span class="fa fa-user"></span></div>'
				+'<div class="pName">'+users[i].split('-')[0]+'</div></div>';
				$('#list #particpants').append(node);
				$('.hidden-xs #particpants').append(node);
			}
		}
	}
}
// gid:::userid:::message
function messageEncrypt(){
	decoded =  gid+':::'+userID+':::'+message;
}

//msg = gid:::senderid:::part.name::part.status:::message;
function messageDecrypt(msg){

	x = msg.split(':::');
	gid = x[0];
	
//	if new personal id_id-45:::usid:::part.name::part.status:::message;	
	
	if(gid.indexOf("_")!=-1){
		temp = gid.split('_');

		if(userID.split('-')[0]==temp[0])
			chatName = temp[1].split("-")[0];
		else
			chatName = temp[0];
		isPrivate = true;
	}
	else{
		isPrivate = false;
		chatName = x[0].split('-')[0];
	}
	senderID = x[1];
	part.name = x[2].split('::')[0];
	part.status = x[2].split('::')[1];
	message = x[3];
}
// main web socket function
function wsOpen(message){
	console.log("Connected...");
}
function wsSendMessage(){
	webSocket.send(decoded);
}
function wsCloseConnection(){
	webSocket.close();
}
function wsGetMessage(msg){
	messageDecrypt(msg.data);

	isScroll = false;
	
	// for chats
	if(!chats.hasOwnProperty(gid)){
		createChat();
		chats[gid] = gid;//falseisPrivate==false?gid:false;
		if(!isPrivate)
			createGroupList();
	}

	// view
	updateMainParticpant();
	if($(currentChat).attr('id')!=gid){
		if(userID==senderID)
		{
			temp = "#"+gid;
			switchChat($(temp));
			setHeight($('#header').height()+$(temp+' #hChatMain').height() + $('#inputChatMain').height()+12,$(temp+" #chatbook"));
		}
		else
			notification($('.notifications'));
	}
	else
		isScroll = true;
	showMsg(isScroll);
	loadOff();
}

function wsClose(message){
//	console.log(message)
}

function wserror(message){
}

function createChat(){
	node = '<!-- A room -->'+
				'<div id="'+gid+'" style="display:none">'+
					'<div class="row bg-skin" id="hChatMain">'+
						'<h3 class="text-center fg-other">'+chatName+'</h3>'+
					'</div>'+
					'<div class="row" id="chatbook"></div>'+
				'</div>'+
			'<!-- Room ends-->';

	$('.chatMain').prepend(node);

}
function upadateMiniGroup(){
	
}


$(document).ready(function(){
	
	mainHost = $(location).attr('hostname');
	wsAddress = "ws://"+mainHost+":8080/Chat/room"
	
	
	url = $(location).attr('href');
	
	if(url.indexOf('socket.html')!=-1){
		
		
		$('#addModal').modal({ show: false})
		currentChat = $("#room-0");
		chats['room-0'] = "room-0";
		switchChat($("#room-0"));


		setHeight($('#pHeader').height() + $('#header').height(),$(".hidden-xs #particpants"));
		setHeight($('#header').height() + $('#room-0 #hChatMain').height()+ $('#inputChatMain').height()+12,$("#room-0 #chatbook"));
		setHeight($('#header').height(),$("#list #particpants"));
		setWidth(0,$("#list #particpants"));
		setHeight($('#header').height(),$("#load"));

		// set heights when window size changes
		$(window).resize(function(){
			temp = $(currentChat).attr('id'); 
			setHeight($('#pHeader').height() + $('#header').height(),$(".hidden-xs #particpants"));
			setHeight($('#header').height(),$("#list #particpants"));
			setWidth(0,$("#list #particpants"));
			setHeight($('#header').height(),$("#load"));
			setHeight($('#header').height() + $('#'+temp+' #hChatMain').height()+ $('#inputChatMain').height()+12,$('#'+temp+' #chatbook'));
		});
		
		loadOn();
	    $.ajax({url: "UserService",async:false,success: function(result){
	    	userID = result;
	    	loadOff();
	    }});
		
		$("#header .infoButton").click(function(e){
			$("#list #particpants").toggle();
		});
		
	    webSocket = new WebSocket(wsAddress);
		message = document.getElementById("message");
		
		webSocket.onopen = function(message){ loadOn();wsOpen(message);};
		webSocket.onmessage = function(message){ wsGetMessage(message);};
		webSocket.onclose = function(message){ wsClose(message);};
		webSocket.onerror = function(message){ wsError(message);};
	
		
		$('#message').keypress(function(event) {
			if(event.which==10||event.which==13){
				getMessageAndSend();
			}
		});
		
		$('#send').click(function(event) {
			getMessageAndSend();
		});
		
		// handling various chats at mobile
		$('#list #particpants').on('click','.card',function(event){
			isOld = true
			nameGroup = $(this).attr('chatid');
			if(nameGroup!=userID){
				if($(this).attr('ispart')=="yes"){
					if(particpants[nameGroup]==false){
						requestChatAndEncrypt(nameGroup,"Started Chat");
						loadOn();
						isOld = false
					}
					else{
						nameGroup = particpants[nameGroup];
					}
				}
				else{// has to do
					if(!chats.hasOwnProperty(nameGroup)){
						requestChatAndEncrypt(nameGroup,"Started Group");
						loadOn();
						isOld = false;
					}
					else{
						nameGroup = chats[nameGroup];
					}	
				}
				if(isOld){
					temp = '#'+nameGroup;
					switchChat($(temp));
					$(temp+' #hChatMain h3').html(nameGroup.split("_")[0].split("-")[0]);
					setHeight($('#header').height()+$(temp+' #hChatMain').height() + $('#inputChatMain').height()+12,$(temp+" #chatbook"));
				}
				
				$('#list #particpants').css({'display':'none'});
			}
		});
		
		// handling various chats at Desktop
		$('.hidden-xs #particpants').on('click','.card',function(event){
			isOld = true
			nameGroup = $(this).attr('chatid');
			if(nameGroup!=userID){
				if($(this).attr('ispart')=="yes"){
					if(particpants[nameGroup]==false){
						requestChatAndEncrypt(nameGroup,"Started Chat");
						loadOn();
						isOld = false
					}
					else{
						nameGroup = particpants[nameGroup];
					}
				}
				else{// has to do
					if(!chats.hasOwnProperty(nameGroup)){
						requestChatAndEncrypt(nameGroup,"Started Group");
						loadOn();
						isOld = false;
					}
					else{
						nameGroup = chats[nameGroup];
					}	
				}
				if(isOld){
					temp = '#'+nameGroup;
					switchChat($(temp));
					$(temp+' #hChatMain h3').html(nameGroup.split("_")[0].split("-")[0]);
					setHeight($('#header').height()+$(temp+' #hChatMain').height() + $('#inputChatMain').height()+12,$(temp+" #chatbook"));
				}
				
			}			
		});
		
		$('.modal-body').on('click','.selectList',function(){
			temp = $(this).attr('id');
			status = $('#'+temp+' .customRadio').css('display');
			$('#'+temp+' .item .itemStatus .customRadio').toggle();
			$('#'+temp+' .item .itemStatus .fa').toggle();			
			selectParticpant(temp,status=='block');
		});

		$('#addGroup').click(function(){
			temp = $('#gname').val();
			$('#addModal').modal('toggle');
			if(selected.length>0){
				requestGroupDecod(temp);
				resetSelected();
			}
			$('#list #particpants').css({'display':'none'});
		});
		$("#cancelGroup").click(function(event) {
			$('#addModal').modal('hide');
			resetSelected();
			
			$('#list #particpants').css({'display':'none'});
		});
		
		$('.notification').on('click','.fa-close',function(){
			$(this).remove();
		});
		
		$('.add').click(function(){
			createListModal();
			$('#addModal').modal('show');
		})
		
		// getting particpant
	}
});