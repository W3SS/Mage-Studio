Class("ScriptEditor", {

	MAX_NUM_TABS : 5,
	FILE_EXTENSIONS : ["js", "coffee"],
	MIN_HEIGHT : 600,
	MIN_WIDTH : 800,
	HEIGHT : 600,
	WIDTH : 800,
	LINT_CONFIG : {
		undef : false,
		unused : false
	},
	LINT_GLOBALS : "/*global alert $ window document console setInterval setTimeout require*/\n",

	ScriptEditor : function(container) {
		this.zeroState = true;
		this.zeroStateMessage = $('.empty-message');
		this.container = container;

		this.tabs = $('#tabs ul');
		// adding monokai class to container
		$(container).addClass("monokai");

		this.availableThemes = ["monokai"];

		this.currentTheme = "monokai";
		this.currentTab = 0;
		this.numTab = 0;
		this.activeTabs = 0;
		this.editors = [];

		this.refreshInterval = 1000;
		this.refreshId = undefined;

		//creating helper
		this.helper = new ScriptHelper();

		//flag
		this.isNew = true;

		//setting listeners for open and close editor
		app.interface.events.scriptEditorOpened.add(function() {
			if (app.scriptEditor.isNew) {
				app.scriptEditor.init(),
				app.scriptEditor.isNew = false;
			}
			app.scriptEditor.sidebar.setSidebar();
			//checking if we have a working directory where we can save files
			var workspace = app.storage.get("workspace");
			if (!workspace) {
				app.dialog.info("Workspace", "Please choose a valid workspace", function() {
                    app._dialog.showOpenDialog({properties: ['openDirectory']},function (value) {
                        app.storage.workspace = value[0];
                        app.storage.set("workspace", value[0]);
                        if (app.storage.currentProject == STRINGS.defaultProject) {
                            app.dialog.prompt("Project", "Please choose a name for your project", function(value) {
                                app.storage.currentProject = value;
                                app.storage.set("currentProject", app.storage.currentProject);
                                swal.close();
								if (!this.storage.createProject(value)) {
                                    this.dialog.error(STRINGS.NOT_EMPTY_FOLDER.title, STRINGS.NOT_EMPTY_FOLDER.message);
                                }
                            });
                        }
                    });
                });
			}
			// set timeout to update files hierarchy
			//app.scriptEditor.refreshId = setInterval(app.scriptEditor.sidebar.setSidebar, app.scriptEditor.refreshInterval);

			//fade in of script editor
			$(app.scriptEditor.container).fadeIn(200);
		});

		app.interface.events.scriptEditorClosed.add(function() {
			//clearInterval(app.scriptEditor.refreshId);
			$(app.scriptEditor.container).fadeOut(200);
		});
	},


	init: function() {
		//creating layout
		this.layout = new ScriptLayout();
		this.layout.set();
		//creating sidebar
		this.sidebar = new ScriptSidebar();
		this.sidebar.init();
		this.setUpLintWorker();
		/*
		//creating editor
		this.createEditor(this.currentTab, "main.js", "javascript", app.storage.currentProject+"_main.js");
		//setting up lint worker
		this.setUpLintWorker();
		//trying to recover main.js from storage
		var content = app.storage.get(app.storage.currentProject+"_main.js");
		if (content) {
			console.log("setting content");
			// we don't need to store tab content
			app.scriptEditor.editors[0].codeMirror.setValue(content);
		}
		//reading scaffolds/wage/app/main.js content
		else if (window.require !== undefined) {
			console.log("about to call require");
			var fs =  require("fs");
			fs.readFile("scaffolds/wage/app/main.js", {encoding: "utf8"}, function(err, data) {
				// setting tab value
				app.scriptEditor.editors[0].codeMirror.setValue(data);
				//we need to store data
				app.storage.set(app.storage.currentProject+"_main.js", data);
			});
		} else {
			console.log("something bad happened");
			return;
		}

		this.selectTab(0);
		console.log("calling refresh inside init on editor_0");
		setTimeout(function() {
			app.scriptEditor.editors[0].codeMirror.refresh();
		}, 100);
		*/
	},

	_isAlreadyOpen: function(name, path) {
		for (var i in app.scriptEditor.editors) {
			var e = app.scriptEditor.editors[i];
			if ((e.name == name) && (e.path == path)) return e.id;
		}
		return false;
	},

	openFile: function(name, path) {
		if (app.scriptEditor.zeroState) {
			app.scriptEditor.zeroState = false;
			app.scriptEditor.zeroStateMessage.addClass('hidden');
		}
		//this.createEditor(this.currentTab, name, "javascript", app.storage.getStorageKey(path));
		var id = app.scriptEditor._isAlreadyOpen(name, path);
		if (isNaN(parseInt(id))) {
			var fs =  require("fs");
			fs.readFile(path, {encoding: "utf8"}, function(err, data) {
				var storage = app.storage.getStorageKey(path);
				app.scriptEditor.addNewTab(name.trim(), 'javascript', storage);
				// setting tab value
				app.scriptEditor.editors[app.scriptEditor.currentTab].codeMirror.setValue(data);
				//we need to store data
				//app.storage.set(app.storage.currentProject+"_", data);
				app.scriptEditor._refreshTab(app.scriptEditor.currentTab);
			});
		} else {
			app.scriptEditor.selectTab(id);
		}

	},

	setListeners: function() {
		//Setting listener for resize event
		document.addEventListener("resize", app.scriptEditor.onResize, false);
		this.setTabListener();
	},

	setTabListener: function() {
		//setting tab listeners
		$('.tab').unbind("click");
		$(".tab").on("click", function() {
			var id = $(this).attr("id");
			var tab = parseInt(id.substr(4, id.length));
			app.scriptEditor.selectTab(tab);
		});

		$('.tab .close').unbind("click");
		$(".tab .close").on("click", function() {
			var id = $(this).parent().attr("id");
			var tab = parseInt(id.substr(4, id.length));
			app.scriptEditor.removeTab(tab);
		});
	},

	//on resize event
	onResize : function() {
		app.scriptEditor.layout.setSizes();
	},

	setUpLintWorker : function() {
		this.worker = new Worker("app/App.ScriptEditor.Worker.js");
		this.worker.addEventListener("message", function(e){
			var data = JSON.parse(e.data.result);
			//console.log(data);
			for (var k in data.errors) {
				var error = data.errors[k];
				//console.log(error.line-2);
				app.scriptEditor.editors[e.data.toCheck].codeMirror.addLineClass(error.line-2, "background", "errorLine");
				app.scriptEditor.editors[e.data.toCheck].saveError({
					line : error.line-2,
					reason : error.reason,
					index : k
				});
				$($('.errorLine')[k]).attr("title",error.reason);
				var t = new jBox('Tooltip', {
					theme : "TooltipDark",
					closeOnMouseLeave : true
				});
				t.attach($($('.errorLine')[k]));
				app.scriptEditor.editors[e.data.toCheck].saveTooltip(t);
			}
		});
	},

	lint : function(){
		for (var i=0; i< app.scriptEditor.numTab; i++) {
			if (app.scriptEditor.editors[i].type == "javascript") {
				app.scriptEditor.editors[i].removeAllErrors();
				app.scriptEditor.editors[i].removeAllJBoxes();
				app.scriptEditor.editors[i].saveText();
				var text = app.scriptEditor.editors[i].text.join("\n");
				text = app.scriptEditor.LINT_GLOBALS + text;
				this.worker.postMessage({
					task : "lint",
					code : text,
					config : app.scriptEditor.LINT_CONFIG,
					toCheck : i
				});
		 	}
		}
	},

	_refreshTab: function(index) {
		setTimeout(function() {
			app.scriptEditor.editors[index].codeMirror.refresh();
		}, 100);
	},

	_eval : function() {
		app.scriptEditor.lint();
		for (var i=0; i< app.scriptEditor.numTab; i++) {
			switch (app.scriptEditor.editors[i].type) {
				case "javascript" : {
					app.scriptEditor.editors[i].saveText();
					//storing data
					var text = app.scriptEditor.editors[i]._textToString();
					app.storage.set(app.scriptEditor.editors[i].savename, text);
					//now saving file
					var path = app.scriptEditor.editors[i].savename.split(app.storage.currentProject+"_"+app.storage.currentScene+"_")[1];
					var dir = app.storage.get("cwd");
					console.log(path);
					app.filehelper.write(path, text);
					break;
				}
				case "coffeescript" : {
					app.scriptEditor.editors[i].saveText();
					//storing data
					//storing data
					var text = app.scriptEditor.editors[i].compiled;
					app.storage.set(app.scriptEditor.editors[i].savename, text);
					//now saving file
					var path = app.scriptEditor.editors[i].savename.split(app.storage.currentProject+"_"+app.storage.currentScene+"_")[1];
					var dir = app.storage.get("cwd");
					console.log(path);
					app.filehelper.write(path, text);
					break;
				}
 			}
		}
	},

	addNewTab : function(name, type, storage) {
		var previous = this.currentTab;
		if ((this.activeTabs+1) > this.MAX_NUM_TABS) return;

		this.numTab ++;
		this.activeTabs ++;
		//if we don't provide name nor type, we need to ask one
		var _name, _type, _id;
		if ((name == undefined) || (type == undefined)) {
			//selecting new tab
			var filename = app.dialog.prompt("Please insert script's name.");
			if (!(typeof filename == "string")) {
				console.log("Please use a valid filename.");
				return;
			}
			if (app.scriptEditor.FILE_EXTENSIONS.indexOf(filename.split(".")[1]) == -1) {
				//trying to use a invalid file extension
				console.log("Please use a valid file extension.");
				return;
			}
			_name = filename;
			_type = filename.split(".")[1] == "coffee" ? "coffeescript" : "javascript";
			_id = app.storage.currentProject+"_"+app.storage.currentScene+"_"+filename;
			_path = filename;
		} else {
			_name = name;
			_type = type;
			//var storage = app.storage.getStorageKey(name);
			_id = storage.key;
			_path = storage.value;
		}
		app.scriptEditor.tabs.append(app.scriptEditor.helper.li("tab_"+(app.scriptEditor.numTab -1), "tab inactive", "<i class='fa fa-remove close'></i><span>"+_name+"</span>", {checkHtml : false}));
		$('#editor_'+app.scriptEditor.currentTab).after(app.scriptEditor.helper.div("editor_"+(app.scriptEditor.numTab-1), "editor invisible", "", {checkHtml : false}));
		this.setTabListener();
		this.createEditor((app.scriptEditor.numTab -1), _name, _type, _id, _path);
		this.selectTab((app.scriptEditor.numTab -1));
	},

	createEditor : function(tab, name, type, id, path) {
		this.editors[tab] = new ScriptTab("editor_"+tab, name, type, id, path);
	},

	selectTab : function(tab) {
		if (tab > this.MAX_NUM_TABS) return;
		for (var i=0; i<this.numTab; i++) {
			if (i != tab) {
				$("#editor_"+i).removeClass().addClass("editor invisible");
				$("#tab_"+i).removeClass().addClass("tab inactive");
			} else{
				$('#editor_'+i).removeClass().addClass("editor visible");
				$("#tab_"+i).removeClass().addClass("tab active");
			}
		}
		if (this.editors[tab].type == "coffeescript") {
			$("#coffee_compiler").removeClass().addClass("visible");
		} else {
			$("#coffee_compiler").removeClass().addClass("invisible");
		}
		this.currentTab = tab;
		//this.editors[tab].focus();
		$('#editor_'+tab).click();
		console.log("calling refresh inside selectTab on editor_"+tab);
		app.scriptEditor.editors[tab].codeMirror.refresh();
	},

	removeTab : function(tab) {
		if (tab == 0) {
			//can we remove the first tab??
		} else {
			if (tab > this.MAX_NUM_TABS) return;

			if (this.editors[tab].type == "coffeescript") {
				$("#coffee_compiler").removeClass().addClass("invisible");
			}

			$('#editor_'+tab).remove();
			$('#tab_'+tab).remove();
			this.activeTabs -= 1;
			//this.editors[tab] = {};
			this.selectTab(tab-1);
		}
	}
});
