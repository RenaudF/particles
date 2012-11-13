// written by Renaud Fontana under the free beer licence

var canvas; 					// the rendering frame
var particles = new Array(255); // particles pool with limited size // implement linked list
var gravitons = new Array(5);	// gravitons pool with limited size
var emitter = new Object(); 	// particles emitter
var gravity = new Object(); 	// gravity field
var delay = 50; 				// loop interval in ms
var firing = new Object; 		// firing.flag = true if user is firing particles (mouse down)
var debug = new Object; 		// collection of debug flags

function init(){
	canvas = document.getElementById('particles');
	
	// debug section
	debug.events = false;
	debug.collision = false;
	
	// events listeners
	canvas.onmousemove = function(event)  {
		// click position relative to canvas
		var dx = emitter.x + event.target.offsetLeft - event.pageX;
		var dy = emitter.y + event.target.offsetTop - event.pageY;
		
		// debug info
		var mouse = document.getElementById('mouse');
		if(debug.events) {
			mouse.innerHTML=((event.pageX - event.target.offsetLeft) +', '+ (event.pageY - event.target.offsetTop));
			mouse.style.display ='block';
			console.log('dx :' + dx + ' dy: ' + dy);
		}
	
		// update emitter direction
		var distance = Math.sqrt(dx*dx+dy*dy);
		if (Math.abs(dx)>5 && Math.abs(dy)>5) {
			if(dy < 0) emitter.orientation =  Math.PI - Math.acos(dx/distance);
			else emitter.orientation =  Math.PI + Math.acos(dx/distance);
		}
    }
	
	canvas.onmousedown = function(event) {
		if(debug.events) console.log('mouse down');
		if(event.which == 3) {
			for (var i = 0; i< gravitons.length; i++) {
				if(gravitons[i].active){
					overlaps = Math.abs(gravitons[i].x - (event.pageX - event.target.offsetLeft)) <= 2*gravitons[i].force;
					overlaps &= overlaps && Math.abs(gravitons[i].y - (event.pageY - event.target.offsetTop)) <= 3*gravitons[i].force;
					if(overlaps){
						gravitons[i].onclick();
						return;
					}
				}
			}
			spawnGraviton(event)
		} else {
			firing.flag = true;
			firing.id = setInterval(fire, delay);
		}
	}
	
	canvas.onmouseup = function(event) {
		if(debug.events)	console.log('mouse up');
		clearInterval(firing.id);
	}
	
	// context menu see onmousedown
	canvas.oncontextmenu = function(event) { return false; };
	
	// particle emitter
	emitter.x = canvas.width / 2;
	emitter.y = canvas.height / 2;
	emitter.orientation = 0;
	emitter.dispertion = Math.PI / 4;
	emitter.speed = 10; // initial particles speed
	emitter.density = 1; // max particles emitted per loop - if available
	
	// init the firing object
	firing.flag = false;
	firing.id = null;
	
	// populate the particles pool
	for (var i = 0; i < particles.length; i++){
		var particle = new Object();  
		particle.active = false;
		particle.collision = function(){
			//if(debug.collision) console.log('x: ' + this.x + ' y: ' + this.y);
			if(this.x < 1 || this.x > canvas.width - 1) {
				if (this.x < 1) this.x -= 2 * (this.x - 1);
				else this.x -= 2 * (this.x - (canvas.width - 1));
				this.dx *= -0.75;
				if(debug.collision) console.log('dx: ' + this.dx);
			}
			if(this.y < 1 || this.y > canvas.height - 1) {
				if (this.y < 1) this.y -= 2 * (this.y - 1);
				else this.y -= 2 * (this.y - (canvas.height - 1));
				this.dy *= -0.75;
				if(debug.collision) console.log('dy: ' + this.dy);
			}
			if (isNaN(this.x)||isNaN(this.y)) console.log(this);
		};
		particles[i] = particle;  
	}
	
	// populate the gravitons pool
	for (var i = 0; i< gravitons.length; i++) {
		var graviton = new Object();
		graviton.active = false;
		graviton.repulse = false;
		graviton.force = 10;
		graviton.onclick = function(){
			if(this.repulse) this.active = false;
			else this.repulse = true;
			gravity.update()
		};
		gravitons[i] = graviton;
	}
	
	// init gravity
	gravity.field = new Array(canvas.width);
	for (var x = 0; x < canvas.width; x++){
		gravity.field[x] = new Array(canvas.height);
		for (var y = 0; y < canvas.height; y++){
			gravity.field[x][y] = new Object();
		}
	}
	gravity.update = function(){
		for (var x = 0; x < canvas.width; x++){
			for (var y = 0; y < canvas.height; y++){
				gravity.field[x][y].ddx = 0;
				gravity.field[x][y].ddy = 0.1;
				for (var g = 0; g < gravitons.length; g++){
					graviton = gravitons[g];
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
		
	setInterval(draw, delay);
}

function fire(){
	if(debug.events) console.log('fire');
	var n = emitter.density; // number of particules to fire
	for (var i = 0; i < particles.length ; i++){
		if(!particles[i].active) {
			spawnParticle(particles[i]);
			if(--n == 0) break;
		}
	}
}

function spawnGraviton(event){
	for (var i = 0; i < gravitons.length ; i++){
		if(!gravitons[i].active){
			graviton = gravitons[i]
			graviton.x = event.pageX - event.target.offsetLeft;
			graviton.y = event.pageY - event.target.offsetTop;
			graviton.active = true;
			graviton.repulse = false;
			gravity.update();
			break;
		}
	}
}

function spawnParticle(particle){
	particle.x = emitter.x;
	particle.y = emitter.y;
	particle.dx = Math.cos(emitter.orientation+(0.5-Math.random())*emitter.dispertion) * emitter.speed;
	particle.dy = Math.sin(emitter.orientation+(0.5-Math.random())*emitter.dispertion) * emitter.speed;
	particle.active = true;
	particle.lifespan = 255; // duration in loop cycles
}

function draw(){  
	update();
	if (canvas.getContext){  
		var ctx = canvas.getContext('2d');  

		ctx.globalCompositeOperation = 'destination-over';  
		ctx.clearRect(0,0,canvas.width,canvas.height);
		
		// draw emitter
		ctx.beginPath();
		ctx.arc(emitter.x, emitter.y, 10, emitter.orientation + emitter.dispertion / 2, emitter.orientation - emitter.dispertion / 2, false);
		ctx.stroke();
		
		// draw particles
		for (var i = 0; i < particles.length; i++){
			if(particles[i].active){
				ctx.beginPath();
				var colorIndex = 255 - particles[i].lifespan;
				ctx.fillStyle = 'rgba(' + colorIndex + ', ' + colorIndex + ', ' + colorIndex + ', 1)';
				ctx.arc(particles[i].x, particles[i].y, 2, 0, 2 * Math.PI, true);
				ctx.fill();
				ctx.closePath();
			}
		}
		
		// draw gravitons
		for (var i = 0; i < gravitons.length; i++){
			if(gravitons[i].active){
				g = gravitons[i]
				ctx.beginPath();
				ctx.fillStyle = 'rgba('+((g.repulse)?'255,0,0,0.8)':'150,255,0,0.8)');
				ctx.arc(g.x-g.force, g.y-g.force, g.force, 0, 2 * Math.PI, true);
				ctx.fill();
				ctx.closePath();
			}
		}
	}
}  

function update(){
	for (var i = 0; i < particles.length; i++){
		p = particles[i]
		if(p.active){
			p.dx += gravity.field[Math.floor(p.x)][Math.floor(p.y)].ddx;
			p.dy += gravity.field[Math.floor(p.x)][Math.floor(p.y)].ddy;
			p.x += p.dx;
			p.y += p.dy;
			p.collision();
			if(p.lifespan-- == 0) p.active = false;
		}
	}
}