define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/Evented",
  "esri/tasks/GeometryService",
   "esri/SpatialReference",
  "esri/geometry/Point"
], function (
  declare, lang, Evented, GeometryService, SpatialReference, Point

) {
    return declare([Evented], {

        map: null,
        url: null,
        attachTo: null,
        GeometryService: null,
        defaultZoom: null,
        constructor: function (options, attachTo) {
            this.map = map;
            this.url = options.url;
            this.attachTo = attachTo;
            this.GeometryService = new GeometryService(this.url);
            this.defaultZoom = options.zoom;
            if (this.defaultZoom == undefined) {
                this.defaultZoom = 15;
            }
        },

        startUp: function () {

        },

        _errorHandler: function (e) {
            this.emit("error", e);
        },

        execute: function (value) {

            values = value.split(",");

            // value #1 = lat
            // value #2 = long

            var y = this._dms2deg(values[0]);
            var x = this._dms2deg(values[1]);
            if (x != "" && y != "") {
                if (x > 0) x = -(x);
                var inSR = new SpatialReference({ wkid: 4326 });
                var outSR = this.map.spatialReference;
                var pt1 = new Point(x, y, inSR);
                this.GeometryService.project([pt1], outSR,
                    lang.hitch(this, this.execute_complete),
                    lang.hitch(this, this._errorHandler));
            }

        },

        execute_complete: function (geometries) {
            var pt = geometries[0];
            this.map.centerAndZoom(pt, this.defaultZoom);
            this.emit("execute-complete", { mapPoint: pt });
        },
        _dms2deg: function (s) {

            // Determine if south latitude or west longitude
            var sw = /[sw]/i.test(s);
            // Determine sign based on sw (south or west is -ve) 
            var f = sw ? -1 : 1;
            // Get into numeric parts
            var bits = s.match(/[\d.]+/g);
            var result = 0;
            // Convert to decimal degrees
            for (var i = 0, iLen = bits.length; i < iLen; i++) {
                // String conversion to number is done by division
                // To be explicit (not necessary), use 
                //   result += Number(bits[i])/f
                result += bits[i] / f;

                // Divide degrees by +/- 1, min by +/- 60, sec by +/-3600
                f *= 60;
            }

            return result;
        }



    });
});

