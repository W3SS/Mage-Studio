Class("Global", {
    Global: function() {
        this.version = "v0.0.1";
        this.author = "Marco Stagni";
        this.website = "http://marcostagni.com";
        this.thanksTo = ["Mr Doob", "THREE.js"];
        // adding String contains method
        String.prototype.contains = function(e) { return this.indexOf(e) > -1 };
    },

    _numToHex: function(number) {
        var str = Number(number).toString(16);
        return str.length == 1 ? "0" + str : str;
    },

    RgbToHex: function(r, g, b) {
        return "#" + this._numToHex(r) + this._numToHex(g) + this._numToHex(b);
    },

    // very simple bind
    bind: function(method, scope) {
        return method.bind(scope);
    },

    uuid: function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
});
