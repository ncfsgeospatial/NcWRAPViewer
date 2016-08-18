define([
  "dojo/_base/declare",
  "dojo/_base/lang",
   "dojo/Evented",
  "esri/layers/FeatureLayer",
  "esri/tasks/query",
  "esri/graphic"
], function (
  declare, lang, Evented, FeatureLayer, Query, Graphic
) {
    return declare([Evented], {

        url: null,
        featureLayer: null,
        tractid: null,
        constructor: function (params) {

            this.url = config.parcelTractFeatureurl;
            var flayer = new FeatureLayer(this.url, { mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"] });
            this.featureLayer = flayer;

        }, // end constructor

        add: function (graphics, tractid) {
            
            var newGraphics = [];
            $.each(graphics, function (indx, item) {
                var newAttributes = {};
                item.attributes.TRACT_ID = tractid;
                var newGraphic = new Graphic(item.geometry, null, item.attributes);
                newGraphics.push(newGraphic);
            });

            this.featureLayer.applyEdits(newGraphics, null, null, lang.hitch(this, this.onAddComplete), lang.hitch(this, this.onError));

        },

        onError: function(e){
            this.emit("error", e);
        },

        onAddComplete: function (adds, updates, deletes) {
            this.emit("complete", adds);
        },

    });
});

