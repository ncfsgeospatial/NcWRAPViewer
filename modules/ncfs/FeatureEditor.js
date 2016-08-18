define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Evented",
    "esri/map",
    "esri/toolbars/draw",
    "esri/toolbars/edit",
    "esri/graphic",
    "esri/config",

    "esri/layers/FeatureLayer",

    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",

    "esri/dijit/editing/TemplatePicker",

    "dojo/_base/array",
    "dojo/_base/event",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/parser",
    "dijit/registry",
    "dojo/_base/connect",
    "dojo/i18n!esri/nls/jsapi",
    "modules/ncfs/UndoManager"
],
     function (declare, lang, Evented,
        Map, Draw, Edit, Graphic, esriConfig,
        FeatureLayer,
        SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
        TemplatePicker,
        arrayUtils, event, dc, dom, parser, registry, connect, jsapiBundle,
        UndoManager
      ) {
         return declare([Evented], {
             map: null,
             node: null,
             templatePickerNode: null,
             deleteButton: null,
             cancelButton: null,
             visible: null,
             tractid: null,
             drawToolbar: null,
             editToolbar: null,
             currentLayer: null,
             currentGraphic: null,
             originalGraphic: null,
             loadHandler: null,
             selectedTemplate: null,
             templatePicker: null,
             editingEnabled: null,
             editableLayers: null,
             loaded: null,
             selectNode: null,
             editNode: null,
             selectFeatureNode: null,
             undoManager: null,

             constructor: function (options, attachTo) {
                 this.map = options.map;
                 this.tractid = options.tractid;
                 this.node = attachTo;
                 this.createUI();

                 this.loadHandler = this.map.on("layers-add-result", lang.hitch(this, this._layers_loaded));
                 var tractid = this.tractid;
                 var layers = [];
                 var url = options.url;

                 $.each(options.sublayers, function (indx, item) {
                     var itemUrl = url + "/" + item.layerid;
                     var layer = new FeatureLayer(itemUrl, {
                         mode: FeatureLayer.MODE_ONDEMAND,
                         outFields: ["*"],
                         id: item.id,
                         opacity: 0.75,
                         visible: true
                     });
                     layer.setDefinitionExpression("tract_id = " + tractid);
                     layers.push(layer);
                 });

                 this.map.addLayers(layers);
                 this.loaded = false;
                 this.visible = true;
             }, // end constructor

             createUI: function () {
                 this.selectNode = dc.create("div", {}, this.node);
                 this.selectFeatureNode = dc.create("div", {
                     style: "display:none"
                 }, this.node);

                 this.templatePickerNode = dc.create("div", {}, this.selectNode);
                 this.editNode = dc.create("div", {}, this.node);

                 var tb = dc.create("div", {}, this.editNode);


                 // create the edit toolbar when you select the feature
                 var tb2 = dc.create("div", {}, this.selectFeatureNode);

                 var delbutton = dc.create("button", {
                     className: "btn btn-danger disabled", innerHTML: "Delete"
                 }, tb2);
                 this.deleteButton = delbutton;

                 var canbutton = dc.create("button", {
                     className: "btn btn-default when-selected", innerHTML: "Cancel"
                 }, tb2);
                 $(canbutton).click(lang.hitch(this, this._cancelSelected));

                 var savebutton = dc.create("button", {
                     className: "btn btn-default when-selected", innerHTML: "Save"
                 }, tb2);
                 $(savebutton).click(lang.hitch(this, function () {
                     this.editToolbar.deactivate();
                 }));
                 $(delbutton).click(lang.hitch(this, this._deleteSelected));
                 // end Section ------------------------


                 // Deactivate Button
                 var finBtn = dc.create("button", {
                     className: "btn btn-default when-selected", innerHTML: "Deactivate Editing"
                 }, tb);
                 $(finBtn).click(lang.hitch(this, function () {
                     this.templatePicker.clearSelection();
                     if (this.drawToolbar) this.drawToolbar.deactivate();
                     if (this.editToolbar) this.editToolbar.deactivate();
                     $(this.selectNode).show();
                     $(this.editNode).hide();
                     $(this.selectFeatureNode).hide();
                 }));

                 var b = dc.create("button", {
                     className: "btn btn-default",
                     type: "button",
                     title: "Enable Map Navigation",
                     innerHTML: "Enable Map Navigation"
                 }, tb);
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

                 // end Section ------------------------


                 var undoRedoToolbar = dc.create("div", { className: "centered" }, this.node);
                 this.undoManager = new UndoManager({}, undoRedoToolbar);


                 $(this.editNode).hide();
             },

             _cancelSelected: function () {
                 this._disableDeleteButton();
                 this.currentGraphic = null;
                 this.currentLayer = null;
                 this.originalGraphic = null;
                 if (this.drawToolbar) this.drawToolbar.deactivate();
                 if (this.editToolbar) this.editToolbar.deactivate();
             },

             _disableDeleteButton: function () {
                 $(this.deleteButton).addClass("disabled");
             },

             _deleteSelected: function () {
                 if (this.currentGraphic == null) {
                     $(this.deleteButton).addClass("disabled");
                     alert("oops no current grap");
                     return;
                 }
                 if (this.currentLayer == null) {
                     $(this.deleteButton).addClass("disabled");
                     alert("oops no curent layer");
                     return;
                 }

                 if (this.currentLayer != this.currentGraphic._graphicsLayer) {
                     $(this.deleteButton).addClass("disabled");
                     alert("oops not the same layer");
                     return;
                 }

                 this.currentLayer.applyEdits(null, null, [this.currentGraphic]);
                 this.undoManager.addDelete([this.currentGraphic], this.currentLayer);
                 this.editToolbar.deactivate();
                 this.editingEnabled = false;
             },
             _layers_loaded: function (evt) {
                 connect.disconnect(this.loadHandler);
                 this.currentLayer = null;
                 this.editingEnabled = false;
                 // get the actual feature layers                     
                 var layers = arrayUtils.map(evt.layers, function (result) {
                     return result.layer;
                 });

                 this.editableLayers = layers;

                 //this.startUp();
             },

             startUp: function () {
                 // Initilize the edit toolbar
                 var editToolbar = new Edit(this.map);
                 editToolbar.on("deactivate", lang.hitch(this, function (e) {
                     if (e.info.isModified) {
                         this.currentLayer.applyEdits(null, [e.graphic], null);
                         this.undoManager.addUpdate(e.graphic, this.originalGraphic, this.currentLayer);
                     }
                     this.currentLayer = null;
                     this.currentGraphic = null;
                     this.originalGraphic = null;

                     $(this.selectNode).show();
                     $(this.editNode).show();
                     $(this.selectFeatureNode).hide();

                 }));
                 editToolbar.on("activate", lang.hitch(this, function (e) {
                     this.drawToolbar.deactivate();
                     $(this.selectNode).hide();
                     $(this.editNode).hide();
                     $(this.selectFeatureNode).show();
                     this.originalGraphic = e.graphic.toJson();

                 }));

                 this.editToolbar = editToolbar;

                 var layers = this.editableLayers;
                 var il = layers.length;
                 var i = 0;
                 for (i = 0; i < il; i++) {
                     var layer = layers[i];
                     this._initLayer(layer);
                 };
                 var drawToolbar = new Draw(this.map);
                 drawToolbar.on("draw-end", lang.hitch(this, this._draw_end));
                 this.drawToolbar = drawToolbar;

                 var templatePicker = new TemplatePicker({
                     featureLayers: layers,
                     rows: "auto",
                     columns: 3,
                     style: "height: auto; overflow: auto; max-height: 300px"
                 }, this.templatePickerNode);
                 templatePicker.startup();
                 this.templatePicker = templatePicker;

                 this.selectedTemplate = null;
                 templatePicker.on("selection-change", lang.hitch(this, this._template_changed));
                 this.loaded = true;
                 this.activate();
             },

             _initLayer: function (layer) {
                 this.editingEnabled = false;
                 layer.on("dbl-click", lang.hitch(this, this._layer_dbl_clicked));
                 layer.on("click", lang.hitch(this, this._layer_clicked));
                 layer.setDefinitionExpression("tract_id=" + this.tractid);
             },

             _layer_dbl_clicked: function (evt) {
                 event.stop(evt);
                 //console.debug(evt);
                 this.currentGraphic = evt.graphic;
                 this.currentLayer = evt.graphic._graphicsLayer;

                 if (this.editingEnabled === false) {
                     this.editingEnabled = true;
                     $(this.deleteButton).removeClass("disabled");
                     if (evt.graphic.geometry.type != "point") {
                         this.editToolbar.activate(Edit.EDIT_VERTICES, evt.graphic);
                     } else {
                         this.editToolbar.activate(Edit.MOVE, evt.graphic);
                     }
                 } else {
                     this.editToolbar.deactivate();
                     this.editingEnabled = false;
                 }
             },

             _layer_clicked: function (evt) {
                 //console.debug(evt);
                 event.stop(evt);
                 var layer = evt.graphic._graphicsLayer;
                 if (evt.ctrlKey === true || evt.metaKey === true) {  //delete feature if ctrl key is depressed
                     layer.applyEdits(null, null, [evt.graphic]);
                     this.undoManager.addDelete(evt.graphic, layer);
                     this.currentLayer = this;
                     this.editToolbar.deactivate();
                     this.editingEnabled = false;
                 }
             },

             _template_changed: function () {
                 if (this.templatePicker.getSelected()) {
                     this.selectedTemplate = this.templatePicker.getSelected();
                 }

                 jsapiBundle.toolbars.draw.start = "Click to begin";
                 jsapiBundle.toolbars.draw.addPoint = "Click to start line, double click to finish";
                 jsapiBundle.toolbars.draw.resume = "Click to continue" + "<br>Press <b>ALT</b> to enable snapping";

                 switch (this.selectedTemplate.featureLayer.geometryType) {
                     case "esriGeometryPoint":
                         jsapiBundle.toolbars.draw.addPoint = "Click to add features";
                         this.drawToolbar.activate(Draw.POINT);
                         break;
                     case "esriGeometryPolyline":
                         this.drawToolbar.activate(Draw.POLYLINE);
                         break;
                     case "esriGeometryPolygon":
                         this.drawToolbar.activate(Draw.POLYGON);
                         break;
                 }
                

                 this._disableDeleteButton();
                 this.currentGraphic = null;
                 this.currentLayer = null;

                 //$(this.selectNode).hide();
                 $(this.editNode).show();
             },

             _draw_end: function (evt) {
                 var newAttributes = lang.mixin({}, this.selectedTemplate.template.prototype.attributes);

                 // add the tract id
                 var d = new Date();
                 newAttributes.tract_id = this.tractid;
                 newAttributes.date_created = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
                 var newGraphic = new Graphic(evt.geometry, null, newAttributes);
                 this.selectedTemplate.featureLayer.applyEdits([newGraphic], null, null);
                 this.undoManager.addNew([newGraphic], this.selectedTemplate.featureLayer);

                 //this.map.enablePan();

                 //$(this.selectNode).hide();
                 //$(this.editNode).show();
             },

             deactivate: function () {
                 if (this.loaded == true) {
                     this.drawToolbar.deactivate();
                     this.editToolbar.deactivate();
                 }
                 //this.map.disableMapNavigation();

                 if (this.editableLayers) {
                     $.each(this.editableLayers, function (indx, layer) {
                         if (layer.enableMouseEvents) {
                             layer.enableMouseEvents();
                         }
                         
                     });
                 }
                 

                 this.emit("deactivate", {});
             },

             activate: function () {
                 //this.map.disableMapNavigation();

                 if (this.editableLayers) {
                     $.each(this.editableLayers, function (indx, layer) {
                         if (layer.enableMouseEvents) {
                             layer.enableMouseEvents();
                         }
                     });
                 }
                 this.emit("activate", {});
             }
         });
     });
