define([
  "dojo/_base/declare",
  "dojo/_base/lang",
   "dojo/Evented",
   "dojo/Deferred",
  "esri/layers/FeatureLayer",
  "esri/tasks/query",
  "esri/graphic",
  "esri/lang"
], function (
  declare, lang, Evented, Deferred, FeatureLayer, Query, Graphic, esriLang
) {
    return declare([Evented], {
        tractid: null,
        stands: null,
        tracts: null,
        tractFeature: null,
        tractGeometry: null,
        mapObj: null,
        canEdit: false,
        isOwner: false,
        constructor: function(params) {
            this.tractid = params.id;
            this.mapObj = params.mapObj;

            var layer = new FeatureLayer(config.tractFeatureurl, { id: "Management Tracts", mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"] });
            layer.setDefinitionExpression("tract_id = " + this.tractid);
            this.tracts = layer;
        },

        addStands: function() {
            var layer = new FeatureLayer(config.standFeatureurl, { id: "Management Areas", mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"] });
            layer.setDefinitionExpression("tract_id = " + this.tractid);
            this.mapObj.map.addLayer(layer);
            this.stands = layer;
            return layer;
        },

        addTract: function() {
            var d = new Deferred();
            var layer = this.tracts;
            //var layer = new FeatureLayer(tractFeatureurl, { id: "Management Tracts", mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"] });
            //layer.setDefinitionExpression("tract_id = " + this.tractid);
            this.mapObj.map.addLayer(layer);
            //this.tracts = layer;
            var q = new Query();
            q.returnGeometry = true;
            q.outFields = ["*"];
            var cb = layer.queryFeatures(q);

            cb.then(lang.hitch(this, function (results) {
                
                if (results.features.length == 0) {
                    console.debug(results);
                    this.emit("tract_not_found", {});
                } else {
                    
                    this.tractFeature = results.features[0];
                    var b = false;
                    var i = 0;
                    for (i = 0; i < results.features.length;i++)
                    {
                        if (results.features[i].geometry == null) {
                            b = true;
                            this.emit("geometry-null-problem", {});
                        }
                    }

                    if (results.features.length > 1) {
                        this.emit("multiple-tract-geometry-problem");
                    }


                    if (b == false) {
                        this.mapObj.zoomToFeatures(results.features);
                    }

                    
                    d.resolve(this.tractFeature);
                    this.emit("tract_added", {});
                }

               
            }), function(e) {
                console.debug(e);
            });
            return d.promise;
        },

        isEditable: function(currentUser){
            var editable = false;
            var owner = false;
            var tract = this.tractFeature;
            if (tract.attributes.user_name == currentUser) owner = true;
            if (owner || (tract.attributes.share || 0) == 1) editable = true;
            this.canEdit = editable;
            this.isOwner = owner;
            return editable;
        },
        refreshTractInformation: function(node) {
            var html = config.tractInfoTemplate;
            var result = esriLang.substitute(this.tractFeature.attributes, html);
            $(node).html(result);

            var e = $(".round2");
            $.each(e, function(i, h) {
                var v = $(h).html();
                $(h).html(parseFloat(v).toFixed(2));
            });
        }

        

    });
});