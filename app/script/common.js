const fs = require("fs");
const nodegrass = require('nodegrass');
const cheerio = require('cheerio');
const ipc = require('electron').ipcRenderer;
const low = require('lowdb');
const db = low('app/db.json');
db.defaults({ song: [], user: {} })
  .value()
var chooser = document.getElementById('submit');
var left = document.querySelector('.music-list');

chooser.addEventListener('change', function (event) {
    var files = this.files;
    for (var i = 0; i < files.length; ++i){
    	var time = audioTime(files[i].path);
    	var musicName = files[i].name.substring(0,files[i].name.indexOf('.'));
    	apendText(musicName,files[i].path);
    }
});

//返回音频时长
function audioTime(path){
	fs.stat(path,function(err,stats){
		console.log(stats);
		console.log(parseInt(stats.dev)/60000);
	});
}



//将歌曲地址遍历到页面
// db._.mixin({
//   findAll: function(array) {
//     return array
//   }
// })
// db.defaults({ posts: [], user: {} })
//   .value()
var songArray = db.get('song').value();
console.log('songArray', songArray);
if (songArray.length>0) {
	for (var i = 0; i < songArray.length; i++) {
		apendText(songArray[i].songName, songArray[i].url);
	};
}

function apendText(text,path, fn) {

	var element = document.createElement('div');
	element.setAttribute('data-path', path);
	element.appendChild(document.createTextNode(text));
	left.appendChild(element);
	fn ? fn() : null;
}

