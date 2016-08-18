define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "esri/layers/DynamicMapServiceLayer",
   "esri/geometry/Extent",
   "esri/SpatialReference",
   "dojo/io-query",
   "esri/geometry/webMercatorUtils"
], function (
  declare, lang, DynamicMapServiceLayer, Extent, SpatialReference, ioQuery, webMercatorUtils
) {
    return declare([DynamicMapServiceLayer], {
        constructor: function () {
            this.initialExtent = this.fullExtent = new Extent(-85, 33, -87, 37, { wkid: 4326 });
            this.spatialReference = new SpatialReference({ wkid: 4326 });
            this.visible = false;
            this.loaded = true;
            this.minScale = 18000;
            this.onLoad(this);
        },

        getImageUrl: function (extent, width, height, callback) {

            var extent2 = webMercatorUtils.webMercatorToGeographic(extent);

            var params = {
                request: "GetMap",
                transparent: true,
                format: "image/png",
                bgcolor: "ffffff",
                version: "1.1.1",
                layers: "0",
                styles: "default,default",
                

                //changing values
                bbox: extent2.xmin + "," + extent2.ymin + "," + extent2.xmax + "," + extent2.ymax,
                srs: "EPSG:" + extent2.spatialReference.wkid,
                width: width,
                height: height
            };

            callback("http://ge-nt.ncmhtd.com/cgi-bin/drg.cgi?" + ioQuery.objectToQuery(params));
        }

    });
});