define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Evented",
    "esri/map",
    "esri/tasks/GeometryService",
    "esri/toolbars/draw",
    "esri/toolbars/edit",
    "esri/graphic",
    "esri/config",

    "esri/layers/GraphicsLayer",
    "esri/geometry/Polygon",
    "esri/SpatialReference",
     "esri/renderers/SimpleRenderer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
     "esri/Color",
  
    "modules/ncfs/AttributeEditor",
    "modules/ncfs/GraphicsUndoManager",
  
    "dojo/_base/array",
    "dojo/_base/event",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/parser",  
    "dojo/_base/connect",
    "dojo/i18n!esri/nls/jsapi"
],
     function (declare, lang, Evented,
        Map, GeometryService, Draw, Edit, Graphic, esriConfig,
        GraphicLayer, Polygon, SpatialReference, SimpleRenderer,
        SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color,
        AttributeEditor,GraphicsUndoManager,
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
             cancelNode: null,
             editNode: null,
             selectFeatureNode: null,

             operationsNode: null,
            
            
             graphicLayer: null,
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
                 if (options.fields) this.editableFields = options.fields;
                 this.loaded = false;
                 this.visible = true;
             }, // end constructor

             createUI: function () {                
                 this.selectFeatureNode = dc.create("div", {
                     style: "display:none"
                 }, this.node);


                 
                
                 this.editNode = dc.create("div", {}, this.node);
                 this.cancelNode = dc.create("div", {}, this.node);

                 var canbutton = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Cancel"
                 }, this.cancelNode);
                 $(canbutton).click(lang.hitch(this, this._cancelSelected));
                 $(this.cancelNode).hide();

                 var tb = dc.create("div", {}, this.editNode);

                 // create the edit toolbar when you select the feature
                 var tb2 = dc.create("div", {}, this.selectFeatureNode);

                 var canbutton = dc.create("button", {
                     className: "btn btn-default", innerHTML: "UnSelect"
                 }, tb2);
                 $(canbutton).click(lang.hitch(this, this._cancelSelected));

                 var delbutton = dc.create("button", {
                     className: "btn btn-danger", innerHTML: "Delete"
                 }, tb2);
                 this.deleteButton = delbutton;
                
                 $(delbutton).click(lang.hitch(this, this._deleteSelected));
                 
                 if (this.editableFields.length > 0) {
                     
                        this.dialog = new AttributeEditor({ fields: this.editableFields })

                        var attrbutton = dc.create("button", {
                            className: "btn btn-warning", innerHTML: "Edit Attributes"
                        }, tb2);                 
                        $(attrbutton).click(lang.hitch(this, this._editAttributesSelected));
                 }

                 var reshapeButton = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Reshape"
                 }, tb2);
                 $(reshapeButton).click(lang.hitch(this, function () {
                     this.deactivateClick();
                     this.targetGraphic = this.currentGraphic;
                     this.targetGeometry = this.currentGraphic.geometry;
                     this.editToolbar.deactivate();
                     this.drawToolbar.activate(Draw.POLYLINE);
                     this.mode = "reshape";
                     $(this.editNode).hide();
                     $(this.cancelNode).show();
                 }));

                 var splitButton = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Split"
                 }, tb2);
                 $(splitButton).click(lang.hitch(this, function () {
                     this.deactivateClick();
                     this.targetGraphic = this.currentGraphic;
                     this.targetGeometry = this.currentGraphic.geometry;
                     this.editToolbar.deactivate();
                     this.drawToolbar.activate(Draw.POLYLINE);
                     this.mode = "split";
                     $(this.editNode).hide();
                     $(this.cancelNode).show();
                 }));


                 // end Section ------------------------


                 // Deactivate Button
                 var finBtn = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Deactivate Editing"
                 }, tb);
                 $(finBtn).click(lang.hitch(this, function () {                     
                     if (this.drawToolbar) this.drawToolbar.deactivate();
                     if (this.editToolbar) this.editToolbar.deactivate();
                     $(this.selectFeatureNode).hide();
                 }));

                 var addBtn = dc.create("button", {
                     className: "btn btn-default", innerHTML: "Add"
                 }, tb);
                 $(addBtn).click(lang.hitch(this,function () {
                     this.drawToolbar.activate(Draw.POLYGON);
                 }));

                 

                 // end Section ------------------------
                 this.operationsNode = dc.create("div", {
                     className: "centered"
                 }, this.node);

                 this.undoManager = new GraphicsUndoManager({
                     graphicLayer: this.graphicLayer
                 }, this.operationsNode);

                    
             },
            
             _cancelSelected: function () {
                 
                 if (this.drawToolbar) this.drawToolbar.deactivate();
                 if (this.editToolbar) this.editToolbar.deactivate();
                 this.currentGraphic = null;
                 this.originalGraphic = null;
             },

             

             _deleteSelected: function () {
                 if (this.currentGraphic == null) {                                      
                     return;
                 }
                 this.graphicLayer.remove(this.currentGraphic);
                 this.undoManager.addDelete([this.currentGraphic], this.graphicLayer);
                 this.editToolbar.deactivate();
                 this.editingEnabled = false;
             },
             

             startup: function () {
                 // Initilize the edit toolbar
                 var editToolbar = new Edit(this.map);
                 editToolbar.on("deactivate", lang.hitch(this, function (e) {                                                            
                     
                     if (e.info.isModified == true) {                         
                         this.undoManager.addUpdate(e.graphic, this.originalGraphic, this.graphicLayer);
                     }

                     this.currentGraphic = null;
                     this.originalGraphic = null;
                    
                     $(this.editNode).show();
                     $(this.selectFeatureNode).hide();
                     $(this.cancelNode).hide();

                 }));
                 
                 editToolbar.on("activate", lang.hitch(this, function (e) {
                     this.drawToolbar.deactivate();
                     $(this.cancelNode).hide();
                     $(this.selectNode).hide();
                     $(this.editNode).hide();
                     $(this.selectFeatureNode).show();
                    
                     this.originalGraphic = e.graphic.toJson();
                     this.currentGraphic = e.graphic;
                 }));

                 this.editToolbar = editToolbar;
                
                 var drawToolbar = new Draw(this.map);
                 drawToolbar.on("draw-end", lang.hitch(this, this._draw_end));
                 this.drawToolbar = drawToolbar;                 

                 this.graphicLayer = new GraphicLayer();
                 
                 var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID).setColor([255, 255, 255, 0.1]).setOutline(new SimpleLineSymbol().setColor(new Color([255, 0, 0])).setWidth(3));
                 var renderer = new SimpleRenderer(symbol);
                 this.graphicLayer.setRenderer(renderer);
             
                 this.map.addLayer(this.graphicLayer);
    
                 this.createUI();
                 this.activateClick();
                 this.loaded = true;
                 this.activate();

             },

             deactivateClick: function() {
                 connect.disconnect(this.mapClickHandler);
             },
             activateClick: function () {
                this.mapClickHandler = this.graphicLayer.on("click", lang.hitch(this, this.onClick));
             },

             setFeatures: function(features){
                 var spRef = this.map.spatialReference;
                 var gl = this.graphicLayer;

                 var attr = this.editableFields;

                 $.each(features, function (indx, feature) {
                     var geo = feature.geometry;
                     $.each(geo.rings, function (i, ring) {
                         //console.debug(ring);
                         var poly = new Polygon(spRef);
                         poly.addRing(ring);
                         var newfeature = new Graphic(poly);
                         gl.add(newfeature);

                         if (attr.length > 0) {
                             newfeature.attributes = {};
                             $.each(attr, function (x, y) {
                                 newfeature.attributes[y.name] = feature.attributes[y.name];
                             });
                         }


                     });
                 });

             },

             _setNewAttributes: function(newfeature, feature){                 
                 var attr = this.editableFields;
                 if (attr.length == 0) return;
                 if (attr.length > 0) {
                     newfeature.attributes = {};
                     $.each(attr, function (x, y) {
                         if (feature != undefined) {
                             newfeature.attributes[y.name] = feature.attributes[y.name];
                         } else {
                             newfeature.attributes[y.name] = "";
                         }                         
                     });
                 }
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
                 $(this.selectFeatureNode).show();
                 $(this.editNode).hide();                 

             },

             _editAttributesSelected: function () {

                 this.dialog.setFeature(this.currentGraphic);                 
             },                        

             _draw_end: function (evt) {

                 this.activateClick();
                 this.drawToolbar.deactivate();

                 $(this.editNode).show();
                 $(this.selectFeatureNode).hide();
                 $(this.cancelNode).hide();

                 if (evt.geometry) {
                     if (evt.geometry.type == "polygon") {
                         var g = new Graphic(evt.geometry);
                         this.graphicLayer.add(g);
                         this._setNewAttributes(g);
                         this.undoManager.addNew([g], this.graphicLayer);
                         return;
                     } else if (evt.geometry.type == "polyline") {
                         if (this.mode == "reshape") {
                             this.geometryService.reshape(this.targetGeometry, evt.geometry, lang.hitch(this,  function(result){
                                 var g = new Graphic(result);
                                 this.graphicLayer.add(g);
                                 this._setNewAttributes(g, this.targetGraphic);
                                 this.graphicLayer.remove(this.targetGraphic);
                                 this.undoManager.addUpdate(g, this.targetGraphic.toJson(), this.graphicLayer);
                             }));
                         } else if (this.mode == "split") {
                             this.geometryService.cut([this.targetGeometry], evt.geometry, lang.hitch(this, function (results) {

                                 var adds = [];
                                 $.each(results.geometries, lang.hitch(this, function (i, result) {
                                     var g = new Graphic(result);                                     
                                     this.graphicLayer.add(g);
                                     this._setNewAttributes(g, this.targetGraphic);
                                     adds.push(g);
                                 }));                                 
                                 this.graphicLayer.remove(this.targetGraphic);
                                 this.undoManager.addSplit(adds, [this.targetGraphic], this.graphicLayer);
                             }), function (e) { console.debug(e) });
                         }
                         
                     }
                 }

                


             },


             

             












             deactivate: function () {
                 if (this.loaded == true) {
                     this.drawToolbar.deactivate();
                     this.editToolbar.deactivate();
                 }
                 this.map.disableMapNavigation();
                 this.map.enablePan();

                 connect.disconnect(this.mapClickHandler);

                 this.emit("deactivate", {});

             },

             activate: function () {
                 this.map.disableMapNavigation();
                 this.emit("activate", {});
             },

             destroy: function () {

                 this.map.removeLayer(this.graphicLayer);
                 this.deactivate();

             }
         });
     });
