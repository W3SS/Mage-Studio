/********************************************************************************
	MAIN SCRIPT
	copyright© 2014 Marco Stagni. http://marcostagni.com
********************************************************************************/

include("app/scripts/cube/mybox")

Class("MyGame", {

	MyGame: function() {
		App.call(this);
		this.loader = new THREE.ObjectLoader();
	},

	onCreate: function() {

		// ricezione del messaggio dal router
		function eventListener(event) {
			console.log("inside scene");
			console.log(event);
			//event.source.postMessage("Hi, router!", event.origin);
		}
		window.addEventListener("message", eventListener, false);
		parent.postMessage("Hi router from child", "http://localhost:8080")

		//restoring meshes
		var meshes = JSON.parse(app._scene.meshes);
		var models = JSON.parse(app._scene.models);
		for (var i in models) {
			meshes.push(models[i]);
		}
		var lights = JSON.parse(app._scene.lights);
        for (var i=0; i<meshes.length; i++) {
			var current = meshes[i];
			console.log(current);

			// loading script
			var script = current.object.userData ? current.object.userData['script'] : false,
				dir = false,
				file = false;
			if (script) {
				// we have the script for this mesh
				script = script.slice(script.lastIndexOf('scripts/') + 8);
			 	dir = script.slice(0, script.indexOf('/')),
				file = script.slice(script.indexOf('/') + 1);
			}

            var _mesh = this.loader.parse(current);

			if (_mesh.name.indexOf('_camera') > -1) {
				// dealing with a camera
				var camType = _mesh.name.replace('_', '').toLowerCase();
				if (app.camera.object.type.toLowerCase() === camType) {
					app.camera.object.position.set(_mesh.position.x, _mesh.position.y, _mesh.position.z);
					app.camera.object.rotation.set(_mesh.rotation.x, _mesh.rotation.y, _mesh.rotation.z);
					app.camera.object.scale.set(_mesh.scale.x, _mesh.scale.y, _mesh.scale.z);

					if (dir && file) {
						app.camera.addScript(file.replace('.js', ''), dir);
					}
				}
			} else {
				//every mesh must have castshadow and receive shadow enabled
	            _mesh.castShadow = true;
	            _mesh.receiveShadow = true;
				var mesh = new Mesh(_mesh.geometry, _mesh.material);
				mesh.mesh.position.set(_mesh.position.x, _mesh.position.y, _mesh.position.z);
				mesh.mesh.rotation.set(_mesh.rotation.x, _mesh.rotation.y, _mesh.rotation.z);
				mesh.mesh.scale.set(_mesh.scale.x, _mesh.scale.y, _mesh.scale.z);
				mesh.mesh.castShadow = true;
				mesh.mesh.receiveShadow = true;
				// setting texture
				if (current.textureKey) {
					var texture = ImagesEngine.get(current.textureKey);
					texture.wrapS = THREE.RepeatWrapping;
			        texture.wrapT = THREE.RepeatWrapping;
			        texture.repeat.set(1, 1);
					mesh.mesh.material.map = texture;
				}
				if (dir && file) {
					mesh.addScript(file.replace('.js', ''), dir);
				}
			}
        }
        //restoring lights
        for (var j=0; j<lights.length; j++) {
            var currentLight = lights[j];
            //recreating light, holder, target, helper
            var o = {
                holder: (currentLight.holder) ? app.loader.parse(currentLight.holder) : false,
                //helper: (currentLight.helper) ? app.loader.parse(currentLight.helper) : false,
                target: (currentLight.target) ? app.loader.parse(currentLight.target) : false,
                light: (currentLight.light) ? app.loader.parse(currentLight.light) : false
            };
            //setting helpers ecc
            if (currentLight.light.object.type == "DirectionalLight") {
				new DirectionalLight(o.light.color, o.light.intensity, o.light.distance, o.light.position, o.target);
                //var size = 50;
				/*
                l.light.castShadow = true;
                //l.light.shadowCameraVisible = true;
                l.light.shadowMaSizeWidth = 512;
                l.light.shadowMapSizeHeight = 512;
                var d = 200;
                l.light.shadowCameraLeft = -d;
                l.light.shadowCameraRight = d;
                l.light.shadowCameraTop = d;
                l.light.shadowCameraBottom = -d;
                l.light.shadowCameraFar = 1000;
				*/
				//l.light.castShadow = o.light.castShadow;
                //l.light.shadowCameraVisible = true;
                //l.light.shadow.mapSize.width = o.light.shadow.mapSize.width;
                //l.light.shadow.mapSize.height = o.light.shadow.mapSize.height;
                //var d = 200;
                //l.light.shadow.camera.left = o.light.shadow.camera.left;
                //l.light.shadow.camera.right = o.light.shadow.camera.right;
                //l.light.shadow.camera.top = o.light.shadow.camera.top;
                //l.light.shadow.camera.bottom = o.light.shadow.camera.bottom;
                // #TODO be able to change shadow camera far
                //l.light.shadow.camera.far = l.light.shadow.camera.far;

                //l.light.shadowDarkness = 0.2;
            } else if (currentLight.light.object.type == "AmbientLight") {
                new AmbientLight(o.light.color, o.light.intensity, o.light.position);
            } else if (currentLight.light.object.type == "PointLight") {
                //var sphereSize = 50;
                //o.helper = new THREE.PointLightHelper(o.light, sphereSize);
                //every light must cast shadow
				var d = 200;
				var position = o.holder ? o.holder.position : o.light.position;
				var l = new PointLight(o.light.color, o.light.intensity, d, position);
                l.light.castShadow = true;
                l.light.shadow.camera.left = -d;
                l.light.shadow.camera.right = d;
                l.light.shadow.camera.top = d;
                l.light.shadow.camera.bottom = -d;
                l.light.shadow.camera.far = app.util.camera.far;
                l.light.shadow.darkness = 0.2;
            }
        }
        //restoring models
        //restoring sounds

		/*
		include("app/SceneLoader", function() {
			app.sceneLoader = new THREE.SceneLoader();

		});
		*/
		//var geometry = new THREE.CubeGeometry(20, 20, 20);
		//var material = new THREE.MeshBasicMaterial({
		//	color: 0xff0000,
		//	wireframe : true
		//});

		//var cube = new Mesh(geometry, material, {script : "mybox", dir : "cube"});

		//console.log("Inside onCreate method");

		//document.addEventListener( 'mousemove', app.onDocumentMouseMove, false );
		//document.addEventListener( 'touchstart', app.onDocumentTouchStart, false );
		//document.addEventListener( 'touchmove', app.onDocumentTouchMove, false );
		//document.addEventListener( 'mousewheel', app.onDocumentMouseWheel, false);

		//example for camera movement
		//app.camera.addScript("cameraScript", "camera");
		for (var i in app.scene.children) {
			if (app.scene.children[i].material) {
				app.scene.children[i].material.needsUpdate = true;
			}
		}
	},

	progressAnimation: function(next) {
		new Vivus("mage", {type: 'oneByOne', duration: 1000, onReady: function() {
			$('#mage').css('visibility', 'visible');
		}});
		$('#loader').delay(5000).fadeOut(1000);
		next();
	},

	preload: function(next) {
		var oReq = new XMLHttpRequest();
		oReq.addEventListener("load", function() {
			var scene = JSON.parse(this.responseText);
			app.loadScene(scene, next);
		});
		oReq.open("GET", "scene.json");
		oReq.send();
	},

	loadScene: function(scene, next) {
		app._scene = scene;
		next();
	},

	prepareScene: function() {

	}

})._extends("App");
