Class("FileHelper", {
    FileHelper: function() {
        try {
            this.fs = require("fs");
            this.path = require("path");
            this.nw = true;
        } catch(e) {
            this.nw = false;
        }
    },

    checkDirectory: function(dir) {
        return this.fs.existsSync(dir);
    },

    requestDirectory: function(callback) {
        //if we're not using node-webkit return
        if (!this.nw) return;
        //appending input to body
        var input = document.createElement('input');
        input.id = "directoryChooser";
        input.type = "file";
        input.style.visibility = "hidden";
        input.nwdirectory = true;
        $('body').append(input);
        //setting change listener
        $('#directoryChooser').change(function(event) {
            var dir = event.target.files[0].path;
            if (callback) callback(dir);
            //now removing the input created
            $('#directoryChooser').remove();
        });
        //triggering click
        $('#directoryChooser').click();
    },

    writeAppend: function(path, text, callback) {
        if (!this.nw) return;
        this.fs.open(path, "a", "0666", function(error, descriptor) {
            if (error) return;
            app.filehelper.fs.write(descriptor, text, callback);
        });
    },

    write: function(path, text, callback) {
        this.fs.open(path, "w", "0666", function(error, descriptor) {
            if (error) callback(error);
            app.filehelper.fs.write(descriptor, text, callback);
        });
    },

    read: function(path, callback) {
        this.fs.readFile(path, {encoding: "utf8"}, function(err, data) {
            if (!err) {
                callback(data);
            }
        });
    },

    rename: function(pre, post, callback) {
        this.fs.rename(pre, post, callback);
    },

    listDirectories: function(path) {
        return this.fs.readdirSync(path).filter(function(file) {
            return app.filehelper.fs.statSync(app.filehelper.path.join(path, file)).isDirectory();
        });
    },

    listContent: function(path) {
        var content = this.fs.readdirSync(path),
            map = [];

        for (var i=0; i<content.length; i++) {
            map.push({
                name: content[i],
                type: app.filehelper.fs.statSync(app.filehelper.path.join(path, content[i])).isDirectory() ?
                        'folder' :
                        'file',
                path: path
            });
        }

        return map;
    },

    getAllFiles: function(dir, filelist) {
        var files = app.filehelper.fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach(function(file) {
            if (app.filehelper.fs.statSync(dir + '/' + file).isDirectory()) {
                filelist = app.filehelper.getAllFiles(dir + '/' + file, filelist);
            }
            else {
                filelist.push({name:file, path:dir + "/" + file});
            }
        });
        return filelist;
    },

    listScenes: function() {
        return app.filehelper.listDirectories(app.storage.workspace + "/" + app.storage.currentProject + "/scenes");
    }
})
