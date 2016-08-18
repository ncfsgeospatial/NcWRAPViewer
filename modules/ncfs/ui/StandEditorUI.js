define([
  "dojo/_base/declare",
  "dojo/_base/lang",
   "dojo/Evented",
   "dojo/_base/event",
    "dojo/topic",
   "dojo/dom-construct",
   "dojo/dom",
   "dojo/Deferred",
   "dojo/_base/connect",
  "esri/layers/FeatureLayer",
  "esri/layers/LabelLayer",
  "esri/tasks/query",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/PictureMarkerSymbol",
   "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/TextSymbol",
  "esri/geometry/Polygon",
  "esri/geometry/Polyline",
  "esri/geometry/Point",
  "esri/SpatialReference",
  "dojo/_base/Color",
  "esri/toolbars/draw",
  "esri/toolbars/edit",
  "esri/graphic",
  "esri/graphicsUtils",
  "esri/layers/GraphicsLayer",
  "esri/tasks/GeometryService",
  "esri/geometry/webMercatorUtils",
  "esri/lang",
  "modules/ncfs/data/StandManager",

  "esri/InfoTemplate",
  "esri/dijit/editing/Editor",
  "esri/dijit/editing/TemplatePicker", "dojo/keys",
  "dojo/i18n!esri/nls/jsapi",
  "esri/undoManager",
  "modules/ncfs/PolygonFeatureEditor",

], function (
  declare, lang, Evented, event, topic, dc, dom, Deferred, connect, FeatureLayer,LabelLayer, Query,
  SimpleRenderer, SimpleFillSymbol, SimpleLineSymbol, PictureMarkerSymbol, SimpleMarkerSymbol,TextSymbol, Polygon, Polyline,
   Point, SpatialReference, Color,
   Draw, Edit, Graphic, graphicsUtils, GraphicsLayer, GeometryService, webMercatorUtils,
  esriLang, StandManager, InfoTemplate, Editor, TemplatePicker, keys, jsapiBundle,
  undoManager, PolygonFeatureEditor
) {
    return declare([Evented], {
        node: null,
        attributenode: null,
        loaded: null,
        map: null,
        tractid: null,
        tractGeometry: null,
        tractFeatureLayer: null,
        tractGraphicLayer: null,        
        standFeatureLayer: null,
        standLabelLayer: null,
        graphicLayer: null,
        labelLayer: null,       
        geometryService: null,
        symbol: null,
        lineSymbol: null,
        markerSymbol: null,
        highlightSymbol: null,
        tractid: null,
        drawToolbar: null,
        cutHandler: null,
        editToolbar: null,
        editingEnabled: null,
        selectedGraphics: null,
        drawMode: null,
        deleteButton: null,
        saveButton: null,
        cancelButton: null,
        editButton: null,
        cutButton: null,
        selectButton: null,
        mergeButton: null,
        explodeButton: null,
        editAttributesButton: null,
        toolbar: null,

   
        templatePicker: null,

        originalFeatures: null,

        currentState: null,
        graphicHistory: null,

        // handlers
        lineSelectHandler: null,
        editToolbarHandler: null,
        drawToolbarHandler: null,
        labelSelectHandler: null,
        standFeatureLayerClickHandler: null,

        // new feature UI Commands
        splitLinebutton: null,
        undoButton: null,
        finishSplitButton: null,
        noSplitButton: null,

        // advanced Editing
        advancedEditorNode: null,
        templateNode: null,
        editorNode: null,
        advancedEditor: null,
       
        constructor: function (params, attachTo) {
            this.node = dc.create("div", {}, dom.byId(attachTo));
            this.attributenode = dc.create("div", { style: "display:none" }, dom.byId(attachTo));
            this.map = params.map;
            this.tractid = params.tractid;
            this.geometryService = params.geometryService;
            this.loaded = false;
            this.originalFeatures = [];
            this.graphicHistory = [];
            
        }, // end constructor

        startUp: function () {

            this.loaded = true;
            var deferred = new Deferred();

            this.tractFeatureLayer = new FeatureLayer(config.tractFeatureurl, { id: "Tract", mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"] });
            var q = new Query();
            q.returnGeometry = true;
            q.outFields = ["*"];
            q.outSpatialReference = this.map.spatialReference;
            this.tractFeatureLayer.setDefinitionExpression("tract_id = " + this.tractid);
            this.standFeatureLayer = new FeatureLayer(config.standFeatureurl, { id: "Management Area", mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"] });
            this.standFeatureLayer.setDefinitionExpression("tract_id = " + this.tractid);
            this.map.addLayers([this.tractFeatureLayer, this.standFeatureLayer]);
            this.tractFeatureLayer.queryFeatures(q, lang.hitch(this, function (results) {

                if (results.features.length > 0) {
                    var tractFeatures = results.features;
                    this.map.setExtent(graphicsUtils.graphicsExtent(results.features), true);                
                    this.tractGeometry = tractFeatures[0].geometry;
                    this.graphicLayer = new GraphicsLayer();
                    this.labelGraphicsLayer = new GraphicsLayer();
                    this.map.addLayers([this.graphicLayer, this.labelGraphicsLayer]);
                    this.lineSymbol = new SimpleLineSymbol().setColor(new Color([255, 0, 0])).setWidth(3);
                    this.editToolbar = new Edit(this.map);
                    this.drawToolbar = new Draw(this.map, {
                        tooltipOffset: 20,
                        drawTime: 90,
                        showToolTips: true
                    });
                    this.editToolbar.on("deactivate", lang.hitch(this, this._editToolbarDeactivate));
                    this._createNonEditingToolbar();
                   
                    var symbol = new TextSymbol().setColor(new Color([255,0,0]));
                    var renderer = new SimpleRenderer(symbol);
                    var labelLayer = new LabelLayer();
                    labelLayer.addFeatureLayer(this.standFeatureLayer, renderer, "{stand_label}");
                    this.map.addLayer(labelLayer);
                    this.labelLayer = labelLayer;

                    this.standFeatureLayer.on("before-apply-edits", lang.hitch(this, function (evt) {
                        if (evt.adds && evt.adds.length > 0) {
                            $.each(evt.adds, lang.hitch(this, function (indx, f) {
                                //console.debug(f);
                                if (f!=null){
                                    f.attributes.tract_id = this.tractid;
                                }
                            }));                           
                        }                        
                    }));

                } else {
                    $(this.node).empty().append("There are no features in this tract");
                }
            }));
            
            var pm = new PictureMarkerSymbol("images/forest_32_32_2.png", 32, 32);
            this.markerSymbol = pm;

            this.highlightSymbol = new SimpleFillSymbol().setColor([0, 255, 0, 0.2]);

            this.currentState = this.toHistory();
            topic.subscribe("window-pop-state", lang.hitch(this, this.handlePopState));
            topic.subscribe("state-change", lang.hitch(this, this._onStateChange));

            deferred.resolve();
            return deferred.promise;
        },



        deactivate: function () {

            if (this.loaded == true) {                
                this.graphicLayer.hide();
                this.drawToolbar.deactivate();
                this.editToolbar.deactivate();
                
            }
            this.map.enableDoubleClickZoom();
            this.map.enablePan();

            this.emit("deactivate", {});

        },

        activate: function () {
            this.map.disableDoubleClickZoom();
            this.map.disablePan();

            this.map.enableSnapping();
            if (this.graphicLayer) this.graphicLayer.show();

            this.emit("activate", {});
        },

        _editToolbarDeactivate: function(e) {
            //e.graphic.modified = true;
        },

        _setLabelEditing: function() {
            
            
            this.labelSelectHandler = this.labelGraphicsLayer.on("click", lang.hitch(this, this._onLabelSelected));

            this.labelGraphicsLayer.clear();
            this.labelGraphicsLayer.show();           

            var q = new Query();
            this.standFeatureLayer.queryFeatures(q, lang.hitch(this, function (labels) {
                // add the existing features to graphic layer
                var i = 0;
                while (i < labels.features.length) {
                    var pt = new Point(labels.features[i].attributes.longdecdeg, labels.features[i].attributes.latdecdeg, new SpatialReference({wkid: 4326}));
                    var webPt = webMercatorUtils.geographicToWebMercator(pt);
                    var g = new Graphic(webPt, this.markerSymbol, labels.features[i].attributes);
                    this.labelGraphicsLayer.add(g);
                    i++;
                }


            }));


        },

        _onLabelSelected: function(evt) {
            event.stop(evt);            
            this.editToolbar.activate(Edit.MOVE, evt.graphic);
        },
            
        _refreshMapLayers: function (evt) {

            this.tractFeatureLayer.refresh();
            this.standFeatureLayer.refresh();
            this.labelLayer.refresh();

        },


        _clearGraphics: function () {
            $(".vs-while-edit").hide();
            $(".vs-edit-select").hide();
            $(".vs-edit-normal").show();
            this.selectedGraphics = null;
            this.graphicLayer.clear();
            this.graphicLayer.show();
            this.labelGraphicsLayer.clear();
            this.labelGraphicsLayer.show();
 
        },

        _createNonEditingToolbar: function () {

            if (this.standFeatureLayerClickHandler != null) {
                connect.disconnect(this.standFeatureLayerClickHandler);
            }            


            $(this.node).empty();

            var tb2 = dc.create("div", {
                className: ""
            }, this.node);

            var tb = dc.create("div", {
                className: ""
            }, this.node);

            //this.map.enableMapNavigation();

            var b = dc.create("button", {
                className: "btn btn-default",
                type: "button",
                innerHTML: "Basic Editing"
            }, tb);
            $(b).on("click", lang.hitch(this, this.startEditing));
            $(b).tooltip(config.basicEditingTooltip);

            this.standFeatureLayer.refresh();

            var q = new Query();
            this.standFeatureLayer.queryCount(q, lang.hitch(this,  function (count) {
                if (count == 0) {
                      var b2 = dc.create("button", {
                            className: "btn btn-default",
                            type: "button",
                            title: "Complete - There is only one stand in tract",
                            innerHTML: "Use Tract Geometry"
                        }, tb);
                      $(b2).on("click", lang.hitch(this, this._onNoSplitCommandButtonClicked));
                } else {
                    

                    var b = dc.create("button", {
                        className: "btn btn-default",
                        type: "button",
                        title: "Advanced editing",
                        innerHTML: "Advanced Editing"
                    }, tb);
                    $(b).on("click", lang.hitch(this, this.advancedEditingButtonClicked));

                    
                }
              
            }));

        
           

        },


        //  Added for Cut Line Editing
        //   results = the lines in the stand line feature layer.
        initToolbar: function (results) {
            $(this.node).empty();


            var deferred = new Deferred();

            // check if there are more rings in tract...
            //this.featureLayer.hide();
            this.standFeatureLayer.hide();
            this.map.enableSnapping();
            //this.map.disableMapNavigation();
            this.graphicLayer.show();
            this.graphicLayer.clear();
            this.graphicHistory = [];
            this.map.graphics.clear;

            this._setLabelEditing();

            // get the stand lines from the stand polygons
            this._getLineFeatures(results);
                       
            this.drawToolbarHandler = this.drawToolbar.on("draw-end", lang.hitch(this, this._onDrawEnd));
                     
            this.lineSelectHandler = this.graphicLayer.on("click", lang.hitch(this, this._onLineSelected));
            
            var editToolbar = this.editToolbar;
            this.map.on("click", function (evt) {
                editToolbar.deactivate();
            });        

            var tb = dc.create("div", {
                className: ""                
            }, this.node);

            // add Split Button
            var splitb = dc.create("button", {
                className: "btn btn-default draw-button",
                type: "button",                
                innerHTML: "Split tract into management areas"
            }, tb);

            var deactb = dc.create("button", {
                className: "btn btn-default draw-button",
                type: "button",
                innerHTML: "Deactivate"
            }, tb);
            $(splitb).on("click", lang.hitch(this, function (evt) {
                event.stop(evt);
                jsapiBundle.toolbars.draw.start = "Click to begin cut, double click to finish";
                jsapiBundle.toolbars.draw.addPoint = "Click to start line, double click to finish";
                jsapiBundle.toolbars.draw.resume = "Click to continue" + "<br>Press <b>ALT</b> to enable snapping";
                this.drawToolbar.activate(Draw.POLYLINE, { showTooltips: true });
                console.debug(jsapiBundle);
                $(deactb).show();
                $(splitb).hide();                               
            }));            
            //$(b).tooltip(config.startSplitTooltip);

            
            $(deactb).click(lang.hitch(this, function (evt) {
                event.stop(evt);
                this.drawToolbar.deactivate();
                $(deactb).hide();
                $(splitb).show();
            })).hide();


            // add the Delete button
            var canBtn = dc.create("button", {
                className: "btn btn-warning editing-button",
                type: "button",
                title: "Cancel",
                style: "display: none;",
                innerHTML: "Cancel"
            }, tb);
            $(canBtn).on("click", lang.hitch(this, function(evt){
                event.stop(evt);
                this.drawToolbar.deactivate();
                this.editToolbar.deactivate();
                $(".editing-button").hide();
                $(splitb).show();
            }));
            this.deleteButton = delBtn;
            var delBtn = dc.create("button", {
                className: "btn btn-warning editing-button",
                type: "button",
                title: "Delete Selected Line",
                style: "display: none;",
                innerHTML: "Delete"
            }, tb);
            $(delBtn).on("click", lang.hitch(this, this._onDeleteCommandClicked));
            this.deleteButton = delBtn;

            this.editToolbar.on("activate", lang.hitch( this,  function () {
                this.drawToolbar.deactivate();              
                $(".editing-button").show();
                $(deactb).hide();
                $(splitb).hide();
            }));

            this.editToolbar.on("deactivate", function (e) {
                $(".editing-button").hide();               
                $(deactb).hide();
                $(splitb).show();
            });



            var tbEdits = dc.create("div", {
                className: "ags-editor-toolbar",
                style: "text-align: center; padding-top: 20px"
            }, this.node);

            var b = dc.create("button", {
                className: "btn btn-warning",
                type: "button",
                title: "Cancel Editing",
                innerHTML: "Cancel edits"
            }, tbEdits);
            $(b).on("click", lang.hitch(this, this.abortEditing));

            // add the finish button
            var b = dc.create("button", {
                className: "btn btn-success",
                type: "button",
                title: "Save Edits",
                innerHTML: "Save edits"
            }, tbEdits);
            $(b).on("click", lang.hitch(this, this._onFinishButtonClicked));



            deferred.resolve();
            return deferred.promise;

        },

        _getLineFeatures: function(results) {

            if (results.features.length == 0) return;

            var features = [];
            $.each(results.features, function (iF, f) {
                if (f.geometry) features.push(f);
            });



            // add the existing features to graphic layer
            var geoms = graphicsUtils.getGeometries(features);                        
            var geoms2 = this._getLines(geoms);
            var tractLines = this._getLines([this.tractGeometry]);
            var d = this.geometryService.difference(geoms2, tractLines[0]);
            d.then(lang.hitch(this, function (results) {
                //console.debug(results);

                var d = this.geometryService.union(results);
                d.then(lang.hitch(this, function (results) {
                    this._addLines(results);
                    //this._addPolygons(results);
                }));
            }));

        },

        _getLines: function (polygons) {

           var sp = this.map.spatialReference;
           var results= $.map(polygons, function (polygon) {
                var polylines = [];
                var i = 0;                
                while (i < polygon.rings.length) {
                    var l = new Polyline(sp);
                    l.addPath(polygon.rings[0]);
                    polylines.push(l);
                    i++;
                }
                return polylines;
              
            });
            return results;
            
        },

        _addLines: function (geometry) {
            var i = 0;
            this.graphicLayer.clear();
            while (i < geometry.paths.length) {
                var lg = geometry.paths[i];
                var l = new Polyline(this.map.spatialReference);
                l.addPath(lg);
                var g = new Graphic(l, this.lineSymbol);
                this.graphicLayer.add(g);
                i++;
            }

            this.graphicLayer.show();
        },

       


        startEditing: function(e) {
            this.graphicHistory = [];           
            // Get the Stand Features                       
            var q = new Query();
            q.outSpatialReference = this.map.spatialReference;

            this.standFeatureLayer.queryFeatures(q, lang.hitch(this, this.initToolbar));
            this.emit("edit-start", {});

            this.resetHistory();

        },

        stopEditing: function () {

            this.graphicLayer.clear();
            this.graphicLayer.hide();
            this.labelGraphicsLayer.hide();
            this.standFeatureLayer.show();
 
            connect.disconnect(this.labelSelectHandler);

            this.deactivate();
            this.emit("saved", {});
            this._createNonEditingToolbar();
            this._refreshMapLayers();

            this.resetHistory();

        },

        abortEditing: function(e) {
            event.stop(e);
            this.graphicLayer.clear();
            this.graphicLayer.hide();
            this.labelGraphicsLayer.hide();
            connect.disconnect(this.labelSelectHandler);

            this.standFeatureLayer.show();            
            this.deactivate();
            this._createNonEditingToolbar();
            this._refreshMapLayers();
            this.emit("edit-aborted", {});

            this.resetHistory();

        },
        


        // Events assc with the New Feature Toolbar
        _onDrawEnd: function(evt){
           
                var polyline = evt.geometry;
                $(this.undoButton).show();
                //this.graphicHistory.push(polyline);
                var a = {};
                a.tract_id = this.tractid;
                var nf = new Graphic(polyline, this.lineSymbol, a);
                this.graphicLayer.add(nf);

                this.currentState = this.toHistory();
                topic.publish("state-change", {});
            
        },


        _onLineSelected: function (evt) {

            event.stop(evt);
            var graphic = evt.graphic;
            var tool = 0;
            tool = Edit.EDIT_VERTICES;

            //specify toolbar options        
            var options = {
                allowAddVertices: true,
                allowDeleteVertices: true,
                uniformScaling: true
            };

            this.editToolbar.activate(tool, graphic, options);
        },


        // Command buttons assc with the new feature toolbar
        _onDeleteCommandClicked: function() {
            var result = this.editToolbar.getCurrentState();
            this.graphicLayer.remove(result.graphic);
            this.editToolbar.deactivate();

            this.currentState = this.toHistory();
            topic.publish("state-change", {});
            
        },


        _addOriginalFeatures: function() {

            var i = 0;
            while (i < this.originalFeatures.length) {
                var g = new Graphic(this.originalFeatures[i].geometry, this.lineSymbol, this.originalFeatures[i].attributes);
                this.graphicLayer.add(g);
                i++;
            }
        },
       


        _onFinishButtonClicked: function (e) {
            event.stop(e);
           
            var sm = new StandManager({
                map: this.map,
                standLines: graphicsUtils.getGeometries(this.graphicLayer.graphics),
                labelFeatures: this.labelGraphicsLayer.graphics,
                stands: this.standFeatureLayer,
                tractGeometry: this.tractGeometry,
                geometryService: this.geometryService,
                tractid: this.tractid
            });

            sm.on("complete", lang.hitch(this, this.stopEditing));
            sm.save();
            
        },

        _getLineFeaturesToAdd: function () {
            var adds = [];
            var i = 0;
            var geoms = graphicsUtils.getGeometries(this.graphicLayer.graphics);
            var i = 0; n = geoms.length;
            var att = {};
            att.tract_id = this.tractid;
            for (i = 0; i < n; i++) {
                var g = new Graphic(geoms[i], null, att);
                adds.push(g);
            }
            return adds;
        },

        _onNoSplitCommandButtonClicked: function (e) {
            event.stop(e);
            this.graphicLayer.clear();
            this._onFinishButtonClicked(e);         
        },

        // ******************************
        // attribute Editing
        // ******************************
        

  
        stopAdvancedEditing: function () {

            this.map.infoWindow.set("popupWindow", false);
            this.deactivate();
            this.advancedEditor.deactivate();
            this.emit("saved", {});
            this._createNonEditingToolbar();
            this._refreshMapLayers();

            this.resetHistory();
            $(this.advancedEditorNode).hide();
           

            this.map.graphics.clear();
            //this.map.enableMapNavigation();
        },

        advancedEditingButtonClicked: function (e) {

            this.map.infoWindow.set("popupWindow", false);
            event.stop(e);
            this.initAdvancedEditing();
        },

        initAdvancedEditing: function () {
            $(this.node).empty();
            this.emit("edit-start", {});

            var tb = dc.create("div", {
                className: "btn-group"
            }, this.node);

            var b = dc.create("button", {
                className: "btn btn-default",
                type: "button",
                title: "Done, Back to Main Menu",
                innerHTML: "Done, Back to Main Menu"
            }, tb);
            $(b).on("click", lang.hitch(this, this.stopAdvancedEditing));

            dc.create("hr", {}, this.node);

            if (this.advancedEditor == null) {
                this.createAdvancedEditingInterface();
            } else {
                this.advancedEditor.activate();
            }

            $(this.advancedEditorNode).show();

            this.emit("edit-start", {});


        },

        createAdvancedEditingInterface: function() {

            var node = dom.byId("advancedEditor");
            var editor = new PolygonFeatureEditor({
                map: this.map,
                geometryService: this.geometryService,
                featureLayer: this.standFeatureLayer,
                fields: [
                    { "name": "stand_acres", "readonly": "true", text: "Acreage", placeholder: "" },
                    { "name": "stand_label", "readonly": "false", text: "Label", placeholder: "Enter Label for Management Area" },
                    { "name": "ma_num", "readonly": "false", text: "Number", placeholder: "Enter Number for Management Area" },
                    { "name": "remarks", "readonly": "false", text: "Remarks", placeholder: "Enter Remarks for Management Area" }                    
                ]
            }, node);
            editor.startup();
            this.advancedEditor = editor;
            this.advancedEditorNode = node;

        },


        destroy: function() {

            if (this.advancedEditor != null) {

                this.advancedEditor.destroy();
                this.templatePicker.destroy();
                this.templatePicker = null;
                this.advancedEditor = null;
            }


        },
        


        // ******************************
        // Functions dealing with History
        // ******************************

        _onStateChange: function (e) {
            //console.debug(e);
            e.editState = this.currentState;
        },

        handlePopState: function (e) {
            var u = e.object;

            if (u.query.editState) {
                this.fromHistory(u.query.editState);
            }


        },

        resetHistory: function () {
            this.graphicHistory = [];
            this.currentState = this.toHistory();
            topic.publish("state-change", {});
        },


        fromHistory: function (g) {

            this.graphicLayer.clear();
            this.labelGraphicsLayer.clear();
            var gl = this.graphicLayer;
            var lgl = this.labelGraphicsLayer;

            $.each(this.graphicHistory, function (n, e) {
                if (g == e.guid) {
                    console.debug(e.guid);
                    $.each(e.graphics, function (i, g) {
                        gl.add(g);
                        console.debug(g);
                    });

                    $.each(e.labelGraphics, function (i, g) {
                        lgl.add(g);
                        console.debug(g);
                    });

                    //alert("handle")
                }
            });

        },

        toHistory: function () {

            function S4() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }

            // then to call it, plus stitch in '4' in the third group
            var guid = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();

            var newEntry = {};
            newEntry.guid = guid;
            var stateGraphics = [];
            if (this.graphicLayer) {
                stateGraphics = $.map(this.graphicLayer.graphics, function (g) {
                    return new Graphic(g.geometry, g.symbol);
                });
            }

            var stateLabelGraphics = [];
            if (this.labelGraphicsLayer) {
                stateLabelGraphics = $.map(this.labelGraphicsLayer.graphics, function (g) {
                    return new Graphic(g.geometry, g.symbol);
                });
            }

            newEntry.graphics = stateGraphics;
            newEntry.labelGraphics = stateLabelGraphics;
            this.graphicHistory.push(newEntry);

            this.currentState = guid;

            return guid;

        },


    });
});