//Includes
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/FirstPersonControls.js';
import { GUI } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/libs/lil-gui.module.min';
import { BoxLineGeometry } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/geometries/BoxLineGeometry.js';
import { HTMLMesh } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/interactive/HTMLMesh.js';
import { InteractiveGroup } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/interactive/InteractiveGroup.js';
import {VRButton} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/webxr/VRButton.js';

function IVprocess ( imageProcessing, renderer )
{
	renderer.setRenderTarget( imageProcessing.rtt );
	renderer.render ( imageProcessing.scene, imageProcessing.orthoCamera ); 	
	renderer.setRenderTarget( null );
};

let camera, controls, scene, renderer, container;
let video,videoTexture;
let imageProcessing, screenMaterial, elevationMaterial, colorSpaceMaterial, shadowSpaceMaterial, lineMaterial;
let guiScreen, guiElevation, guiCloud, guiLine, group;

const clock = new THREE.Clock();
let startTime = Date.now();
let videoLoaded = false;


let colorMode = ["rgb", "hsv", "hsl"];
let colorCloud = {
	colorMode: colorMode[0]
};

init();
animate();

function init () {
	
    container = document.createElement( 'div' );
	document.body.appendChild( container );
	
	scene = new THREE.Scene(); 

	//Renderer
	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
	renderer.autoClear = false;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = false;

	container.appendChild( renderer.domElement );
	
	//Camera
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.001, 1000 );
	camera.position.z = 0.1;

	//Light
	{
		const color = 0xFFFFFF;
		const intensity = 1;
		const light = new THREE.PointLight(color, intensity, 100);
		light.position.set(0, 1, 0);
		scene.add(light);
	}
	
	//Controls

	controls = new FirstPersonControls( camera, renderer.domElement );
	controls.movementSpeed = 0.8;
	controls.lookSpeed = 0.1;
	controls.mouseDragOn = false;
	controls.enabled = false;
	controls.activeLook = true;

	video = document.createElement('video');
	video.src = 'video.mp4';
	video.load();
	video.muted = true;
	video.loop = true;

	//VR

	renderer.xr.enabled = true;
    document.body.appendChild( VRButton.createButton( renderer ) );

	video.onloadeddata = function (){ 
		
		createScenario();	
		createVideo();
		createElevation();
		createCloud();
		createLine();
		createGUI();
		videoLoaded = true;
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('keyup', onKeyUp);

		function onKeyDown(e) {
			var keyCode = e.code;
			if ("ShiftLeft" == keyCode){
				controls.enabled = true;
			}
		};

		function onKeyUp(e) {
			var keyCode = e.code;
			if ("ShiftLeft" == keyCode){
				controls.enabled = false;
			}
		};

		video.play();
	};
	
	window.addEventListener( 'resize', onWindowResize, false );
}

