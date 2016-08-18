
//STYLE_DASH	The line is made of dashes.
//STYLE_DASHDOT	The line is made of a dash-dot pattern.
//STYLE_DASHDOTDOT	The line is made of a dash-dot-dot pattern.
//STYLE_DOT	The line is made of dots.
//STYLE_LONGDASH	Line is constructed of a series of dashes.
//STYLE_LONGDASHDOT	Line is constructed of a series of short dashes.
//STYLE_NULL	The line has no symbol.
//STYLE_SHORTDASH	Line is constructed of a series of short dashes.
//STYLE_SHORTDASHDOT	Line is constructed of a dash followed by a dot.
//STYLE_SHORTDASHDOTDOT	Line is constructed of a series of a dash and two dots.
//STYLE_SHORTDOT	Line is constructed of a series of short dots.
//STYLE_SOLID

define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/json",
        "dojo/dom-construct",
        "dojo/Evented",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/Color",
        "esri/dijit/editing/TemplatePicker",
        "modules/draw/ColorPicker"        
],
            function (declare, lang, dojo, dc, Evented, SimpleMarkerSymbol, SimpleLineSymbol, Color, TemplatePicker, ColorPicker) {
                return declare([Evented], {
                    type: null,
                    colors: null,
                    widths: null,
                    node: null,                    
                    templatePicker: null,
                    colorPicker: null,                    
                    templateDiv: null,
                    sizeControl: null,
                    loaded: null,
                    targetSymbol: null,
                    mode: null, 
                    templateParams: null,
                    constructor: function (params, attachTo) {
                        this.node = attachTo;
                        this.type = "line";

                        if (this.node == undefined) {
                            return;
                        }

                        if (params.symbol != undefined) this.targetSymbol = params.symbol;

                        if (this.targetSymbol == null) {
                            this.targetSymbol = new SimpleLineSymbol().setWidth(2).setColor(new Color("black"));
                        }
                        
                        this.mode = "table";
                        if (params.mode) this.mode = params.mode;
                        if (this.mode == "table") {
                            this._createUITable();
                            this.colors = ["black"];
                            this.widths = [1];
                            this.templateParams = { rows: "4", columns: "1", style: "height: 50px" };
                        } else if (this.mode == "gallery") {
                            this._createUIGallery();
                            this.colors = ["black", "blue", "gray", "green", "maroon", "navy", "orange", "purple", "red"];
                            this.widths = [1, 3];
                            this.templateParams = { rows: "4", columns: "auto", style: "height: 200px" };
                        }
                        
                        this.loaded = false;
                    },

                    startUp: function () {

                        if (this.templateDiv) {                                                   

                            this.templateParams.items = this._getDefaultSymbols();                            
                            var templatePicker = new TemplatePicker(this.templateParams, this.templateDiv);

                            if (this.mode == "gallery"){
                                templatePicker.on("selection-change", lang.hitch(this, this._onChange));
                            }
                            
                            this.templatePicker = templatePicker;
                            this.templatePicker.startup();
                        }
                        this.loaded = true;
                    },

                    _onChange: function() {
                        if (this.templatePicker.getSelected()) {
                            var selected = this.templatePicker.getSelected();
                            this.targetSymbol = selected.item.symbol;
                            $(this.sizeControl).val(this.targetSymbol.width);
                            $(this.colorPicker.val(this.targetSymbol.color.toHex()));
                        }

                    },

                    //_onControlChange: function() {

                    //    var symbol = this.getSymbol();
                        
                    //    this.templatePicker.destroy();
                    //    var templatePicker = new TemplatePicker({
                    //        items: [symbol],
                    //        rows: "auto", style: "height: 50px",
                    //        columns: "auto"
                    //    }, this.templateDiv);

                    //    templatePicker.on("selection-change", lang.hitch(this, this._onChange));

                    //    this.templatePicker = templatePicker;
                    //    this.templatePicker.startup();

                    //},



                    _createGalleryUI: function () {
                        var d = dc.create("div", { className: "ags-container" }, this.node);                                                
                        var markerSelect = dc.create("div", {}, d);                       
                        this.templateDiv = markerSelect;                                               
                    },

                    _createFormGroup: function () {
                        
                        var d = dc.create("div", { className: "ags-container" }, this.node);                       
                        var f = dc.create("form", {
                            className: "form",
                            role: "form",
                            action: "javascript:void(0);"
                        }, d);
                           
                        var d1 = dc.create("div", { className: "form-group" }, d); 
                        var l1 = dc.create("label", { className: "col-md-3 control-label", innerHTML: "Line Type: " }, d1);                                               
                        this.colorPicker = dc.create("input", { type: 'color', value: "#ffffff" }, d1);

                       
                        var d1 = dc.create("div", { className: "form-group" }, d);
                        var l1 = dc.create("label", { className: "col-md-3 control-label", innerHTML: "Width: " }, d1);
                        var input = dc.toDom("<input type='number' value='3' min='1' max='20' step='1' size='2'/>");
                        dc.place(input, d1);
                        this.sizeControl = input;

                        this.bindTo();
                        
                    },

                    bindTo: function (g) {
                        var symbol = this.targetSymbol;

                        if (symbol != null) {
                            $(this.sizeControl).val(parseInt(symbol.width));
                            $(this.colorPicker).val(symbol.color.toHex());                           
                        }

                    },

                   

                    _createUITable: function () {

                        var d = dc.create("div", { className: "ags-container" }, this.node);

                        this.templateDiv  = dc.create("div", {}, d);                        

                        var table = dc.create("table", { style: "width: 100%"}, d);                            
                        
                        var tr1 = dc.create("tr", {}, table);                        
                        var d1 = dc.create("td", { innerHTML: "Color" }, tr1);
                        var td2 = dc.create("td", {}, tr1);
                        var cpnode = dc.create("div", {}, td2);
                        this.colorPicker = new ColorPicker({ color: [255, 255, 255, 0] }, cpnode);

                        // ESRI Color Widget
                        //var cpnode = dc.create("div", {}, td2);
                        //this.colorPicker = new SymbolStyler({}, cpnode);


                        // HTML5 Color
                        //this.colorPicker = dc.create("input", { type: 'color', value: "#ffffff" }, td2);

                        var tr1 = dc.create("tr", {}, table);
                        var d1 = dc.create("td", { innerHTML: "Width" }, tr1);
                        var td2 = dc.create("td", {}, tr1);
                        var input = dc.toDom("<input type='number' value='3' min='1' max='100' step='1' style='width: 100%'/>");
                        dc.place(input, td2);
                        this.sizeControl = input;

                        var symbol = this.targetSymbol;

                        if (symbol != null) {
                            $(this.sizeControl).val(symbol.width);
                            this.colorPicker.setColor(symbol.color);
                        }

                        //$(this.sizeControl).click(lang.hitch(this, this._onControlChange));
                        //$(this.colorPicker).change(lang.hitch(this, this._onControlChange));

                    },

                    _getDefaultSymbols: function () {
                        var results = [];

                        var colors = this.colors;
                        var widths = this.widths;
                       
                        var ic = colors.length;
                        var nw = widths.length;
                        var ct = 0;
                        var indx;
                        while (ct < ic) {

                            var i = 0;
                            for (i = 0; i < nw; i++) {

                                indx++;
                                var col = Color.fromString(colors[ct]);
                                var w = widths[i];
                                var ls = new SimpleLineSymbol().setWidth(w).setColor(col);
                                results.push({ symbol: ls, type: ls.type, name: "line " + indx });

                            }

                            ct++;
                        }                                           

                        return results;

                    },

                    show: function () {

                        $(this.node).show();
                        if (this.loaded == false) this.startUp();

                    },

                    showDialog: function(g) {

                        this.startUp();                        
                                             
                    },

                                     
                    getSymbol: function () {
                        var symbol = this.targetSymbol;
                        if (this.sizeControl) {
                            this.size = $(this.sizeControl).val(); 
                            this.color = this.colorPicker.color;
                            console.debug(this.color);
                            if (this.templatePicker) {
                                var selected = this.templatePicker.getSelected();
                                if (!selected) {
                                    symbol.setColor(this.color).setWidth(this.size);                           
                                } else {
                                    symbol = selected.item.symbol;
                                    symbol.setColor(this.color).setWidth(this.size);                            
                                }
                            } else {
                                symbol.setColor(this.color).setWidth(this.size);
                            }
                            
                        }                        
                        return symbol;                       
                    }

                })
            });