(function($){

	var index = 0;
	var sound = 0.5;
	var soundTime = 0;
	var audio = document.getElementById("audio");
	audio.volume=sound;

	//关闭窗口
	$(document).on('click', '#close', function(){	
		ipc.sendSync('close');
	});
	$(document).on('click', '#max', function(){
		$('#reduction').show();
		$('#max').hide();
		ipc.sendSync('max');
	})
	$(document).on('click', '#reduction', function(){
		$('#reduction').hide();
		$('#max').show();
		ipc.sendSync('restore');
	})
	$(document).on('click', '#min', function(){
		ipc.sendSync('min');
	});

	//点击暂停按钮
	$(document).on('click', '.Pause', function(){
		var inde = parseInt($(this).attr('data-index'));
		if(inde){
			audio.play();
			$(this).attr('data-index',0)
			$(this).addClass('play');
			$(".phonograph").addClass('rotation');
		}
		else{
			audio.pause();
			$(this).attr('data-index',1);
			$(this).removeClass('play');
			$(".phonograph").removeClass('rotation');
		}
		
	});

	$(document).on('dblclick', '.left div', function(){
		index = parseInt($(this).index());
		$('.music-list').find('div').siblings().removeClass('hover');
		$(this).addClass('hover');
		$('.song-name').find('span').text($(this).text());
		$('.soundBack').css('width', (sound*100)+'px');
   		$('.sound').css('left',((sound*100)-10)+'px');
		var path = this.getAttribute('data-path');
		$('.Pause').attr('data-index',0);
		if (audio != null && audio.canPlayType && audio.canPlayType("audio/mpeg")){
			audio.src = path;
			audio.play();
			$(".phonograph").addClass('rotation');
			$('.Pause').addClass('play');
		}
	});
	

	//播放进度
	audio.addEventListener("timeupdate", function(event){
		if (!isNaN(audio.duration)) {
	        //剩余时间
	        soundTime = parseInt(audio.duration);
	        var time = parseInt(audio.duration/60)
	        var str = parseInt(audio.duration%60);
	        var surplus = audio.duration-audio.currentTime;
	        var surplusMin = parseInt(surplus/60);
	        var surplusSecond = parseInt(surplus%60);
	        if (time < 10 ) {
	            time = '0'+time;
	        };
	        if (str < 10 ) {
	            str = '0'+str;
	        };
	        if (surplusMin < 10 ) {
	            surplusMin = '0'+surplusMin;
	        };
	        if (surplusSecond < 10 ) {
	            surplusSecond = '0'+surplusSecond;
	        };
	        $('.time').text(surplusMin +' : '+ surplusSecond);
	        $('.palyTime').text(time +' : '+ str);

	        //播放进度条
	        var progressValue = audio.currentTime/audio.duration*430;
	        $('.progress').css('width', progressValue+'px');
	        $('.radius').css('left',(progressValue-10)+'px');
	    };
	}, false);

	//点击静音
	$(document).on('click', '.mute', function(){
		var mute = parseInt($(this).attr('data-mute'));
		if(mute){
			$(this).attr('data-mute',0);
			audio.volume=0;
		}
		else{
			$(this).attr('data-mute',1);
			audio.volume=sound;
		}
	});

	//点击返回音乐首页
	$(document).on('click', '.backHome', function(){
		$('.loadSong').hide();
		$('.album').show();
	});

	//拖拽选区时，移动选区位置
	var radius = document.querySelector('.radius');
	var progress = document.querySelector('.progress');
	radius.onmousedown = function(event){
		audio.pause();
		var clientX = parseInt(event.clientX);
		var offsetL = Math.floor(parseInt(radius.offsetLeft))>0 ? Math.floor(parseInt(radius.offsetLeft)) : 0;
		var progW = Math.floor(parseInt(progress.offsetWidth)) ? Math.floor(parseInt(progress.offsetWidth)) : 0;
		var moveX, progL;
		document.onmousemove=function (event){

			moveX = parseInt(event.clientX)+offsetL-clientX;
			progL = parseInt(event.clientX)-clientX+progW;
			moveX = moveX<-10 ? -10 : moveX;
			moveX = moveX>430 ? 430 : moveX;
			progL = progL<0 ? 0 : progL;
			progL = progL>430 ? 430 : progL;
			radius.style.left= moveX +'px';
	        progress.style.width= progL +'px';
	    };
	    document.onmouseup=function () {
	    	audio.currentTime = Math.floor((progL/420)*soundTime);
	    	audio.play();
	        document.onmousemove=null;
	        document.onmouseup=null;        
	    };   
	}
	$(document).on('click', '.progress-bar', function(event){
		var clientX = parseInt(event.clientX)-parseInt($(this).offset().left);
		radius.style.left= clientX-10 +'px';
        progress.style.width= clientX +'px';
		audio.currentTime = Math.floor((clientX/420)*soundTime);
		$(".phonograph").addClass('rotation');
		$('.Pause').addClass('play');
		audio.play();
	});

	//控制音量
	var oSound = document.querySelector('.sound');
	var soundBack = document.querySelector('.soundBack');
	oSound.onmousedown = function(event){
		var clientX = parseInt(event.clientX);
		var offsetL = Math.floor(parseInt(oSound.offsetLeft))>0 ? Math.floor(parseInt(oSound.offsetLeft)) : 0;
		var progW = Math.floor(parseInt(soundBack.offsetWidth)) ? Math.floor(parseInt(soundBack.offsetWidth)) : 0;
		var moveX, progL;
		document.onmousemove=function (event){

			moveX = parseInt(event.clientX)+offsetL-clientX;
			progL = parseInt(event.clientX)-clientX+progW;
			moveX = moveX<-10 ? -10 : moveX;
			moveX = moveX>100 ? 100 : moveX;
			progL = progL<0 ? 0 : progL;
			progL = progL>100 ? 100 : progL;
			oSound.style.left= moveX +'px';
	        soundBack.style.width= progL +'px';
	        sound = parseFloat(progL/100).toFixed(1);
	    	audio.volume=sound;
	    };
	    document.onmouseup=function () {
	    	
	        document.onmousemove=null;
	        document.onmouseup=null;        
	    };   
	}
	$(document).on('click', '.volume', function(event){
		var clientX = parseInt(event.clientX)-parseInt($(this).offset().left);
		oSound.style.left= clientX-10 +'px';
        soundBack.style.width= clientX +'px';
        sound = parseFloat(clientX/100).toFixed(1);
    	audio.volume=sound;
	});

	//点击上一曲切换歌曲
	//点击下一曲切换歌曲
	$(document).on('click', '.last', function(){
		index--;
		changeAudio(index);
		$('.song-name').find('span').text($('.music-list').find('div').eq(index).text());
	});
	$(document).on('click', '.next', function(){
		index++;
		changeAudio(index);
		$('.song-name').find('span').text($('.music-list').find('div').eq(index).text());
	});
	//判断音乐是否播放完毕
	setInterval(function(){
		if(audio.ended){
			index++;
			changeAudio(index);
			$('.song-name').find('span').text($('.music-list').find('div').eq(index).text());
		}
	},100);

	//切换歌曲函数函数
	function changeAudio(num){
		$('.music-list').find('div').siblings().removeClass('hover');
		$('.music-list').find('div').eq(num).addClass('hover');
		audio.src = $('.music-list').children('div').eq(num).attr('data-path');
		console.log($('.music-list').children('div').eq(num).attr('data-path'));
		audio.play();
	}

	//点击查找歌曲
	$(document).on('click', '.album dd', function(){
		var songUrl = $(this).attr('data-song');
		addSongList(songUrl,function(data){
			$('.loadSong').empty();
			$('.album').hide();
			$('.loadSong').show();
			for(var i=0; i<data.length; i++){
				var html = '<li data-song="'+data[i].url+'" class="songLi"><div class="fl"><span class="singer">'+data[i].artistName+'</span>'+
				    '<span> - </span><span class="songname">'+data[i].songName+'</span></div><div class="fr"><span class="listenMusic">'+
				    '</span><span  data-sid="'+data[i].sid+'" data-song="'+data[i].url+'" class="addSong"></span><span class="Download"></span></div></li>';
				$('.loadSong').append(html);
			}
			
		});
	});

	//点击将歌曲加入到列表
	$(document).on('click', '.addSong', function(){
		var songUrl = $(this).attr('data-song');
		var sid = $(this).attr('data-sid');
		var name = $(this).parents('.songLi').find('.songname').text();
		var author = $(this).parents('.songLi').find('.singer').text();
		var songName = author +' - '+ name;
		console.log(songUrl +','+ songName);
		apendText(songName, songUrl,function(){
			var obj = {
				sid: sid,
		    	songName: songName,
		    	artistName: author,
		    	url: songUrl
			}
			db.get('song').push(obj).value();
		});
	});

	//点击搜索
	var key = '';
	var search = document.getElementById('searchSong');
	search.addEventListener('keydown', function(event){
		if(event.keyCode==13){
			// var key = $(this).val();
			console.log(key);
			// document.write(str.charCodeAt(str.length - 1));
			addSongList(key,function(data){
				console.log("数据返回!");
				$('.loadSong').empty();
				$('.album').hide();
				$('.loadSong').show();
				for(var i=0; i<data.length; i++){
					var html = '<li data-song="'+data[i].url+'" class="songLi"><div class="fl"><span class="singer">'+data[i].artistName+'</span>'+
					    '<span> - </span><span class="songname">'+data[i].songName+'</span></div><div class="fr"><span class="listenMusic">'+
					    '</span><span  data-sid="'+data[i].sid+'" data-song="'+data[i].url+'" class="addSong"></span><span class="Download"></span></div></li>';
					$('.loadSong').append(html);
				}
			});
			key = '';
		}
		else if(event.keyCode==8){
			key = '';
		}
		else{
			key += String.fromCharCode(event.keyCode+32);
			console.log(key);
		}
	});
	
})(Zepto);