function createScenario() {	
	//Scenario
	let room, floor;

	/*
	room = new THREE.LineSegments(
		new BoxLineGeometry( 5, 5, 5, 5, 5, 5 ),
		new THREE.LineBasicMaterial( { color: 0x808080 } )
	);
	scene.add( room );
	*/
	let loader = new THREE.TextureLoader();
	let texture = loader.load('back.jpg');
	let back = addObject(1.75, -0.475, -0.5, 0, 0, 0,
		new THREE.SphereGeometry( 6, 32, 16 ), 
		new THREE.MeshBasicMaterial({color: 0xFFFFFF, map: texture})
	);
	back.scale.x = -1;
	back.material.side = THREE.DoubleSide;

	addObject(0, -0.57, 0, 0, 0, 0,
		new THREE.CylinderGeometry( 2.0, 2.0, 0.1, 36), 
		new THREE.MeshPhysicalMaterial({color: 0x999999, reflectivity: 0.0, clearcoat: 1.0})
		);

	//Screen
	addObject(0, -0.33, -0.85, 0, 0, 0,
		new THREE.BoxGeometry( 1, 0.1, 0.35), 
		new THREE.MeshPhysicalMaterial({color: 0x777777, reflectivity: 0.0, clearcoat: 1.0})
		);

	//Elevation
	addObject(-0.8, -0.33, 0, 0, Math.PI/2, 0,
		new THREE.BoxGeometry( 1, 0.1, 0.4), 
		new THREE.MeshPhysicalMaterial({color: 0x777777, reflectivity: 0.0, clearcoat: 1.0})
		);
	//Cloud
	addObject(1.25, -0.5, 0, 0, 0, 0,
		new THREE.BoxGeometry( 1, 0.05, 1), 
		new THREE.MeshPhysicalMaterial({color: 0x777777, reflectivity: 0.0, clearcoat: 1.0})
		);
	addObject(1.75, -0.475, -0.5, 0, 0, 0,
		new THREE.SphereGeometry( 0.05, 32, 16 ), 
		new THREE.MeshPhysicalMaterial({color: 0xBBBBBB, reflectivity: 0.0, clearcoat: 1.0})
	);
	addObject(1.75, -0.475, 0, Math.PI/2, 0, 0,
		new THREE.CylinderGeometry(0.025, 0.025, 1, 24), 
		new THREE.MeshPhysicalMaterial({color: 0xFFBBBB, reflectivity: 0.0, clearcoat: 1.0})
	);
	addObject(1.75, 0.0, -0.5, 0, 0, 0,
		new THREE.CylinderGeometry( 0.025, 0.025, 1, 24), 
		new THREE.MeshPhysicalMaterial({color: 0xBBFFBB, reflectivity: 0.0, clearcoat: 1.0})
	);

	addObject(1.25, -0.475, -0.5, 0, 0, Math.PI/2,
		new THREE.CylinderGeometry( 0.025, 0.025, 1, 24), 
		new THREE.MeshPhysicalMaterial({color: 0xBBBBFF, reflectivity: 0.0, clearcoat: 1.0})
	);

	//Line
	addObject(0, -0.57,  1.1, 0, 0, 0,
		new THREE.CylinderGeometry( 0.6, 0.6, 0.2, 24), 
		new THREE.MeshPhysicalMaterial({color: 0x777777, reflectivity: 0.0, clearcoat: 1.0})
		);
}

function createVideo() {	
	videoTexture = new THREE.VideoTexture( video );
	videoTexture.minFilter = THREE.NearestFilter;
	videoTexture.magFilter = THREE.NearestFilter;
	videoTexture.generateMipmaps = false; 
	videoTexture.format = THREE.RGBFormat;

	screenMaterial = new THREE.ShaderMaterial({
		uniforms: {
			sizeDiv2: {type: 'i', value: 10},
			colorScaleR: {type: 'f', value: 1.0},
			colorScaleG: {type: 'f', value: 1.0},
			colorScaleB: {type: 'f', value: 1.0},
			invert: {type: 'b', value: false},
			image: {type: 't', value: videoTexture},
			curvature: {type: 'f', value: 0.5},
			resolution: {type: '2f', value:  new THREE.Vector2( video.videoWidth, video.videoHeight ) }
			
		},
		vertexShader: document.getElementById('vsVideo').text,
		fragmentShader: document.getElementById('fsVideo').text,
	});
	let screenGeometry = new THREE.PlaneGeometry( 1, video.videoHeight/video.videoWidth, 30, 30 );
	screen = addObject(0, 0, -1, 0, 0, 0, screenGeometry, screenMaterial );
	screen.material.side = THREE.DoubleSide;
	screen.scale.y = -1;
}

