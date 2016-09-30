const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const {dialog} = require('electron').remote;
const sound = require('mac-sounds');
const {remote} = require('electron');
const {Menu} = remote;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

var vfPath = null;
var afPath = null;
var outputPath = null;
var ready = false;
var frameCount = 0;
var mb = document.getElementById('mux_button');
var vf = document.getElementById('video_file');
var af = document.getElementById('audio_file');
var of = document.getElementById('output_file');
var vfp = document.getElementById('video_file_path');
var afp = document.getElementById('audio_file_path');
var ofp = document.getElementById('output_file_path');

var bar = new ProgressBar.Line(progress, {
	strokeWidth: 4,
	easing: 'easeInOut',
	duration: 100,
	color: '#E39821',
	trailColor: '#eee',
	trailWidth: 1,
	svgStyle: {width: '100%', height: '100%'},
	text: {
		style: {
			// Text color.
			// Default: same as stroke color (options.color)
			color: '#000',
			position: 'absolute',
			right: '0',
			top: '30px',
			padding: 0,
			margin: 0,
			transform: null
		},
		autoStyleContainer: false
	},
	from: {color: '#FFEA82'},
	to: {color: '#ED6A5A'},
	step: (state, bar) => {
		bar.setText(Math.round(bar.value() * 100) + ' %');
	}
});


function updateMuxButton(){
	if((afPath!=null)&&(vfPath!=null)&&(outputPath!=null)){
		mb.className  = 'btn btn-positive pull-right';
		ready = true;
	}
	else {
		mb.className = 'btn btn-negative pull-right';
		ready = false;
	}
}

document.ondragover = document.ondrop = function(ev){
	ev.preventDefault();
};

document.querySelector('#video_file_pane').ondrop = function(ev){
	vfPath = ev.dataTransfer.files[0].path;
	vfp.innerHTML = vfPath;
	vf.innerHTML = vfPath.split('/').pop();
	ev.preventDefault();
	updateMuxButton();

	ffmpeg.ffprobe(vfPath,function(err, metadata) {
		if(err){
			alert('Not a valid Video File');
		}
		frameCount = metadata.streams[0].nb_frames;
	});
};

document.querySelector('#audio_file_pane').ondrop = function(ev){
	afPath = ev.dataTransfer.files[0].path;
	afp.innerHTML = afPath;
	af.innerHTML = afPath.split('/').pop();
	ev.preventDefault();
	updateMuxButton();

	ffmpeg.ffprobe(afPath,function(err) {
		if(err){
			alert('Not a valid Audio File');
		}       
	});
};

document.querySelector('#mux_button').onclick = function(){
	if(ready === true){
		var command = ffmpeg();	
		command.addInput(vfPath);
		command.addInput(afPath);
		command.outputOptions(
				'-c','copy',
				'-map','0:v:0',
				'-map','1:a:0',
				'-shortest'
				);		
		command.save(outputPath)
			.on('error',function(err){
				dialog.showErrorBox('Error', err);
			})
			.on('progress',function(progress){
				bar.animate(progress.frames/frameCount);
			})
			.on('end', function(){
				bar.animate(1);
				sound('ping');
				setTimeout(function(){
					alert('Mux Completed');
				},1000);    
			});
	}
	else{
		alert('Missing Source Files or Output Directory');
	}
};

document.querySelector('#reset_button').onclick = function(){
	vfPath = null;
	afPath = null;
	outputPath = null;  
	frameCount = 0;
	vf.innerHTML = 'No file Selected.';
	af.innerHTML = 'No file Selected.';
	vfp.innerHTML = '';
	afp.innerHTML = '';
	of.innerHTML = 'Output not set.';
	ofp.innerHTML = '';
	updateMuxButton();
	bar.animate(0);
};

document.querySelector('#create-new-file').onclick = function(){
	outputPath = dialog.showSaveDialog({
		title:'Save As',
		defaultPath:'~/Desktop/output.mp4' //could be neater      
	});
	ofp.innerHTML = outputPath;
	of.innerHTML = outputPath.split('/').pop();
	updateMuxButton();
};

var appMenu = Menu.buildFromTemplate([{
	label: 'MuxTool',
	submenu: [{
		label: 'About',
		click: function () {
			alert('MuxTool version 1.0.0 by Tom Allen (tom@telega.org)');
		}
	},
		{
			label: 'Quit',
			accelerator: 'CmdOrCtrl+Q',
			selector: 'terminate:' // OS X only!!!
		}]
}]);

Menu.setApplicationMenu(appMenu);
