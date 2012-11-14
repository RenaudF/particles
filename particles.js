// written by Renaud Fontana under the free beer licence

var particles = new Object(); 						// contains all logic and data relating to particles
var gravity = new Object(); 						// contains the gravity field map and gravitons
var env = new Object();								// canvas, debug and optimisation stuff goes here

function initEnvironment(){
	// init environment
	env.canvas = document.getElementById('particles'); 	// the rendering frame
	env.debug = new Object; 							// collection of debug flags
	env.delay = 45;										// loop interval in ms
	env.fps = 1000/env.delay;
	env.oldTime = new Date().getTime();
	
	env.printFPS = function()  {
		document.getElementById('fps').innerHTML = Math.floor(env.fps)+' fps';
	}

	// debug section
	env.debug.events = false;
	env.debug.collision = false;
	
	// events listeners
	env.canvas.onmousemove = function(event)  {
		// click position relative to canvas
		var dx = particles.emitter.x + event.target.offsetLeft - event.pageX;
		var dy = particles.emitter.y + event.target.offsetTop - event.pageY;
		// debug info
		var mouse = document.getElementById('mouse');
		if(env.debug.events) {
			mouse.innerHTML=((event.pageX - event.target.offsetLeft) +', '+ (event.pageY - event.target.offsetTop));
			mouse.style.display ='block';
			console.log('dx :' + dx + ' dy: ' + dy);
		}
		// update particles.emitter direction
		var distance = Math.sqrt(dx*dx+dy*dy);
		if (Math.abs(dx)>5 && Math.abs(dy)>5) {
			if(dy < 0) particles.emitter.orientation =  Math.PI - Math.acos(dx/distance);
			else particles.emitter.orientation =  Math.PI + Math.acos(dx/distance);
		}
    }
	
	env.canvas.onmousedown = function(event) {
		if(env.debug.events) console.log('mouse down');
		if(event.which == 3) { // add, modify, remove gravity.gravitons
			for (var i = 0; i< gravity.gravitons.length; i++) {
				if(gravity.gravitons[i].active){
					overlaps = Math.abs(gravity.gravitons[i].x - (event.pageX - event.target.offsetLeft)) <= 2*gravity.gravitons[i].force;
					overlaps &= overlaps && Math.abs(gravity.gravitons[i].y - (event.pageY - event.target.offsetTop)) <= 3*gravity.gravitons[i].force;
					if(overlaps){
						gravity.gravitons[i].onclick();
						return;
					}
				}
			}
			gravity.spawnGraviton(event)
		} else { // fire
			particles.emitter.firing = true;
		}
	}
	
	env.canvas.onmouseup = function(event) {
		if(env.debug.events)	console.log('mouse up');
		particles.emitter.firing = false;
	}
	
	// context menu see onmousedown
	env.canvas.oncontextmenu = function(event) { return false; };
	
	// pre-compute particles
	particles.shades = new Array(255);
	for (var i = 0; i < particles.shades.length; i++) {
		var shadeOfGrey = document.createElement('canvas');
		shadeOfGrey.width = 4;
		shadeOfGrey.height = 4;
		particles.shades[i] = shadeOfGrey;
		if (shadeOfGrey.getContext){
			var m_context = shadeOfGrey.getContext('2d');
			m_context.fillStyle = 'rgba(' + i + ', ' + i + ', ' + i + ', 1)';
			m_context.beginPath();
			m_context.arc(2, 2, 2, 0, 2 * Math.PI, true);
			m_context.fill();
			m_context.closePath();
			particles.shades[i] = shadeOfGrey;
		}
	}
}

function initParticles(){
	// particle particles.emitter
	particles.emitter = new Object();
	particles.emitter.x = env.canvas.width / 2;
	particles.emitter.y = env.canvas.height / 2;
	particles.emitter.orientation = 0;
	particles.emitter.dispertion = Math.PI / 8;
	particles.emitter.speed = 5; // initial particles speed
	particles.emitter.density = 5; // max particles emitted per loop - if available
	particles.emitter.firing = false;
	particles.emitter.fire = function(){
		if(env.debug.events) console.log('fire');
		for (var i = 0; i < particles.emitter.density ; i++){
			particles.spawn();
		}
	}
	
	// setup non-circular doubly-linked list of active/inactive particles
	particles.number = 0;
	particles.inactive = new Object();
	particles.inactive.first = null;
	particles.inactive.number = 0;
	particles.active = new Object();
	particles.active.first = null;
	particles.active.number = 0;
	// add/remove logic to linked list
	particles.spawn = function() {
		particle = null;
		if (particles.inactive.first) {
			particle = particles.inactive.first;
			if (particle.next) particle.next.previous = particle.previous;
			particles.inactive.first = particle.next;
			particles.inactive.number--;
			particle.next = particles.active.first;
			if (particle.next) particle.next.previous = particle;
			particles.active.first = particle;
			particle.previous = null;
			particles.active.number++;
		} else {
			var particle = new Object();  
			particle.index = particles.number++;
			//console.log(particle.index);
			particle.collision = function(){
				if (isNaN(this.x)||isNaN(this.y)){
					console.log('NaN - particle: ',this.index);
				}
				if(this.x < 1 || this.x > env.canvas.width - 1) {
					//particles.kill(this);
					//return;
					if (this.x < 1) this.x -= 2 * (this.x - 1);
					else this.x -= 2 * (this.x - (env.canvas.width - 1));
					this.dx *= -0.75;
					if(env.debug.collision) console.log('dx: ' + this.dx);
				}
				if(this.y < 1 || this.y > env.canvas.height - 1) {
					//particles.kill(this);
					//return;
					if (this.y < 1) this.y -= 2 * (this.y - 1);
					else this.y -= 2 * (this.y - (env.canvas.height - 1));
					this.dy *= -0.75;
					if(env.debug.collision) console.log('dy: ' + this.dy);
				}
			};
			particle.previous = null;
			particle.next = particles.active.first;
			if (particle.next) particle.next.previous = particle;
			particles.active.first = particle;
			particles.active.number++;
		}
		particle.x = particles.emitter.x;
		particle.y = particles.emitter.y;
		particle.dx = Math.cos(particles.emitter.orientation+(0.5-Math.random())*particles.emitter.dispertion) * particles.emitter.speed;
		particle.dy = Math.sin(particles.emitter.orientation+(0.5-Math.random())*particles.emitter.dispertion) * particles.emitter.speed;
		particle.active = true;
		particle.lifespan = 255; // duration in loop cycles
	}
	particles.kill = function(particle) {
		if (particle.previous) particle.previous.next = particle.next;
		if (particle.next) particle.next.previous = particle.previous;
		if (particles.active.first == particle) particles.active.first = particle.next;
		particles.active.number--;
		particle.next = particles.inactive.first;
		if (particle.next) particle.next.previous = particle;
		particles.inactive.first = particle;
		particle.previous = null;
		particles.inactive.number++;
		particle.active = false;
	}
}