function createElevation() {	
	let scaleElevation = 0.15;
	elevationMaterial = new THREE.ShaderMaterial( {
		vertexShader: document.querySelector( '#vsElevation' ).textContent.trim(),
		fragmentShader: document.querySelector( '#fsElevation' ).textContent.trim(),
		uniforms: {
			scaleElevation: { value: scaleElevation },
			tex: {type: 't', value: videoTexture},
			invert: {type: 'b', value: false}
			}
	} );
	let elevationGeometry = new THREE.PlaneGeometry( 1, video.videoHeight/video.videoWidth, video.videoWidth, video.videoHeight );  
	let planeElevation = new THREE.Mesh( elevationGeometry, elevationMaterial);
	planeElevation = addObject(-1, 0, 0, 0, Math.PI/2, 0, elevationGeometry, elevationMaterial );
	planeElevation.material.side = THREE.DoubleSide;
}

function createCloud() {	
	let discret = 1;
	let height = 1.0;
	let pointSize = 1.0;
	colorSpaceMaterial = new THREE.ShaderMaterial({
		vertexShader: document.getElementById('vsRGB').textContent,
		fragmentShader: document.getElementById('fsRGB').textContent,
		uniforms: {
			tex:  {type: 't', value: videoTexture},
			height: { value: height },
			pointSize: { value: pointSize },
			rgb: {type: 'b', value: true},
			hsv: {type: 'b', value: false},
			hsl: {type: 'b', value: false},
			xyz: {type: 'b', value: false},
			srgb: {type: 'b', value: false}
		}
	});

	shadowSpaceMaterial = new THREE.ShaderMaterial({
		vertexShader: document.getElementById('vsRGBshadow').textContent,
		fragmentShader: document.getElementById('fsRGBshadow').textContent,
		uniforms: {
			tex:  {type: 't', value: videoTexture},
			pointSize: { value: pointSize },
			rgb: {type: 'b', value: true},
			hsv: {type: 'b', value: false},
			hsl: {type: 'b', value: false},
			xyz: {type: 'b', value: false},
			srgb: {type: 'b', value: false}
		}
	});

	let geometryPoints = new THREE.BufferGeometry();
	let positions = [];
	let compteur = 0;
	for (let i = 0; i < video.videoHeight; i += discret)
		for (let j = 0; j < video.videoWidth; j += discret) {
			let x = (i) / video.videoHeight;
			let y = (j) / video.videoWidth;
			let z = 0;
			positions.push(x, y, z);
			compteur++;
		}

	geometryPoints.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geometryPoints.computeBoundingSphere();

	let points = new THREE.Points(geometryPoints, colorSpaceMaterial);
	points.rotation.y = -Math.PI/2;
	points.position.x = 1.25;
	scene.add(points);

	let pointsShadow = new THREE.Points(geometryPoints, shadowSpaceMaterial);
	pointsShadow.rotation.y = -Math.PI/2;
	pointsShadow.position.x = 1.25;
	pointsShadow.position.y = 0.03;
	scene.add(pointsShadow);
}

function createLine(){
	let uniforms = {
		time: { type: "f", value: 1.0 },
		mx: { type: "f", value: 0.5 },
		my: { type: "f", value: 0.5 },
		mz: { type: "f", value: 0.5 },
		dx: { type: "f", value: 1.0 },
		dy: { type: "f", value: 1.0 },
		dz: { type: "f", value: 1.0 },
		tx: {type: 'b', value: true},
		ty: {type: 'b', value: true},
		tz: {type: 'b', value: true},
		sx: {type: 'b', value: true},
		sy: {type: 'b', value: true},
		sz: {type: 'b', value: true}
	};
	lineMaterial = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: document.getElementById( 'vsLine' ).textContent,
		fragmentShader: document.getElementById( 'fsLine' ).textContent
	} );

	let lineGeometry = new THREE.BufferGeometry();

				let positions = [];
				let colors = [];
				let color = new THREE.Color();
				let n = 1500, n2 = n / 2; // particles spread in the cube
				let digit = 200;
				let step = 1.0*n/digit;

				for ( let i = 0; i < digit; i ++ ) {
					let x = i * step - n2;
					let y = 0;
					let z = 0;
					positions.push( x, y, z );
					let vx = x/n + 0.5;
					let vy = x/n - 0.5;
					let vz = x/n + 0.0;
					color.setRGB( vx, vy, vz );
					colors.push( color.r, color.g, color.b );
				}

				lineGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
				lineGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

				lineGeometry.computeBoundingSphere();

				let line = new THREE.Line( lineGeometry, lineMaterial );
				line.position.yWD = 0.1;
				line.position.z = 1.1;
				scene.add( line );
}

