define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Evented",
      "dojo/Deferred",
    "esri/map",
    "esri/tasks/GeometryService",
    "esri/toolbars/draw",
    "esri/toolbars/edit",
    "esri/graphic",
    "esri/config",
    "esri/tasks/query",
    "esri/graphicsUtils",

    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "esri/geometry/Polygon",
    "esri/SpatialReference",
     "esri/renderers/SimpleRenderer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
     "esri/Color",
  
    
    "modules/ncfs/AttributeEditor",
    "modules/ncfs/UndoManager",
  
    "dojo/_base/array",
    "dojo/_base/event",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/parser",  
    "dojo/_base/connect",
    "dojo/i18n!esri/nls/jsapi"
],
     function (declare, lang, Evented, Deferred,
        Map, GeometryService, Draw, Edit, Graphic, esriConfig, Query, graphicsUtils,
        GraphicLayer, FeatureLayer, Polygon, SpatialReference, SimpleRenderer,
        SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color,
        AttributeEditor, UndoManager,
        arrayUtils, event, dc, dom, parser, connect, jsapiBundle        
      ) {
         return declare([Evented], {
             map: null,
             geometryService: null,
             node: null,

             deleteButton: null,
             cancelButton: null,
             visible: null,             
             drawToolbar: null,
             editToolbar: null,             
             currentGraphic: null,
             originalGraphic: null,
             targetGraphic: null,
             targetGeometry: null,
             loaded: null,

             // html Elements
             cancelNode: null,
             defaultNode: null,
             selectFeatureNode: null,
             multiSelectFeatureNode: null,
             operationsNode: null,
             statusBarNode: null,
            
             featureLayer: null,            
             undoManager: null,
             mapClickHandler: null,
             mode: "none",

             editableFields: [],
             editControls: [],

             dialog: null,

             constructor: function (options, attachTo) {
                 this.map = options.map;
                 this.geometryService = options.geometryService;
                 this.node = attachTo;
                 this.featureLayer = options.featureLayer;
                 if (options.fields) this.editableFields = options.fields;
                 this.loaded = false;
                 this.visible = true;
             }, // end constructor

             createUI: function () {

                 this.defaultNode = dc.create("div", {}, this.node);
                 this.selectFeatureNode = dc.create("div", {
                     style: "display:none"
                 }, this.node);
                 this.multiSelectFeatureNode = dc.create("div", {
                     style: "display:none"
                 }, this.node);
                
                 this.cancelNode = dc.create("div", {}, this.node);

                 var canbutton = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Cancel"
                 }, this.cancelNode);
                 $(canbutton).click(lang.hitch(this, this.clearSelected));
                 $(this.cancelNode).hide();

                 var finishbutton = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Finish"
                 }, this.cancelNode);
                 $(finishbutton).click(lang.hitch(this, function () {
                     this.drawToolbar.finishDrawing();
                 }));
              

                 var tb = dc.create("div", {}, this.defaultNode);

                 // create the edit toolbar when you select the feature
                 var tb2 = this.selectFeatureNode;

                 var unselectBtn = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Clear"
                 }, tb2);
                 $(unselectBtn).click(lang.hitch(this, this.clearSelected));

                 var delbutton = dc.create("button", {
                     className: "btn btn-danger", innerHTML: "Delete"
                 }, tb2);
                 this.deleteButton = delbutton;
                
                 $(delbutton).click(lang.hitch(this, this._deleteSelected));
                 
                 if (this.editableFields.length > 0) {
                     
                     this.dialog = new AttributeEditor({ fields: this.editableFields });
                     this.dialog.on("ok-clicked", lang.hitch(this, function (e) {
                         var selected = e.graphic;
                         this.featureLayer.applyEdits(null, [selected], null, lang.hitch(this, function (results) {
                             //this.undoManager.addUpdate(e.graphic, this.originalGraphic, this.featureLayer);
                         }));
                     }));

                    var attrbutton = dc.create("button", {
                        className: "btn btn-warning", innerHTML: "Attr"
                    }, tb2);                 
                    $(attrbutton).click(lang.hitch(this, this._editAttributesSelected));
                 }

                 var reshapeButton = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Reshape"
                 }, tb2);
                 $(reshapeButton).click(lang.hitch(this, function () {
                     this.deactivateClick();
                     
                     this.editToolbar.deactivate();
                     this.drawToolbar.activate(Draw.POLYLINE);
                     this.mode = "reshape";
                     $(this.selectFeatureNode).hide();
                     $(this.multiSelectFeatureNode).hide();
                     $(this.defaultNode).hide();
                     $(this.cancelNode).show();
                 }));

                 var splitButton = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Split"
                 }, tb2);
                 $(splitButton).click(lang.hitch(this, function () {
                     this.deactivateClick();
                     
                     this.editToolbar.deactivate();
                     this.drawToolbar.activate(Draw.POLYLINE);
                     this.mode = "split";
                     $(this.selectFeatureNode).hide();
                     $(this.multiSelectFeatureNode).hide();
                     $(this.defaultNode).hide();
                     $(this.cancelNode).show();
                 }));

                 var explodeBtn = dc.create("button", {
                     className: "btn btn-warning", innerHTML: "Explode"
                 }, tb2);
                 $(explodeBtn).click(lang.hitch(this, function () {
                     var s = this.featureLayer.getSelectedFeatures();
                     if (s.length == 1) {
                         this.explode(s[0]);
                     } else {
                         if (s.length == 0) {
                             BootstrapDialog.alert('You must first select a feature!');
                         } else {
                             BootstrapDialog.alert('More than one feature selected!');
                         }
                     }

                 }));


                 var selectmoreBtn = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Select More"
                 }, tb2);

              

                 $(selectmoreBtn).click(lang.hitch(this, function () {
                     this.deactivateClick();
                     this.editToolbar.deactivate();
                     this.drawToolbar.activate(Draw.EXTENT);
                     this.mode = "select";
                     $(this.selectFeatureNode).hide();
                     $(this.multiSelectFeatureNode).hide();
                     $(this.defaultNode).hide();
                     $(this.cancelNode).show();
                 }));


                 // end Section ------------------------


                 // Deactivate Button
                 var resetBtn = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Reset"
                 }, tb);
                 $(resetBtn).click(lang.hitch(this, this.clearSelected));

                 var selectBtn = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Select"
                 }, tb);
                
                 var clearSelectBtn = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Clear"
                 }, this.multiSelectFeatureNode);
                 $(clearSelectBtn).click(lang.hitch(this, this.clearSelected));

                 var mergeBtn = dc.create("button", {
                     className: "btn btn-default btn-merge", innerHTML: "Merge"
                 }, this.multiSelectFeatureNode);

                 $(selectBtn).click(lang.hitch(this, function () {
                     this.featureLayer.clearSelection();
                     this.drawToolbar.activate(Draw.EXTENT);
                 }));

                 var selectionSymbol = new SimpleFillSymbol().setColor(new Color([255, 255, 0, 0.5]));
                 this.featureLayer.setSelectionSymbol(selectionSymbol);
                 this.featureLayer.on("selection-complete", lang.hitch(this, function (results) {
                     var selected = this.featureLayer.getSelectedFeatures();
                     if (selected.length > 1) {
                         $(this.multiSelectFeatureNode).show();
                         $(this.selectFeatureNode).hide();
                         $(this.cancelNode).hide();
                         $(this.defaultNode).hide();
                     } else if (selected.length==1) {
                         $(this.multiSelectFeatureNode).hide();
                         $(this.cancelNode).hide();                        
                         $(this.defaultNode).hide();
                         $(this.selectFeatureNode).show();                     
                     }                     
                     
                 }));
                 this.featureLayer.on("selection-clear", lang.hitch(this, function () {
                     //this.clearSelected();
                 }));

                 $(mergeBtn).click(lang.hitch(this, function () {
                     var selected = this.featureLayer.getSelectedFeatures();
                     var geoms = graphicsUtils.getGeometries(selected);
                     var unionResults = this.geometryService.union(geoms);
                     unionResults.then(lang.hitch(this, function (result) {
                         var mergeFeature = new Graphic(result);
                         var attributes = lang.mixin({}, this.featureLayer.templates[0].prototype.attributes);                        
                         mergeFeature.attributes = attributes;
                         this.featureLayer.applyEdits([mergeFeature],null, selected, lang.hitch(this, function (results) {
                             this.undoManager.addMerge(selected, mergeFeature, this.featureLayer);
                             this.clearSelected();
                             this.featureLayer.refresh();
                         }));
                     }));
                 }));

                 var selectmoreBtn = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Select More"
                 }, this.multiSelectFeatureNode);

                 $(selectmoreBtn).click(lang.hitch(this, function () {
                     this.deactivateClick();
                     this.editToolbar.deactivate();
                     this.drawToolbar.activate(Draw.EXTENT);
                     this.mode = "select";
                     $(this.selectFeatureNode).hide();
                     $(this.multiSelectFeatureNode).hide();
                     $(this.defaultNode).hide();
                     $(this.cancelNode).show();
                 }));
                 

                 var addBtn = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Add"
                 }, tb);
                 $(addBtn).click(lang.hitch(this, function () {
                     this.clearSelected();
                     this.deactivateClick();
                     this.drawToolbar.activate(Draw.POLYGON);
                     $(this.selectFeatureNode).hide();
                     $(this.multiSelectFeatureNode).hide();
                     $(this.defaultNode).hide();
                     $(this.cancelNode).show();
                     
                 }));


                 // end Section ------------------------
                 this.operationsNode = dc.create("div", {
                     className: "centered"
                 }, this.node);

                 this.undoManager = new UndoManager({}, this.operationsNode);



                 var b = dc.create("button", {
                     className: "btn btn-default",
                     type: "button",
                     title: "Enable Map Navigation",
                     innerHTML: "Enable Map Navigation"
                 }, this.defaultNode);
                 $(b).on("click", lang.hitch(this, function () {

                     if (this.map.isPan) {
                         this.map.disablePan()
                         this.map.disableDoubleClickZoom();
                         $(b).html("Enable Map Navigation");
                     } else {
                         this.map.enableDoubleClickZoom();
                         this.map.enablePan();
                         $(b).html("Disable Map Navigation");
                     }

                 }));


                 this.statusBarNode = dc.create("div", { className: "panel-footer"}, this.node)
                 this.geometryService.on("error", lang.hitch(this, function (result) {
                     this.statusBarNode.innerHTML = "Error: " + result.message;
                 }));










                    
             },
            
             

             

             _deleteSelected: function () {
                 var selected = this.featureLayer.getSelectedFeatures();
                 
                 this.featureLayer.applyEdits(null, null, selected, lang.hitch(this, function(result) {
                     this.undoManager.addDelete(selected, this.featureLayer);
                 }));                                 
                 this.editingEnabled = false;
                 this.clearSelected()
             },
             

             startup: function () {
                 // Initilize the edit toolbar
                 var editToolbar = new Edit(this.map);
                 editToolbar.on("deactivate", lang.hitch(this, function (e) {                                                            
                     
                     if (e.info.isModified == true) {
                         this.featureLayer.applyEdits(null, [e.graphic], null, lang.hitch(this, function (results) {
                             this.undoManager.addUpdate(e.graphic, this.originalGraphic, this.featureLayer);
                             this.clearSelected();
                         }))                         
                     } else {
                         this.clearSelected();
                     }

                     

                 }));
                 
                 editToolbar.on("activate", lang.hitch(this, function (e) {                    
                     this.drawToolbar.deactivate();                                        
                     this.originalGraphic = e.graphic.toJson();
                     this.currentGraphic = e.graphic;
                     $(this.selectFeatureNode).hide();
                     $(this.multiSelectFeatureNode).hide();
                     $(this.defaultNode).hide();
                     $(this.cancelNode).hide();
                 }));

                 this.editToolbar = editToolbar;
                
                 var drawToolbar = new Draw(this.map);
                 drawToolbar.on("draw-end", lang.hitch(this, this._draw_end));
                 this.drawToolbar = drawToolbar;                 

                 this.createUI();
                 this.activateClick();
                 this.loaded = true;
                 this.activate();

             },

             clearSelected: function () {
                 if (this.drawToolbar) this.drawToolbar.deactivate();
                 if (this.editToolbar) this.editToolbar.deactivate();
                 this.currentGraphic = null;
                 this.originalGraphic = null;
                 this.featureLayer.clearSelection();
                 $(this.defaultNode).show();
                 $(this.selectFeatureNode).hide();
                 $(this.cancelNode).hide();
                 $(this.multiSelectFeatureNode).hide();
                 this.statusBarNode.innerHTML = "";
             },

             deactivateClick: function() {
                 connect.disconnect(this.mapClickHandler);
                 this.featureLayer.disableMouseEvents();
             },
             activateClick: function () {
                 this.mapClickHandler = this.featureLayer.on("click", lang.hitch(this, this.onClick));
                 this.featureLayer.enableMouseEvents();
             },
            
         


             onClick: function (evt) {
                 //console.debug(evt);
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

             _editAttributesSelected: function () {
                 var selected = this.featureLayer.getSelectedFeatures();
                 if (selected) this.dialog.setFeature(selected[0]);                 
             },                        

             _draw_end: function (evt) {

                 this.activateClick();
                 this.drawToolbar.deactivate();

                 // When the 
                 $(this.cancelNode).hide();

                 if (evt.geometry) {
                     if (evt.geometry.type == "extent") {
                         var query = new Query();
                         query.geometry = evt.geometry;
                         var selected = this.featureLayer.getSelectedFeatures();
                         if (selected.length > 0) {
                             this.featureLayer.selectFeatures(query, FeatureLayer.SELECTION_ADD);
                         } else {
                             this.featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW);
                         }
                         
                         
                     }
                     if (evt.geometry.type == "polygon") {
                         var attr = lang.mixin({}, this.featureLayer.templates[0].prototype.attributes);
                         var g = new Graphic(evt.geometry, null, attr)                        
                         this.featureLayer.applyEdits([g], null, null, lang.hitch(this, function (results) {
                             this.undoManager.addNew([g], this.featureLayer);
                             this.clearSelected();
                         }));                                                
                         return;
                     } else if (evt.geometry.type == "polyline") {
                         if (this.mode == "reshape") {
                             var selected = this.featureLayer.getSelectedFeatures();
                             if (selected.length != 1) {
                                 alert("You can only Split One feature at a time");
                                 return;
                             }
                             var t = selected[0];
                             this.geometryService.reshape(t.geometry, evt.geometry, lang.hitch(this, function (result) {
                                 var json = t.toJson();
                                 var g = t;
                                 g.setGeometry(result);
                                 
                                 this.featureLayer.applyEdits(null, [g], null, lang.hitch(this, function (results) {
                                     this.undoManager.addUpdate(g, json, this.featureLayer);
                                     this.clearSelected();
                                     this.featureLayer.refresh();
                                 }));                                                                  
                             }));
                         } else if (this.mode == "split") {
                             var selected = this.featureLayer.getSelectedFeatures();
                             if (selected.length != 1) {
                                 alert("You can only Split One feature at a time");
                                 return;
                             }
                             var targetGraphic = selected[0];
                             this.geometryService.cut([targetGraphic.geometry], evt.geometry, lang.hitch(this, function (results) {
                                 var adds = [];
                                 
                                 var json = targetGraphic.toJson();
                                 $.each(results.geometries, lang.hitch(this, function (i, result) {
                                     
                                     var attributes = lang.mixin({}, this.featureLayer.templates[0].prototype.attributes);
                                     var g = new Graphic(result);
                                     g.attributes = attributes;
                                     adds.push(g);
                                     
                                 }));
                                 this.featureLayer.applyEdits(adds, null, [targetGraphic], lang.hitch(this, function (results) {
                                     
                                     this.undoManager.addSplit(adds, json, this.featureLayer);
                                     this.clearSelected();
                                     this.featureLayer.refresh();
                                 }));                                                                  
                             }), function (e) { console.debug(e) });
                         }
                         
                     }
                 }

                


             },
             explode: function (feat) {

                 var layer = this.featureLayer;

                 if (!feat.geometry.rings) {
                     BootstrapDialog.alert('This feature is not the correct geometry Type!');
                     return;
                 }

                 var defmain = new Deferred();
                 var spRef = this.map.spatialReference;                 
                 var polygons = [];

                 if (feat.geometry.rings.length > 1) {
                     $.each(feat.geometry.rings, function (indx, ring) {
                         var poly = new Polygon(spRef);
                         poly.addRing(ring);
                         polygons.push(poly);                        
                     });
                 } else {
                     var poly = feat.geometry;
                     polygons.push(poly);
                 }



                 if (polygons.length > 1) {

                     this.geometryService.simplify(polygons, lang.hitch(this, function (res) {

                         var def = layer.applyEdits(null, null, [feat]);
                         def.then(lang.hitch(this, function () {
                             var i = 0; n = res.length;
                             for (i = 0; i < n; i++) {
                                 var featureAtt = layer.templates[0].prototype.attributes;
                                 var p = res[i];
                                 var feature = new Graphic(p);
                                 feature.attributes = featureAtt;
                                 var def = layer.applyEdits([feature], null, null);
                                 def.then(lang.hitch(this, function (res2) {
                                     layer.refresh();
                                     this.clearSelected();
                                 }));
                             }

                             defmain.resolve();
                         }))
                     }));

                 } else {
                     BootstrapDialog.alert('Only One Polygon Exists in Feature, Cannot Exlode Polygons!');
                     defmain.resolve();
                 }



                 return defmain.promise;

             },


             deactivate: function () {
                 if (this.loaded == true) {
                     this.drawToolbar.deactivate();
                     this.editToolbar.deactivate();
                 }
                 this.map.disableMapNavigation();
                 this.map.enablePan();
                 this.clearSelected();
                 this.deactivateClick()

                 this.emit("deactivate", {});

             },

             activate: function () {
                 this.map.disableMapNavigation();
                 this.emit("activate", {});
             },

             destroy: function () {                 
                 this.deactivate();

             }
         });
     });