function initGravity(){
	// populate the gravitons pool
	gravity.gravitons = new Array(5);
	for (var i = 0; i< gravity.gravitons.length; i++) {
		var graviton = new Object();
		graviton.active = false;
		graviton.repulse = false;
		graviton.force = 10;
		graviton.onclick = function(){
			if(this.repulse) this.active = false;
			else this.repulse = true;
			gravity.update()
		};
		gravity.gravitons[i] = graviton;
	}
	gravity.spawnGraviton = function(event){
		for (var i = 0; i < gravity.gravitons.length ; i++){
			if(!gravity.gravitons[i].active){
				graviton = gravity.gravitons[i]
				graviton.x = event.pageX - event.target.offsetLeft;
				graviton.y = event.pageY - event.target.offsetTop;
				graviton.active = true;
				graviton.repulse = false;
				gravity.update();
				break;
			}
		}
	}
	
	// init gravity
	gravity.field = new Array(env.canvas.width);
	for (var x = 0; x < env.canvas.width; x++){
		gravity.field[x] = new Array(env.canvas.height);
		for (var y = 0; y < env.canvas.height; y++){
			gravity.field[x][y] = new Object();
		}
	}
	gravity.update = function(){
		for (var x = 0; x < env.canvas.width; x++){
			for (var y = 0; y < env.canvas.height; y++){
				gravity.field[x][y].ddx = 0;
				gravity.field[x][y].ddy = 0.1;
				for (var g = 0; g < gravity.gravitons.length; g++){
					graviton = gravity.gravitons[g];
					if(graviton.active){
						distance_cubed = Math.max(Math.pow(graviton.x - x, 2) + Math.pow(graviton.y - y, 2),1)
						this.field[x][y].ddx += graviton.force * (graviton.x - x) / distance_cubed * ((graviton.repulse)? -1 : 1);
						this.field[x][y].ddy += graviton.force * (graviton.y - y) / distance_cubed * ((graviton.repulse)? -1 : 1);
					}
				}
			}
		}
	}
	gravity.update();
}

function init(){	
	initEnvironment();
	initParticles();
	initGravity();
		
	setInterval(update, env.delay);
	setInterval(env.printFPS, 1000);
}

function draw(){  
	if (env.canvas.getContext){  
		var ctx = env.canvas.getContext('2d');  

		ctx.globalCompositeOperation = 'destination-over';  
		ctx.clearRect(0,0,env.canvas.width,env.canvas.height);
		
		// draw emitter
		ctx.beginPath();
		ctx.arc(particles.emitter.x, particles.emitter.y, 10, particles.emitter.orientation + particles.emitter.dispertion / 2, particles.emitter.orientation - particles.emitter.dispertion / 2, false);
		ctx.stroke();
		
		// draw particles
		particle = particles.active.first;
		while(particle){
			var colorIndex = 255 - particle.lifespan;
			try{
				ctx.drawImage(particles.shades[colorIndex], particle.x, particle.y);
			}catch(err){
			
			}
			particle = particle.next;
		}
		
		// draw gravitons
		for (var i = 0; i < gravity.gravitons.length; i++){
			if(gravity.gravitons[i].active){
				g = gravity.gravitons[i]
				ctx.beginPath();
				ctx.fillStyle = 'rgba('+((g.repulse)?'255,0,0,0.8)':'150,255,0,0.8)');
				ctx.arc(g.x-g.force/2, g.y-g.force/2, g.force, 0, 2 * Math.PI, true);
				ctx.fill();
				ctx.closePath();
			}
		}
	}
}  

function update(){
	if (particles.emitter.firing) particles.emitter.fire();
	particle = particles.active.first;
	while(particle){
		next = particle.next;
		if(particle.lifespan-- == 0) particles.kill(particle);
		else {
			try{
				particle.dx += gravity.field[Math.floor(particle.x)][Math.floor(particle.y)].ddx;
				particle.dy += gravity.field[Math.floor(particle.x)][Math.floor(particle.y)].ddy;
			}catch(err){
			
			}
			particle.x += particle.dx;
			particle.y += particle.dy;
			particle.collision();
		}
		particle = next;
	}
	draw();
	var time = new Date().getTime();
	env.fps = 1000/(time-env.oldTime);
	env.oldTime = time;
}