function createGUI() {

	let pausePlayObj ={
		pausePlay: function (){
			if (!video.paused) {
				console.log ( "pause" );
				video.pause();
			} else {
				console.log ( "play" );
				video.play();
			}
		},
		add10sec: function () {
			video.currentTime = video.currentTime + 10;
			console.log ( video.currentTime  );
		}
	};

	group = new InteractiveGroup( renderer, camera );
	scene.add( group );

	guiScreen = new GUI();
	guiScreen.add(screenMaterial.uniforms.colorScaleR , 'value', 0, 1).name('Red'); 
	guiScreen.add(screenMaterial.uniforms.colorScaleG , 'value', 0, 1).name('Green');
	guiScreen.add(screenMaterial.uniforms.colorScaleB , 'value', 0, 1).name('Blue');
	guiScreen.add(screenMaterial.uniforms.invert , 'value').name('Invert');
	guiScreen.add(pausePlayObj,'pausePlay').name ('Pause/play video');
	guiScreen.add(pausePlayObj,'add10sec').name ('Add 10 seconds');
	guiScreen.add(screenMaterial.uniforms.curvature , 'value', 0.3, 2.0, 0.1).name('curvature');
	addGUI(guiScreen, 0, -0.33, -0.6, -Math.PI/4, 0, 0);

	guiElevation = new GUI();
	guiElevation.add(elevationMaterial.uniforms.scaleElevation , 'value', 0.05, 0.3, 0.05).name('elevation');
	guiElevation.add(elevationMaterial.uniforms.invert , 'value').name('InvertElevation');
	addGUI(guiElevation, -0.55, -0.33, 0, -Math.PI/2, Math.PI/4, Math.PI/2);

	guiCloud = new GUI();
	guiCloud.add(colorSpaceMaterial.uniforms.height , 'value', 0.1, 3.0, 0.1).name('height');
	guiCloud.add(colorSpaceMaterial.uniforms.pointSize , 'value', 0.5, 4.0, 0.1).name('point size')
	.onChange( function () {
		shadowSpaceMaterial.uniforms.pointSize = colorSpaceMaterial.uniforms.pointSize;
                    } );

	guiCloud.add(colorSpaceMaterial.uniforms.rgb , 'value').name('rgb').listen().onChange( function (value) {
		shadowSpaceMaterial.uniforms.rgb.value = value;
		resetModes("rgb");
	} );

	guiCloud.add(colorSpaceMaterial.uniforms.hsv , 'value').name('hsv').listen().onChange( function (value) {
		shadowSpaceMaterial.uniforms.hsv.value = value;
		resetModes("hsv");
	} );

	guiCloud.add(colorSpaceMaterial.uniforms.hsl , 'value').name('hsl').listen().onChange( function (value) {
		shadowSpaceMaterial.uniforms.hsl.value = value;
		resetModes("hsl");
	} );

	guiCloud.add(colorSpaceMaterial.uniforms.xyz , 'value').name('xyz').listen().onChange( function (value) {
		shadowSpaceMaterial.uniforms.xyz.value = value;
		resetModes("xyz");
	} );

	guiCloud.add(colorSpaceMaterial.uniforms.srgb , 'value').name('srgb').listen().onChange( function (value) {
		shadowSpaceMaterial.uniforms.srgb.value = value;
		resetModes("srgb");
	} );

	addGUI(guiCloud, 0.55, -0.33, 0, -Math.PI/2, -Math.PI/4, -Math.PI/2);

	guiLine = new GUI();
	guiLine.add(lineMaterial.uniforms.mx , 'value', -0.5, 0.5, 0.05).name('mx');
	guiLine.add(lineMaterial.uniforms.my , 'value', -0.5, 0.5, 0.05).name('my');
	guiLine.add(lineMaterial.uniforms.mz , 'value', -0.5, 0.5, 0.05).name('mz');
	guiLine.add(lineMaterial.uniforms.dx , 'value', -10.0, 10.0).name('dx');
	guiLine.add(lineMaterial.uniforms.dy , 'value', -10.0, 10.0).name('dy');
	guiLine.add(lineMaterial.uniforms.dz , 'value', -10.0, 10.0).name('dz');
	guiLine.add(lineMaterial.uniforms.tx , 'value').name('tx');
	guiLine.add(lineMaterial.uniforms.ty , 'value').name('ty');
	guiLine.add(lineMaterial.uniforms.tz , 'value').name('tz');
	guiLine.add(lineMaterial.uniforms.sx , 'value').name('sx');
	guiLine.add(lineMaterial.uniforms.sy , 'value').name('sy');
	guiLine.add(lineMaterial.uniforms.sz , 'value').name('sz');
	
	addGUI(guiLine, 0, -0.33, 0.6, Math.PI/4, Math.PI, 0);
}

