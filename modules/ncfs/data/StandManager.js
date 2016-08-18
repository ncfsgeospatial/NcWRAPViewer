define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/Evented",
  "esri/layers/FeatureLayer",
  "esri/graphic",
  "esri/layers/GraphicsLayer",
   "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/geometry/Polygon",
  "esri/geometry/webMercatorUtils",
  "modules/BootStrapDialog"
], function (
  declare, lang, Evented, FeatureLayer, Graphic, GraphicsLayer, QueryTask, Query, Polygon,
  webMercatorUtils, BootStrapDialog
) {
    return declare([Evented], {
        tractid: null,
        featureLayer: null,      
        map: null,
        geometryService: null,

        labelFeatures: null,
        tractGeometry: null,
        standLines: null,        
        graphicLayer: null,

        dialog: null,

        constructor: function (params) {

            this.map = params.map;            
            this.featureLayer = params.stands;
            this.standLines = params.standLines;           
            this.labelFeatures = params.labelFeatures;
            this.tractGeometry = params.tractGeometry;
            this.geometryService = params.geometryService;
            this.tractid = params.tractid;
            this.dialog = new BootStrapDialog({ title: "Updating Forestry Tracts", href: "assets/working.htm" });
            this.dialog.startup();         

        }, // end constructor

        save: function () {
            
            this.dialog.show();

            var q = new Query();
            q.where = "tract_id = " + this.tractid;
            q.outSpatialReference = this.map.spatialReference;
            var d1 = this.featureLayer.queryFeatures(q);            
            d1.then(lang.hitch(this, this._onFindForDeleteCallback));

        },

        _onFindForDeleteCallback: function (results) {
            
            var deletes = results.features;

            if (deletes.length == 0) {
                this.emit("stands-deleted", {});                
                this._makePolygons();
            } else {
                var d = this.featureLayer.applyEdits(null, null, deletes, null, lang.hitch(this, this._onError));
                d.then(lang.hitch(this, function () {
                    this.emit("stands-deleted", {});
                    this._makePolygons();
                }));
            }           

        },

        _makePolygons: function(){
            if (this.standLines.length == 0) {
                this._useTractBoundary();
            } else {
                this._cut();
            }
        },


        _onError: function (e) {


            $(this.dialog.contentDiv).empty()
                .append("<div class='alert alert-danger' role='alert'>An Error Occured when we tried to save to the database</div>")
                .append("<div class='alert alert-danger' role='alert'>" + e.message + "</div>");
        },

        _cut: function() {            
            var tracts = []
            var spRef = this.tractGeometry.spatialReference;
            if (this.tractGeometry.rings.length > 1) {
                $.each(this.tractGeometry.rings, function (indx, ring) {
                    var poly = new Polygon(spRef);
                    poly.addRing(ring);
                    tracts.push(poly);
                });
            } else {
                tracts.push(this.tractGeometry);
            }            
            standLines = this.standLines;
            this.geometryService.on("error", lang.hitch(this, this._onError));

            if (standLines.length > 1) {
                var unionDef = this.geometryService.union(standLines)
                unionDef.then(lang.hitch(this, function (g) {
                    var cutDef = this.geometryService.cut(tracts, g)
                    cutDef.then(lang.hitch(this, function (results) {
                        //this.emit("cut-complete", { graphics: results });
                        this._cutFeaturesComplete(results);
                    }));
                }));
            } else {
                var cutDef = this.geometryService.cut(tracts, standLines[0])
                cutDef.then(lang.hitch(this, function (results) {
                    //this.emit("cut-complete", { graphics: results });
                    this._cutFeaturesComplete(results);
                }));
            }




        },

        _cutFeaturesComplete: function (results) {          
            var tractid = this.tractid;
            var inputs = [];

            var labels = [];
            if (this.labelFeatures)
                labels = this.labelFeatures;

            $.each(results.geometries, function (i, g) {
                var feature = new Graphic(g);

                var standid = (i+1);
                feature.attributes = {};
                feature.attributes.stand_id = standid;
                feature.attributes.tract_id = tractid;
                feature.attributes.stand_label = standid;
                feature.attributes.stand_acres = 0;
                feature.attributes.ma_num = standid;
                feature.attributes.remarks = "";
                var pt = feature.geometry.getExtent().getCenter();
                var llpt = webMercatorUtils.webMercatorToGeographic(pt);
                feature.attributes.latdecdeg = llpt.y.toFixed(5);
                feature.attributes.longdecdeg = llpt.x.toFixed(5);
                inputs.push(feature);
                
                var j = 0; p = labels.length;
                while (j < p) {
                    var label = labels[j];
                    if (g.contains(label.geometry)) {
                        feature.attributes.stand_label = label.attributes.stand_label;
                        feature.attributes.remarks = label.attributes.remarks;
                        var llpt = webMercatorUtils.webMercatorToGeographic(label.geometry);
                        feature.attributes.latdecdeg = llpt.y.toFixed(5);
                        feature.attributes.longdecdeg = llpt.x.toFixed(5);
                    }                    
                    j++;
                }                

            });

            // Insert new polygons
            this.featureLayer.applyEdits(inputs, null, null, lang.hitch(this, this._onUpdateComplete), lang.hitch(this, this._onError));

        },

        _useTractBoundary: function () {

            var inputs = [];
            var labels = [];
            if (this.tractGeometry.rings.length > 1) {
                var tractid = this.tractid;
                var spRef = this.tractGeometry.spatialReference;
                $.each(this.tractGeometry.rings, function (indx, ring) {
                    var poly = new Polygon(spRef);
                    poly.addRing(ring);
                    var feature = new Graphic(poly);
                    feature.attributes = {};
                    feature.attributes.stand_id = (indx + 1);
                    feature.attributes.ma_num = (indx + 1);
                    feature.attributes.tract_id = tractid;
                    feature.attributes.stand_acres = 0;
                    feature.attributes.remarks = "";
                    var pt = feature.geometry.getExtent().getCenter();
                    var llpt = webMercatorUtils.webMercatorToGeographic(pt);
                    feature.attributes.latdecdeg = llpt.y.toFixed(3);
                    feature.attributes.longdecdeg = llpt.x.toFixed(3);
                    inputs.push(feature);
                });
            } else {
                var feature = new Graphic(this.tractGeometry);
                feature.attributes = {};
                feature.attributes.stand_id = 1;
                feature.attributes.ma_num = 1;
                feature.attributes.stand_label = "1";
                feature.attributes.tract_id = this.tractid;
                feature.attributes.remarks = "";
                var pt = feature.geometry.getExtent().getCenter();
                var llpt = webMercatorUtils.webMercatorToGeographic(pt);
                feature.attributes.latdecdeg = llpt.y.toFixed(3);
                feature.attributes.longdecdeg = llpt.x.toFixed(3);
                inputs.push(feature);

            }
            this.featureLayer.applyEdits(inputs, null, null, lang.hitch(this, this._onUpdateComplete));
            
    },

    _onUpdateComplete: function(adds, updates, deletes) {
        this.emit("complete", {});       
        this.dialog.hide();
    }

    });
});