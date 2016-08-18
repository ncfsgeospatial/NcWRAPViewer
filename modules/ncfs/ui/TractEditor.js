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
  "esri/tasks/query",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol",
   "esri/symbols/SimpleMarkerSymbol",
  "esri/geometry/Polygon",
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
  "esri/InfoTemplate",
  "esri/dijit/editing/Editor",
  "esri/dijit/editing/TemplatePicker", "dojo/keys",
  "dojo/i18n!esri/nls/jsapi",
  "esri/undoManager",
  "modules/ncfs/UndoManager",
  "modules/ncfs/GraphicsUndoManager",
  "modules/ncfs/PolygonFeatureEditor",
], function (
  declare, lang, Evented, event, topic, dc, dom, Deferred, connect, FeatureLayer,  Query,
  SimpleRenderer, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Polygon, 
  SpatialReference, Color,
   Draw, Edit, Graphic, graphicsUtils, GraphicsLayer, GeometryService, webMercatorUtils,
  esriLang, InfoTemplate, Editor, TemplatePicker, keys, jsapiBundle, undoManager, myUndoManager, GraphicsUndoManager, PolygonFeatureEditor
) {
    return declare([Evented], {
        node: null,
       
        loaded: null,
        map: null,
        tractid: null,       
        tractFeatureLayer: null,       
        standFeatureLayer: null,                    
        geometryService: null,               
        tractid: null,
        templatePicker: null,
       
        currentState: null,
        graphicHistory: null,


        // advanced Editing
        advancedEditorNode: null,
        templateNode: null,
        editorNode: null,
        advancedEditor: null,
        tractFeatureBefore: null,               
        tractAttributes: null,

        constructor: function (params, attachTo) {
            this.node = dc.create("div", {}, dom.byId(attachTo));            
            this.map = params.map;
            this.tractid = params.tractid;
            this.geometryService = params.geometryService;
            this.loaded = false;
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
            this.standFeatureLayer = new FeatureLayer(config.standFeatureurl, { id: "Management Area", mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"], visible: false });
            this.standFeatureLayer.setDefinitionExpression("tract_id = " + this.tractid);
            this.map.addLayers([this.tractFeatureLayer, this.standFeatureLayer]);
            this.tractFeatureLayer.queryFeatures(q, lang.hitch(this, function (results) {

                if (results.features.length > 0) {
                    var tractFeature = results.features[0];

                    this.tractAttributes = tractFeature.attributes;                    
                    this.map.setExtent(graphicsUtils.graphicsExtent(results.features), true);                    
                    
                    this.lineSymbol = new SimpleFillSymbol().outline = SimpleLineSymbol().setColor(new Color([255, 255, 0])).setWidth(5);                                        
                    this._onStartUp();

                } else {
                    $(this.node).empty().append("There are no features in this tract");
                    document.location = "index.aspx";
                }

                deferred.resolve();
            }));
        
            var id = this.tractid;
            this.tractFeatureLayer.on("before-apply-edits", lang.hitch(this, function (evt) {                
                
                if (evt.adds && evt.adds.length > 0) {
                    $.each(evt.adds, lang.hitch(this, function (indx, f) {
                       
                        f.attributes.tract_id = this.tractAttributes.tract_id;
                        f.attributes.date_created = this.tractAttributes.date_created;
                        f.attributes.county_name = this.tractAttributes.county_name;
                        f.attributes.ncfs_district = this.tractAttributes.ncfs_district;
                        f.attributes.ncfs_region = this.tractAttributes.ncfs_region;
                        f.attributes.owner_lastname = this.tractAttributes.owner_lastname;
                        f.attributes.owner_firstname = this.tractAttributes.owner_firstname;
                        f.attributes.owner_middlename = this.tractAttributes.owner_middlename;
                        f.attributes.remarks = this.tractAttributes.remarks;
                        f.attributes.latdecdeg = this.tractAttributes.latdecdeg;
                        f.attributes.longdecdeg = this.tractAttributes.longdecdeg;
                        f.attributes.tract_label = this.tractAttributes.tract_label;
                        f.attributes.tract_name = this.tractAttributes.tract_name;
                        f.attributes.user_name = this.tractAttributes.user_name;
                        f.attributes.share = this.tractAttributes.share;
                        //this.undoManager.addNew(f, this.tractFeatureLayer);
                    }));                    
                }


                if (evt.updates && evt.updates.length > 0) {
                    //$.each(evt.updates, lang.hitch(this, function (indx, f) {
                    //    this.undoManager.addUpdate(f, this.advancedEditor._preUpdates.toJson(), this.tractFeatureLayer);
                    //}));                   
                }

                if (evt.deletes && evt.deletes.length > 0) {
                    //$.each(evt.deletes, lang.hitch(this, function (indx, f) {
                    //    this.undoManager.addUpdate([this.advancedEditor._preUpdates.toJson()], this.tractFeatureLayer);
                    //}));
                }


            }));

            this.currentState = this.toHistory();
            topic.subscribe("window-pop-state", lang.hitch(this, this.handlePopState));
            topic.subscribe("state-change", lang.hitch(this, this._onStateChange));
            
            return deferred.promise;
        },


        



        deactivate: function () {

            

            this.map.enableDoubleClickZoom();
            this.map.enablePan();

            this.emit("deactivate", {});

        },

        activate: function () {
            this.map.disableDoubleClickZoom();
            this.map.disablePan();
            this.map.enableSnapping();            
            this.emit("activate", {});
        },

       

      

        _refreshMapLayers: function (evt) {

            this.tractFeatureLayer.refresh();
            this.standFeatureLayer.refresh();
         
        },


      
        autoMergeGeometry_click: function() {
            var q = new Query();
            q.returnGeometry = true;
            q.outFields = ["*"];
            
            this.tractFeatureLayer.queryFeatures(q, lang.hitch(this, this.autoMergeGeometry));               
        },

        autoMergeGeometry: function(results) {
            var deferred = new Deferred();
            var polygons = $.map(results.features, function (f) { return f.geometry });
            if (polygons.length > 1) {
                this.geometryService.union(polygons, lang.hitch(this, function (result) {
                   
                    var deletes = results.features
                    var feature = this.tractFeatureLayer.templates[0].prototype;
                    feature.setGeometry(result);
                                      
                    this.tractFeatureLayer.applyEdits([feature], null, results.features, lang.hitch(this, function (results) {                        
                        this._createNonEditingToolbar();
                        deferred.resolve();
                        return deferred;
                    }), function (results) {
                        console.debug(results);
                        deferred.cancel("");
                    });
                }));            
            } else if (polygons.length == 0) {
                BootstrapDialog.alert("You can't have a zero length polygon");
            } else {
                return deferred.resolve();
            }

            return deferred.promise;
        },

       

        _createNonEditingToolbar: function() {

            $(this.node).empty();

               
            var q = new Query();
            this.tractFeatureLayer.queryFeatures(q, lang.hitch(this, function (results) {

                if (results.features.length == 0) {
                    BootstrapDialog.alert("You cannot have a Management Tract without any polygons");
                    return false;
                } else if (results.features.length == 1) {
                   
                    var tbEdits = dc.create("div", {
                        className: "ags-editor-toolbar",
                        style: "text-align: center;"
                    }, this.node);
                                       

                    var b = dc.create("button", {
                        className: "btn btn-default",
                        type: "button",
                        title: "Start Editing",
                        innerHTML: "Start Editing"
                    }, tbEdits);
                    $(b).on("click", lang.hitch(this, this.advancedEditingButtonClicked));

                    //var b = dc.create("button", {
                    //    className: "btn btn-default",
                    //    type: "button",
                    //    title: "Start Editing",
                    //    innerHTML: "Start Editing"
                    //}, tbEdits);
                    //$(b).on("click", lang.hitch(this, this.workAround));


                } else {
                    var tbEdits = dc.create("div", {
                        className: "ags-editor-toolbar",
                        style: "text-align: center;"
                    }, this.node);

                    //var b = dc.create("button", {
                    //    className: "btn btn-default",
                    //    type: "button",
                    //    title: "Start Editing",
                    //    innerHTML: "Start editing"
                    //}, tbEdits);
                    //$(b).on("click", lang.hitch(this, this.advancedEditingButtonClicked));

                    //// abort Editing
                    //var b = dc.create("button", {
                    //    className: "btn btn-default",
                    //    type: "button",
                    //    title: "Merge",
                    //    innerHTML: "Merge"
                    //}, tbEdits);
                    //$(b).on("click", lang.hitch(this, this.autoMergeGeometry_click));


                    //var d = dc.create("div", {
                    //    innerHTML: config.MergeTractExplanation
                    //}, this.Node);
                    this.autoMergeGeometry_click();


                }

            }));



           
        },


        workAround: function() {

            $(this.node).empty();
           
            var tb = dc.create("div", { className: "centered" }, this.node);

            dc.create("br", {}, this.node);
            dc.create("hr", {}, this.node);


            var editor = new PolygonEditor({ map: this.map, geometryService: this.geometryService }, dc.create("div", {}, this.node));
            editor.startup();

            var q = new Query();
            this.tractFeatureLayer.queryFeatures(q, lang.hitch(this, function (results) {
                editor.setFeatures(results.features);
            }));

            var b = dc.create("button", {
                className: "btn btn-danger",
                type: "button",
                title: "Abort Edits and Go Back to Main Menu",
                innerHTML: "Abort Edits"
            }, tb);
            $(b).on("click", lang.hitch(this, function () {

                editor.destroy();
                this._createNonEditingToolbar();
                this.tractFeatureLayer.show();
            }));

            var b = dc.create("button", {
                className: "btn btn-default",
                type: "button",
                title: "Go Back to Main Menu",
                innerHTML: "Save & Complete"
            }, tb);
            $(b).on("click", lang.hitch(this, function() {
                
                var polygons = graphicsUtils.getGeometries(editor.graphicLayer.graphics);              
                this.geometryService.union(polygons, lang.hitch(this, function (result) {
                    var feature = this.tractFeatureLayer.templates[0].prototype;                    
                    feature.setGeometry(result);
                    var q = new Query();
                    this.tractFeatureLayer.queryFeatures(q, lang.hitch(this, function (results) {
                        this.tractFeatureLayer.applyEdits([feature], null, results.features, lang.hitch(this, function (results) {
                            editor.destroy();
                            this._createNonEditingToolbar();
                            this.tractFeatureLayer.show();                            
                        }));
                    }));
                }));
            }));
            this.tractFeatureLayer.hide();
        },



        advancedEditingButtonClicked: function (e) {
            event.stop(e);
            this.initAdvancedEditing(false);
        },

       

        abortAdvancedEdits: function() {
            var q = new Query();
            this.tractFeatureLayer.refresh();
            this.tractFeatureLayer.queryFeatures(q, lang.hitch(this, function (results) {
                var def = this.tractFeatureLayer.applyEdits(null, null, results.features);
                def.then(lang.hitch(this, function (deletes) {
                    var f = new Graphic(this.tractFeatureBefore);
                    var d2 = this.tractFeatureLayer.applyEdits([f], null, null);
                    d2.then(lang.hitch(this, this.returnToMainMenu));
                }), function (error) {
                    console.debug(error);
                });
            }));


        },


        returnToMainMenu: function() {
            var q = new Query();

            this.tractFeatureLayer.refresh();
            this.tractFeatureLayer.queryFeatures(q, lang.hitch(this, function (results) {
                
                if (results.features.length == 0) {
                    BootstrapDialog.alert("You cannot have a Management Tract without any polygons");
                    return false;
                } else if (results.features.length > 0) {
                    if (this.advancedEditor) {                        
                        this.advancedEditor.deactivate();
                    }           
                    $(this.advancedEditorNode).hide();
                    this._createNonEditingToolbar();                
                }

            }));
           
           

        },


        _onStartUp: function() {

            var q = new Query();
            this.tractFeatureLayer.queryFeatures(q, lang.hitch(this, function (results) {

                if (results.features.length == 0) {
                    this._createNonEditingToolbar();
                } else if (results.features.length == 1) {
                    this.initAdvancedEditing();
                } else {
                    this._createNonEditingToolbar();
                }

            }));


        },


        setTractGeometry: function() {
            var q = new Query();
            this.tractFeatureLayer.queryFeatures(q, lang.hitch(this, function (results) {
                var polygons = $.map(results.features, function (f) { return f.geometry });
                if (polygons.length > 1) {
                    this.geometryService.union(polygons, lang.hitch(this, function (result) {                        
                        var f = this.tractFeatureLayer.templates[0].prototype;
                        f.setGeometry(result);
                        this.tractFeatureBefore = f.toJson();                        
                    }));
                } else {
                    var f = this.tractFeatureLayer.templates[0].prototype;
                    f.setGeometry(results.features[0].geometry);
                    this.tractFeatureBefore = f.toJson();                    
                }
            }));
        },



        initAdvancedEditing: function () {
            $(this.node).empty();
            this.emit("edit-start", {});


            var tb = dc.create("div", { className: "centered" }, this.node);

            dc.create("br", {}, this.node);
            dc.create("hr", {}, this.node);

          
            var b = dc.create("button", {
                className: "btn btn-danger",
                type: "button",
                title: "Abort Edits and Go Back to Main Menu",
                innerHTML: "Abort Edits"
            }, tb);
            $(b).on("click", lang.hitch(this,  this.abortAdvancedEdits));

            var b = dc.create("button", {
                className: "btn btn-default",
                type: "button",
                title: "Go Back to Main Menu",
                innerHTML: "Save & Complete"
            }, tb);
            $(b).on("click", lang.hitch(this, this.returnToMainMenu));

            // Set the State of the Tract Before we start editing, so we can 
            // undo the edits if we abort editing
            this.setTractGeometry();
             
            if (this.advancedEditor == null) {               
                this.createAdvancedEditingInterface();
            }        
                         
              
            $(this.advancedEditorNode).show();   

        },

        createAdvancedEditingInterface: function () {

            var node = dom.byId("advancedEditor");
            var editor = new PolygonFeatureEditor({
                map: this.map,
                geometryService: this.geometryService,
                featureLayer: this.tractFeatureLayer,
                fields: [
                    { "name": "tract_name", "readonly": "false", text: "Name", placeholder: "Enter Name for the Management Tract" },
                    { "name": "tract_label", "readonly": "false", text: "Label", placeholder: "Enter Label for Management Tract" },
                    { "name": "tract_acres", "readonly": true, text: "Acreage", placeholder: "Total Acreage" },
                    { "name": "owner_lastname", "readonly": "false", text: "Last Name", placeholder: "Enter Last Name" },
                    { "name": "owner_firstname", "readonly": "false", text: "First Name", placeholder: "Enter First Name" },
                    { "name": "owner_middlename", "readonly": "false", text: "Middle Name", placeholder: "Enter Middle Name" },                    
                    { "name": "remarks", "readonly": "false", text: "Remarks", placeholder: "Enter Remarks" }
                ]
            }, node);
            editor.startup();
            this.advancedEditor = editor;
            this.advancedEditorNode = node;

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

            

        },

        toHistory: function () {

            

        }


    });
});