function resetModes(modeName) {
	if (modeName == "rgb") colorSpaceMaterial.uniforms.rgb.value = true;
	else {
		colorSpaceMaterial.uniforms.rgb.value = false;
		shadowSpaceMaterial.uniforms.rgb.value = false;
	}
	if (modeName == "hsv") colorSpaceMaterial.uniforms.hsv.value = true;
	else {
		colorSpaceMaterial.uniforms.hsv.value = false;
		shadowSpaceMaterial.uniforms.hsv.value = false;
	} 
	if (modeName == "hsl") colorSpaceMaterial.uniforms.hsl.value = true;
	else {
		colorSpaceMaterial.uniforms.hsl.value = false;
		shadowSpaceMaterial.uniforms.hsl.value = false;
	}
	if (modeName == "xyz") colorSpaceMaterial.uniforms.xyz.value = true;
 	else {
		colorSpaceMaterial.uniforms.xyz.value = false;
		shadowSpaceMaterial.uniforms.xyz.value = false;
	}
	if (modeName == "srgb") colorSpaceMaterial.uniforms.srgb.value = true;
	else {
		colorSpaceMaterial.uniforms.srgb.value = false;
		shadowSpaceMaterial.uniforms.srgb.value = false;
	}
}

function addGUI(gui, x, y, z, rx, ry, rz){
	let mesh = new HTMLMesh( gui.domElement );
	mesh.position.x = x;
	mesh.position.y = y;
	mesh.position.z = z;

	mesh.rotation.set(rx, ry, rz);
	mesh.scale.setScalar( 1 );
	group.add( mesh );
	return mesh;
}

function addObject(x, y, z, rx, ry, rz, geometry, material) {
	var obj = new THREE.Mesh(geometry, material);
	obj.rotation.x = rx;
	obj.rotation.y = ry;
	obj.rotation.z = rz;

	obj.position.x = x;
	obj.position.y = y;
	obj.position.z = z;

	scene.add(obj);
	return obj;
}

function render () {
	renderer.clear();
	controls.update( clock.getDelta() );
	camera.position.y = 0.0;

	if (typeof imageProcessing !== 'undefined') {
		IVprocess ( imageProcessing, renderer );
	}

	if (videoLoaded){
		let time = (Date.now() - startTime) * 0.001;
		lineMaterial.uniforms.time.value = time;
	}

	renderer.render( scene, camera );
	renderer.setAnimationLoop(render);
}

function animate() {	
	render();
}

function onWindowResize () {
	camera.aspect = ( window.innerWidth / window.innerHeight);
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	render();
}