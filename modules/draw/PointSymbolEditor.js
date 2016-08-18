define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/json",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/Evented",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/Color",
        "esri/dijit/editing/TemplatePicker",
        "modules/draw/ColorPicker"
],
            function (declare, lang, dojo, dom, dc,
                Evented, SimpleMarkerSymbol, SimpleLineSymbol,
                Color, TemplatePicker, ColorPicker) {
                return declare([Evented], {
                    type: null,
                    colors: null,
                    sizes: null,
                    node: null,
                    templateDiv: null,
                    templatePicker: null,
                    colorPicker: null,                   
                    sizeControl: null,
                    loaded: null,
                    targetSymbol: null,
                    mode: null,
                    constructor: function (params, attachTo) {
                        this.type = "point";
                        this.node = attachTo;
                        this.targetSymbol = new SimpleMarkerSymbol().setColor(new Color("#000000")).setSize(15);
                        if (params.symbol != undefined) this.targetSymbol = params.symbol;
                        this.mode = "table";
                        if (params.mode) this.mode = params.mode;
                        if (this.mode == "table") {
                            this.colors = ["black"];
                            this.sizes = [12];
                            this._createUITable();
                        } else if (this.mode == "gallery") {
                            this.colors = ["black", "blue", "gray", "green", "maroon", "navy", "orange", "purple", "red"];
                            this.sizes = [12, 16];
                            this._createUIGallery();
                        }
                        
                        this.loaded = false;                  
                    },

                    startUp: function() {
                        
                        if (this.templateDiv) {                            
                            var defaultMarkers = this._getDefaultSymbols();                                                                      
                            var templatePicker = new TemplatePicker({
                                items: defaultMarkers,
                                rows: "auto", style: "height: 50px",
                                columns: "auto"
                            }, this.templateDiv);

                            this.templatePicker = templatePicker;
                            this.templatePicker.startup();

                            templatePicker.on("selection-change", lang.hitch(this, this._onChange));
                        }
                       
                        
                        

                        this.loaded = true;
                    },

                    _onChange: function () {
                        if (this.templatePicker.getSelected()) {
                            var selected = this.templatePicker.getSelected();
                            this.targetSymbol = selected.item.symbol;                            

                        }

                    },

                    _createUI: function() {
                        var d = $("<div class='ags-container'>");
                        $(d).appendTo(this.node);
                        var f = $("<form class='form-horizontal' role='form' action='javascript:void(0);'>");
                        $(d).append(f);
                        var d1 = $("<div class='form-group'>");
                        
                        var l1 = $("<label class='control-label'>");
                        $(l1).html("Marker Symbols:").appendTo(d1);
                        var markerSelect = $("<div>");
                        $(d1).append(markerSelect).appendTo(f);
                        this.markerDiv = markerSelect[0];

                        d1 = $("<div class='form-group'>");
                        l1 = $("<label class='control-label'>");
                        $(l1).text("Select Marker Color:");
                        $(d1).appendTo(f).append(l1);
                        var cp = new ColorPicker({}, d1);
                        this.colorPicker = cp;
                        
                        d1 = $("<div class='form-group'>");
                        l1 = $("<label class='control-label'>");
                        $(l1).text("Select Marker Size:");
                        $(d1).appendTo(f).append(l1);
                        
                        var select = $("<select class='form-control'>");
                        var i = 6; n = 50;
                        for (i = 6; i <= n; i++) {
                            var opt = $("<option>");
                            $(opt).val(i).text(i).appendTo(select);
                        };
                        $(d1).append(select);
                        this.sizeControl = select;

                    },


                    _createGalleryUI: function () {
                        var d = dc.create("div", { className: "ags-container" }, this.node);
                        this.templateDiv = dc.create("div", {}, d);
                       
                    },

                    _createUITable: function () {
                        var d = dc.create("div", { className: "ags-container" }, this.node);

                        this.templateDiv = dc.create("div", {}, d);

                        var table = dc.create("table", { style: "width: 100%" }, d);

                        var tr1 = dc.create("tr", {}, table);
                        var tr2 = dc.create("tr", {}, table);


                        var d1 = dc.create("td", { innerHTML: "Color" }, tr1);
                        var td2 = dc.create("td", {}, tr2);
                        //this.colorPicker = dc.create("input", { type: 'color', value: "#ffffff" }, td2);
                        var cpnode = dc.create("div", {}, td2);
                        this.colorPicker = new ColorPicker({ color: [255, 255, 255, 0] }, cpnode);

                        var d1 = dc.create("td", { innerHTML: "size" }, tr1);
                        var td2 = dc.create("td", {}, tr2);
                        var input = dc.toDom("<input type='number' value='20' min='1' max='100' step='1'  style='width: 40px'/>");
                        dc.place(input, td2);
                        this.sizeControl = input;

                        this.bindTo();

                        //$(this.sizeControl).click(lang.hitch(this, this._onControlChange));
                        //$(this.colorPicker).change(lang.hitch(this, this._onControlChange));
                    },

                    bindTo: function (g) {
                        var symbol = this.targetSymbol;

                        if (symbol != null) {
                            $(this.sizeControl).val(parseInt(symbol.size));
                            this.colorPicker.setColor(symbol.color);                            
                        }

                    },

                    _getDefaultSymbols: function () {
                        var results = [];
                                                                      
                        var colors = this.colors;
                        var widths = this.sizes;
                       

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
                                
                                var ls = new SimpleMarkerSymbol().setSize(w).setColor(col).setStyle(SimpleMarkerSymbol.STYLE_CIRCLE).setOutline(new SimpleLineSymbol().setColor(col));
                                results.push({ symbol: ls, type: ls.type, name: "line " + indx });

                                var ls = new SimpleMarkerSymbol().setSize(w).setColor(col).setStyle(SimpleMarkerSymbol.STYLE_CROSS).setOutline(new SimpleLineSymbol().setColor(col));
                                results.push({ symbol: ls, type: ls.type, name: "line " + indx });

                                var ls = new SimpleMarkerSymbol().setSize(w).setColor(col).setStyle(SimpleMarkerSymbol.STYLE_X).setOutline(new SimpleLineSymbol().setColor(col));
                                results.push({ symbol: ls, type: ls.type, name: "line " + indx });

                                var ls = new SimpleMarkerSymbol().setSize(w).setColor(col).setStyle(SimpleMarkerSymbol.STYLE_DIAMOND).setOutline(new SimpleLineSymbol().setColor(col));
                                results.push({ symbol: ls, type: ls.type, name: "line " + indx });
                            }

                            ct++;
                        }

                        return results;
                    },

                    show: function (g) {

                        $(this.node).show();
                        if (this.loaded == false) this.startUp();

                    },


                    getSymbol: function () {

                        if (this.sizeControl) {
                            this.size =$(this.sizeControl).val();
                            this.color = this.colorPicker.color;
                            var symbol = this.targetSymbol;
                            var selected = this.templatePicker.getSelected();
                            if (selected) {
                                symbol = selected.item.symbol;
                            }
                            symbol.setColor(this.color).setSize(this.size).outline.setColor(this.color);                       
                            return symbol;
                        } else {
                            return this.targetSymbol;
                        }
                        

                    }

                })
            });

