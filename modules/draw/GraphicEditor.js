define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/json",
        "dojo/_base/event",
        "dojo/_base/connect",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/_base/window",
        "dojo/Evented",
        "dojo/topic",
        "esri/toolbars/draw",
        "esri/layers/GraphicsLayer",
        "esri/geometry/Polygon",
        "esri/geometry/Polyline",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/Color", "esri/graphic",
        "modules/draw/LineSymbolEditor",
        "modules/draw/PointSymbolEditor",
        "modules/draw/PolygonSymbolEditor",
        "modules/draw/TextSymbolEditor",
          "dojo/i18n!esri/nls/jsapi",
          'dojo/_base/array', 'dojo/_base/html',
        "dojo/domReady!"],
            function (declare, lang, dojo, event, connect, dom, dc, win, Evented, topic, Draw, GraphicLayer, Polygon, Polyline,
                      SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Color, Graphic,
                      LineSymbolEditor, PointSymbolEditor, PolygonSymbolEditor, TextSymbolEditor, jsapiBundle, array,html) {
                return declare([Evented], {
                    attachTo: null,
                    node: null,
                    domnode: null,
                    map: null,
                    graphicLayer: null,
                    graphicLayerHandler: null,
                    selectGraphicLayerHandler: null,
                    drawToolbar: null,
                    mode: null,
                    uiMode: null,

                    toolbarFooter: null,
                    editDialog: null,
                    editSymbolPanel: null,
                    editDialogFooter: null,
                    currentEditor: null,
                    editors: [],
                    undoList: [],
                    redoList: null,

                    undoBtn: null,
                    redoBtn: null,
                    constructor: function(params, attachTo) {
                        this.map = params.map;
                        this.mode = Draw.POINT;

                        if (attachTo) {
                            this.node = attachTo;
                            this.domnode = $(this.node)[0];
                        } else {
                            this.node = "#map_root";
                        }

                        this.uiMode = "dojo";

                        this._createUI();
                    },

                    show: function() {
                        $(this.node).show();
                        //$(this.node).modal({
                        //    backdrop: false
                        //}).modal('show');
                    },

                    hide: function () {
                        //this.deactivate();
                        $(this.node).hide();
                        //$(this.node).modal('hide');
                    },

                    activate: function() {
                        if (this.toolbar == null) {
                            this._initToolbar();
                        }

                        var snap = this.map.enableSnapping();

                        if (this.mode == null) this.mode = Draw.POINT;

                        this.drawToolbar.activate(this.mode);

                        this.map.disableDoubleClickZoom();
                        this.map.disablePan();

                        this.graphicLayerHandler = this.graphicLayer.on("dbl-click", lang.hitch(this, this._onGraphicClick));
                        this.show();
                        this.emit("activate", {});
                    },
                    deactivate: function() {

                        if (this.drawToolbar) this.drawToolbar.deactivate();
                        this.map.enableDoubleClickZoom();
                        this.map.enablePan();
                        connect.disconnect(this.graphicLayerHandler);
                        connect.disconnect(this.selectGraphicLayerHandler);
                        //$(this.node).hide();
                        this.cleanUI();
                        this.hide();
                        this.emit("deactivate", {});
                    },

                    cleanUI: function () {
                        $(".ags-draw-editor").hide();
                        if (this.editors[0].colorControl.visible)
                            this.editors[0].colorControl._nodeClick();
                        if (this.editors[1].colorPicker.visible)
                            this.editors[1].colorPicker._nodeClick();
                        if (this.editors[2].colorPicker.visible)
                            this.editors[2].colorPicker._nodeClick();
                        if (this.editors[3].colorPicker.visible)
                            this.editors[3].colorPicker._nodeClick();
                        if (this.editors[3].outlineColorPicker.visible)
                            this.editors[3].outlineColorPicker._nodeClick();
                    },

                    _initToolbar: function() {
                        this.drawToolbar = new Draw(this.map);
                        this.drawToolbar.on("draw-end", lang.hitch(this, this._onDrawEnd));

                        this.graphicLayer = new GraphicLayer();
                        this.map.addLayer(this.graphicLayer);

                        this._onBtnClearClicked();
                    },

                    _onDrawEnd: function(evt) {
                        var g = new Graphic(evt.geometry, this.currentEditor.getSymbol());
                        this.graphicLayer.add(g);
                        this._pushUndoGraphics([g]);
                    },

                    _onGraphicClick: function(e) {
                        event.stop(e);

                        this.emit("graphic-layer-clicked", e);

                        if (this.selectGraphicLayerHandler != null) {
                            connect.disconnect(this.selectGraphicLayerHandler);
                        }

                        this.drawToolbar.deactivate();

                        $(this.editSymbolPanel).empty();
                        $(this.editDialogFooter).empty();
                        $(".ags-draw-editor").hide();
                        $(this.toolbarFooter).hide();
                        $(this.editDialog).show();

                        var cancelBtn = dc.create("button", { innerHTML: "Cancel" }, this.editDialogFooter);
                        var savebtn = dc.create("button", { innerHTML: "Apply" }, this.editDialogFooter);
                        var delBtn = dc.create("button", { innerHTML: "Remove" }, this.editDialogFooter);

                        $(cancelBtn).button().click(lang.hitch(this, function() {
                            $(".ags-draw-editor").hide();
                            $(this.editSymbolPanel).empty();
                            $(this.editDialgFooter).empty();
                        }));

                        $(delBtn).button().click(lang.hitch(this, function() {
                            $(".ags-draw-editor").hide();
                            this.graphicLayer.remove(e.graphic);
                            $(this.editSymbolPanel).empty();
                            $(this.editDialogFooter).empty();
                            $(this.toolbarFooter).show();
                        }));

                        if (e.graphic.geometry.type == "polyline") {
                            var lineUI = new LineSymbolEditor({ isSimple: false, symbol: e.graphic.symbol }, this.editSymbolPanel);
                            lineUI.startUp();
                            $(savebtn).button().click(lang.hitch(this, function() {
                                $(".ags-draw-editor").hide();
                                e.graphic.setSymbol(lineUI.getSymbol());
                                $(this.editSymbolPanel).empty();
                                $(this.editDialogFooter).empty();
                                $(this.toolbarFooter).show();
                            }));
                        }

                        if (e.graphic.geometry.type == "polygon") {
                            var lineUI = new PolygonSymbolEditor({ symbol: e.graphic.symbol }, this.editSymbolPanel);
                            lineUI.startUp();
                            $(savebtn).button().click(lang.hitch(this, function() {
                                $(".ags-draw-editor").hide();
                                e.graphic.setSymbol(lineUI.getSymbol());
                                $(this.editSymbolPanel).empty();
                                $(this.editDialogFooter).empty();
                                $(this.toolbarFooter).show();
                            }));
                        }

                        if (e.graphic.geometry.type == "point") {

                            var lineUI = (e.graphic.symbol.type == "textsymbol") ? new TextSymbolEditor({ symbol: e.graphic.symbol }, this.editSymbolPanel) : new PointSymbolEditor({ symbol: e.graphic.symbol }, this.editSymbolPanel);
                            lineUI.startUp();
                            $(savebtn).button().click(lang.hitch(this, function() {
                                $(".ags-draw-editor").hide();
                                e.graphic.setSymbol(lineUI.getSymbol());
                                $(this.editSymbolPanel).empty();
                                $(this.editDialogFooter).empty();
                                $(this.toolbarFooter).show();
                            }));
                        }
                    },

                    _changeMode: function(v) {
                        this.mode = v;

                        if (this.currentEditor.type == "text") {
                            jsapiBundle.toolbars.draw.addPoint = "Click to add text";
                        }
                        else if (this.mode == Draw.POINT) {
                            jsapiBundle.toolbars.draw.addPoint = "Click to add point";
                        } else {
                            jsapiBundle.toolbars.draw.start = "Click to begin";
                            jsapiBundle.toolbars.draw.addPoint = "Click to start line, double click to finish";
                            jsapiBundle.toolbars.draw.resume = "Click to continue" + "<br>Press <b>ALT</b> to enable snapping";
                        }

                        if (this.drawToolbar) {
                            this.drawToolbar.activate(this.mode);
                        }

                        $(this.toolbarFooter).show();

                        if (this.selectGraphicLayerHandler != null) {
                            connect.disconnect(this.selectGraphicLayerHandler);
                        }
                    },

                    _createUI: function() {
                        //(this.uiMode == "dojo") ? this.createUI_Dojo() : this._createBootStrapUI();
                        this.createUI_Dojo();
                    },

                    checkEditor: function(t) {
                        if (this.currentEditor == null) return false;
                        if (this.currentEditor.type == t) {
                            $(".ags-draw-editor").hide();
                            this.currentEditor = null;
                            this.drawToolbar.deactivate();
                            return true;
                        }
                    },

                    createToolButtonCell: function(tool, tr) {
                        var td = dc.create("button", {
                            className: "btn button-image"
                        }, tr);
                        var img = dc.create("img", {
                            className: "imgOptions",
                            title: (tool.title) ? tool.title : tool.action,
                            src: tool.src,
                            style: "padding: 3px;"
                        }, td);

                        return td;
                    },

                    createUI_Dojo: function() {
                        this.isText = false;

                        // The default for this tool is to float the panel on the page
                        //if (this.node == null) this.node = dc.create("div", { className: "ags-tool-container ags-tool-rounded-container ags-draw-toolbar" });
                        this.node = dc.create("div", { className: "" });
                        //var header = this.createHeader();                        
                        var content = dc.create("div", { className: "" }, this.node);
                        var footer = this.createFooter();

                        var tr = dc.create("div", { className: "" }, content)

                        // create the editor
                        var editMenu = dc.create("div", {}, content);

                        this.editDialog = dc.create("div", { className: "ags-draw-editor" }, editMenu);
                        this.editSymbolPanel = dc.create("div", {}, this.editDialog);
                        this.editDialogFooter = dc.create("div", {}, footer);

                        // text Tool
                        var textD = dc.create("div", { className: "ags-draw-editor" }, editMenu);
                        var textButton = this.createToolButtonCell({ action: "Add Text", title: "Add Text Element to the Map", src: "images/draw/drawtext.gif" }, tr);
                        var textUI = new TextSymbolEditor({}, textD);
                        this.editors[0] = textUI;
                        $(textButton).click(lang.hitch(this, function() {
                            if (this.checkEditor("text")) return;

                            this.cleanUI();
                            this.currentEditor = textUI;
                            textUI.show();
                            this._changeMode(Draw.POINT);
                        }));

                        var markerD = dc.create("div", { className: "ags-draw-editor" }, editMenu);
                        var markerUI = new PointSymbolEditor({}, markerD);
                        this.editors[1] = markerUI;
                        var markerButton = this.createToolButtonCell({
                            action: "Add Point",
                            title: "Add Point Element to the Map",
                            src: "images/draw/i_draw_point.png"
                        }, tr);
                        $(markerButton).click(lang.hitch(this, function() {
                            if (this.checkEditor("point")) return;

                            this.cleanUI();
                            markerUI.show();
                            this.currentEditor = markerUI;
                            this._changeMode(Draw.POINT);
                        }));

                        var lineD = dc.create("div", { className: "ags-draw-editor" }, editMenu);
                        var lineUI = new LineSymbolEditor({}, lineD);
                        this.editors[2] = lineUI;
                        var lineButton = this.createToolButtonCell({
                            action: "Add Line",
                            title: "Add Line Element to the Map",
                            src: "images/draw/i_draw_line.png"
                        }, tr);
                        $(lineButton).click(lang.hitch(this, function() {
                            if (this.checkEditor("line")) return;

                            this.cleanUI();
                            lineUI.show();
                            this.currentEditor = lineUI;
                            this._changeMode(Draw.POLYLINE);
                        }));

                        var polyD = dc.create("div", { className: "ags-draw-editor" }, editMenu);
                        var polyUI = new PolygonSymbolEditor({}, polyD);
                        this.editors[3] = polyUI;
                        var polyButton = this.createToolButtonCell({
                            action: "Add Poly",
                            title: "Add Polygon Element to the Map",
                            src: "images/draw/i_draw_poly.png"
                        }, tr);
                        $(polyButton).click(lang.hitch(this, function() {
                            if (this.checkEditor("polygon")) return;

                            this.cleanUI();
                            polyUI.show();
                            this.currentEditor = polyUI;
                            this._changeMode(Draw.POLYGON);
                        }));

                        var selectButton = this.createToolButtonCell({
                            action: "select graphic",
                            title: "Select Graphic Element to the Map",
                            src: "images/draw/i_select.png"
                        }, tr);
                        $(selectButton).click(lang.hitch(this, function () {
                            this.cleanUI();
                            this.currentEditor = null;
                            this.drawToolbar.deactivate();
                            this.selectGraphicLayerHandler = this.graphicLayer.on("click", lang.hitch(this, this._onGraphicClick));
                        }));

                        // put these in footer
                        this.toolbarFooter = dc.create("div", { className: "btn-group" }, footer);
                        

                        var undoButton = dc.create("button", {
                            innerHTML: "Undo",
                            title: "Undo Last Graphic",
                            className: "btn btn-warning"
                        }, this.toolbarFooter);
                        $(undoButton).click(lang.hitch(this, this._onBtnUndoClicked)).button();
                        this.undoBtn = undoButton;

                        var redoButton = dc.create("button", {
                            innerHTML: "Redo",
                            title: "Redo Last Graphic",
                            className: "btn btn-warning"
                        }, this.toolbarFooter);
                        $(redoButton).click(lang.hitch(this, this._onBtnRedoClicked)).button();
                        this.redoBtn = redoButton;

                        var clearButton = dc.create("button", {
                            innerHTML: "Clear",
                            title: "Clear Graphics",
                            className: "btn btn-danger"
                        }, this.toolbarFooter);
                        $(clearButton).click(lang.hitch(this, this._onBtnClearClicked)).button();

                        var resetButton = dc.create("button", {
                            innerHTML: "Disable",
                            title: "Disable the current tool",
                            className: "btn btn-danger"
                        }, this.toolbarFooter);
                        $(resetButton).click(lang.hitch(this, function () {
                            this.cleanUI();
                            this.currentEditor = null;
                            this.drawToolbar.deactivate();
                            return true;
                        })).button();

                        //$(this.node).appendTo("#map_root");
                        dc.place(this.node, "graphictoolbar");

                        $(".ags-draw-editor").hide();
                        //$(tr).buttonset();

                        //$(this.node).modal('hide');
                        $(this.node).hide();

                        


                    },

                    createHeader: function() {
                        var header = dc.create("div", { className: "panel-heading" }, this.node)
                        var closeBtn = dc.toDom("<button type='button' class='close' aria-hidden='true'></button>");
                        dc.place(closeBtn, header);
                        dc.create("h4", { className: "panel-title" }, header);
                        return header;
                    },

                    createFooter: function() {
                        return dc.create("div", { className: "panel-footer" }, this.node);
                    },

                    createButton: function() {
                    },



                _addGraphics: function (graphics) {
                    array.forEach(graphics, lang.hitch(this, function (g) {
                        this.graphicLayer.add(g);
                    }));
                },

                _removeGraphics: function (graphics) {
                    array.forEach(graphics, lang.hitch(this, function (g) {
                        this.graphicLayer.remove(g);
                    }));
                },



                _pushUndoGraphics: function(graphics){
                    this.undoList.push(graphics);
                    this._enableBtn(this.undoBtn, true);
                },

                _popUndoGraphics: function(){
                    var graphics = this.undoList.pop();
                    if(this.undoList.length === 0){
                        this._enableBtn(this.undoBtn, false);
                    }
                    return graphics;
                },

                _pushRedoGraphics: function(graphics){
                    this.redoList.push(graphics);
                    this._enableBtn(this.redoBtn, true);
                },

                _popRedoGraphics: function(){
                    var graphics = this.redoList.pop();
                    if(this.redoList.length === 0){
                        this._enableBtn(this.redoBtn, false);
                    }
                    return graphics;
                },

                _enableBtn: function(btn, isEnable){
                    if(isEnable){
                        html.removeClass(btn, 'disabled');
                    }else{
                        html.addClass(btn, 'disabled');
                    }
                },

                _disableBtnRedo: function(){
                    this._enableBtn(this.redoBtn, false);
                    this.redoList = [];
                },

                _onBtnUndoClicked: function(){
                    if(this.undoList.length === 0){
                        return;
                    }

                    var undoGraphics = this._popUndoGraphics();
                    if(undoGraphics && undoGraphics.length > 0){
                        this._pushRedoGraphics(undoGraphics);
                        this._removeGraphics(undoGraphics);
                    }
                },

                _onBtnRedoClicked: function(){
                    if(this.redoList.length === 0){
                        return;
                    }

                    var redoGraphics = this._popRedoGraphics();
                    if(redoGraphics && redoGraphics.length > 0){
                        this._addGraphics(redoGraphics);
                        this._pushUndoGraphics(redoGraphics);
                    }
                },

                _onBtnClearClicked: function(){
                    this.undoList = [];
                    this.redoList = [];
                    this._enableBtn(this.redoBtn, false);
                    this._enableBtn(this.undoBtn, false);
                    this.graphicLayer.clear();
                }






                });
            });