//从网络抓取数据
var loadSong = document.querySelector('loadSong');
function addSongList(str, fn){
	var arr = [];
	nodegrass.get('http://music.baidu.com/search?key='+str+'',function(data,status,headers){
		
	 	$ = cheerio.load(data);
	 	var len=$('.search-song-list').find('li').length;
	 	$('.search-song-list').find('li').each(function(){

	 		var sid = JSON.parse($(this).attr('data-songitem')).songItem.sid;
	 		//获取歌曲的URL地址信息
	 		nodegrass.get('http://play.baidu.com/data/music/songlink?songIds='+sid+'',function(data,status,headers){
			    var obj = JSON.parse(data);
			    var songName = obj.data.songList[0].songName; //歌曲名字
			    var artistName = obj.data.songList[0].artistName; //歌唱者
			    var url = obj.data.songList[0].songLink; //歌曲路径
			    // var url = obj.data.songList[0].songLink.split('?')[0].replace('//','/'); //歌曲路径
			   	var type = {
			   		sid: sid,
			    	songName: songName,
			    	artistName: artistName,
			    	url: url
			    }
				arr.push(type);
				if(arr.length==len){
					fn(arr);
				}
				
			},'utf-8').on('error', function(e) {
			     console.log("Got error: " + e.message);
			});
	 	});
	},'utf-8').on('error', function(e) {
	     console.log("Got error: " + e.message);
	});
}
