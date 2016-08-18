
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
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/Color",
        "esri/dijit/editing/TemplatePicker",
        "modules/draw/ColorPicker"


],
            function (declare, lang, dojo, dc, Evented, SimpleFillSymbol, SimpleLineSymbol, Color, TemplatePicker, ColorPicker) {
                return declare([Evented], {
                    type: null,
                    colors: null,
                    widths: null,
                    node: null,
                    templatePicker: null,
                    colorPicker: null,
                    outlineColorPicker: null,
                    templateDiv: null,
                    sizeControl: null,
                    loaded: null,
                    targetSymbol: null,
                    mode: null,
                    constructor: function (params, attachTo) {
                        this.node = attachTo;
                        this.type = "polygon";
                        this.targetSymbol = new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(2)).setColor(new Color("#000000"));
                        

                        if (params.symbol != undefined) this.targetSymbol = params.symbol;

                        this.mode = "table";
                        if (params.mode) this.mode = params.mode;
                        if (this.mode == "table") {
                            this._createUITable();
                            this.colors = ["black"];
                            this.widths = [1];
                        } else if (this.mode == "gallery") {
                            this._createUIGallery();
                            this.colors = ["black", "blue", "gray", "green", "maroon", "navy", "orange", "purple", "red"];
                            this.widths = [1, 3];
                        }
                       
                        this.loaded = false;
                    },

                    startUp: function () {
                        

                        if (this.templateDiv) {                        
                            var defaultMarkers = this._getDefaultSymbols();
                            var templatePicker = new TemplatePicker({
                                items: defaultMarkers,
                                rows: "auto", style: "height: 50px",
                                columns: "auto"
                            }, this.templateDiv);
                            templatePicker.on("selection-change", lang.hitch(this, this._onChange));

                            this.templatePicker = templatePicker;
                            this.templatePicker.startup();
                        }
                        this.loaded = true;
                    },

                    _onChange: function () {
                        if (this.templatePicker.getSelected()) {
                            var selected = this.templatePicker.getSelected();
                            this.targetSymbol = selected.item.symbol;
                            //$(this.sizeControl).val(this.targetSymbol.width);
                            //$(this.colorPicker.setColor(this.targetSymbol.color));

                        }

                    },

                    _createUITable: function () {

                        var d = dc.create("div", { className: "ags-container" }, this.node);

                        this.templateDiv = dc.create("div", {}, d);

                        var table = dc.create("table", { style: "width: 100%" }, d);

                        var tr1 = dc.create("tr", {}, table);
                        var tr2 = dc.create("tr", {}, table);


                        var d1 = dc.create("td", { innerHTML: "Fill <br/> Color" }, tr1);
                        var td2 = dc.create("td", {}, tr2);
                        //this.colorPicker = dc.create("input", { type: 'color', value: "#000000" }, td2);
                        var cpnode = dc.create("div", {}, td2);
                        this.colorPicker = new ColorPicker({ color: [255, 255, 255, 0] }, cpnode);

                        var d1 = dc.create("td", { innerHTML: "Outline <br/> Width" }, tr1);
                        var td2 = dc.create("td", {}, tr2);
                        var input = dc.toDom("<input type='number' value='3' min='1' max='20' step='1' style='width:50px'/>");
                        dc.place(input, td2);
                        this.sizeControl = input;

                        var d1 = dc.create("td", { innerHTML: "Outline <br/> Color" }, tr1);
                        var td2 = dc.create("td", {}, tr2);
                        //this.outlineColorPicker = dc.create("input", { type: 'color', value: "#000000" }, td2);
                        var cpnode = dc.create("div", {}, td2);
                        this.outlineColorPicker = new ColorPicker({ color: [255, 255, 255, 0] }, cpnode);

                        this.bindTo();
                        
                        //$(this.sizeControl).click(lang.hitch(this, this._onControlChange));
                        //$(this.colorPicker).change(lang.hitch(this, this._onControlChange));

                    },

                    bindTo: function(g){
                        var symbol = this.targetSymbol;

                        if (symbol != null) {
                            $(this.sizeControl).val(parseInt(symbol.outline.width));
                            this.colorPicker.setColor(symbol.color);
                            this.outlineColorPicker.setColor(symbol.outline.color);
                        }

                    },


                    _createUIGallery: function () {
                       
                        var d = dc.create("div", { className: "ags-container" }, this.node);
                        var markerSelect = dc.create("div", {}, d);
                        this.templateDiv = markerSelect;
                      
                    },

                    _createUI: function () {
                        var d = $("<div class='ags-container'>");
                        $(d).appendTo(this.node);
                        var f = $("<form class='form-horizontal' role='form' action='javascript:void(0);'>");
                        $(d).append(f);
                        var d1 = $("<div class='form-group'>");

                        var l1 = $("<label class='control-label'>");
                        $(l1).html("Fill Type:").appendTo(d1);
                        var markerSelect = $("<div>");
                        $(d1).append(markerSelect).appendTo(f);
                        this.markerDiv = markerSelect[0];

                        d1 = $("<div class='form-group'>");
                        l1 = $("<label class='control-label'>");
                        $(l1).text("Select Fill Color:");
                        $(d1).appendTo(f).append(l1);
                        var cp = new ColorPicker({}, d1);
                        this.colorPicker = cp;

                        d1 = $("<div class='form-group'>");
                        l1 = $("<label class='control-label'>");
                        $(l1).text("Select Outline Color:");
                        $(d1).appendTo(f).append(l1);
                        var cp = new ColorPicker({}, d1);
                        this.outlineColorPicker = cp;

                        d1 = $("<div class='form-group'>");
                        l1 = $("<label class='control-label'>");
                        $(l1).text("Select Outline Line Width:");
                        $(d1).appendTo(f).append(l1);

                        var select = $("<select class='form-control'>");
                        var i = 1; n = 20;
                        for (i = 6; i <= n; i++) {
                            var opt = $("<option>");
                            $(opt).val(i).text(i).appendTo(select);
                        };
                        $(d1).append(select);
                        this.sizeControl = select;
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
                            var col = Color.fromString(colors[ct]);
                            for (i = 0; i < nw; i++) {

                                indx++;
                                
                                var w = widths[i];

                                var ls = new SimpleFillSymbol().setColor(col).setStyle(SimpleFillSymbol.STYLE_NULL).setOutline(new SimpleLineSymbol().setColor(col).setWidth(w));
                                results.push({ symbol: ls, type: ls.type, name: "line " + indx });

                               
                            }

                                var ls = new SimpleFillSymbol().setColor(col).setStyle(SimpleFillSymbol.STYLE_SOLID).setOutline(new SimpleLineSymbol().setColor(col));
                                results.push({ symbol: ls, type: ls.type, name: "line " + indx });
                            ct++;
                        }

                        return results;




                    },

                    show: function (g) {

                        $(this.node).show();
                        if (this.loaded == false) this.startUp();

                    },

                    _getSize: function () {
                        return 
                    },

                    getSymbol: function () {

                        if (this.sizeControl) {
                            this.size =$(this.sizeControl).val();
                            this.color = this.colorPicker.color;
                            this.outlineColor = this.outlineColorPicker.color;

                            var symbol = this.targetSymbol;
                            var selected = this.templatePicker.getSelected();      
                            if (selected) {
                                symbol = selected.item.symbol;
                            }
                                                         
                            var outline = symbol.outline;
                            symbol.setColor(this.color);
                            outline.setWidth(this.size).setColor(this.outlineColor);
                            return symbol;
                        } else {
                            return this.targetSymbol;
                        }
                       

                    }

                })
            });

