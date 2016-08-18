

define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/json",
        "dojo/Evented",
        "dojo/dom-construct",
        "esri/symbols/TextSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/Color",
        "esri/symbols/Font",
        "modules/draw/ColorPicker"
],
            function (declare, lang, dojo, Evented, dc, TextSymbol, SimpleLineSymbol, Color, Font, ColorPicker) {
                return declare([Evented], {
                    type: null,
                    attachTo: null,
                    node: null,
                    inputControl: null,
                    sizeControl: null,
                    colorControl: null,
                    boldControl: null,
                    italicControl: null,
                    underlineControl: null,
                    loaded: null,
                    constructor: function(params, attachTo) {
                        this.node = attachTo;
                        this.type = "text";

                        if (params.symbol != undefined) this.targetSymbol = params.symbol;

                        if (this.node == undefined) {
                            return;
                        }

                        this._createUITable();
                        this.loaded = true;
                    },
                    startUp: function() {
                    },

                    _createUITable: function() {
                        var d = dc.create("div", { className: "ags-container" }, this.node);

                        var input = dc.toDom("<input type='text' placeholder='enter text' class='form-control'/>");
                        this.inputControl = input;
                        dc.place(input, d);

                        var table = dc.create("table", { style: "width: 100%" }, d);

                        var tr1 = dc.create("tr", {}, table);
                        var tr2 = dc.create("tr", {}, table);

                        var d1 = dc.create("td", { innerHTML: "Color" }, tr1);
                        var td2 = dc.create("td", {}, tr2);
                        //this.colorControl = dc.create("input", { type: 'color', value: "#000000" }, td2);
                        var cpnode = dc.create("div", {}, td2);
                        this.colorControl = new ColorPicker({ color: [255, 255, 255, 255] }, cpnode);

                        var d1 = dc.create("td", { innerHTML: "size" }, tr1);
                        var td2 = dc.create("td", {}, tr2);
                        var input = dc.toDom("<input type='number' value='20' min='1' max='100' step='1'  style='width: 50px'/>");
                        dc.place(input, td2);
                        this.sizeControl = input;

                        var tr3 = dc.create("tr", {}, table);
                        //var d1 = dc.create("td", { innerHTML: "&nbsp;" }, tr1);
                        var td2 = dc.create("td", { colspan: "2" }, tr3);
                        var formatDiv = dc.create("div", {}, td2);


                        this.boldControl = dc.create("input", { type: "checkbox", id: "ts_b_1" }, formatDiv);
                        var label = dc.create("label", { innerHTML: "Bold", for: "ts_b_1" }, formatDiv);
                        dc.create("br", {}, formatDiv);

                        this.italicControl = dc.create("input", { type: "checkbox", id: "ts_b_2" }, formatDiv);
                        var label = dc.create("label", { innerHTML: "Italic", for: "ts_b_2" }, formatDiv);
                        dc.create("br", {}, formatDiv);

                        this.underlineControl = dc.create("input", { type: "checkbox", id: "ts_b_3" }, formatDiv);
                        var label = dc.create("label", { innerHTML: "Underline", for: "ts_b_3" }, formatDiv);
                        dc.create("br", {}, formatDiv);
                        //$(formatDiv).buttonset();

                        this.bindTo();

                        //$(this.sizeControl).click(lang.hitch(this, this._onControlChange));
                        //$(this.colorPicker).change(lang.hitch(this, this._onControlChange));
                    },

                    _createUI: function() {
                        var d = dc.create("div", { className: "ags-container" });
                        $(d).appendTo(this.node);
                        var f = dc.create("form", { className: 'form-horizontal', role: 'form', action: 'javascript:void(0);' }, d);
                        var d1 = dc.create("div", { className: "form-group" }, f);
                        var l1 = dc.toDom("<label class='control-label'>Enter Text</label>");
                        $(l1).appendTo(d1);
                        var input = dc.toDom("<input type='text' placeholder='enter text' class='form-control'/>");
                        $(input).appendTo(d1);
                        this.inputControl = input;

                        var d1 = dc.create("div", { className: "form-group" }, f);
                        var l1 = dc.toDom("<label class='control-label'>Text Size: </label>");
                        $(l1).appendTo(d1);
                        var input = dc.toDom("<input type='number' value='12' min='2' max='100' step='1' style='width: 70px'/>");
                        $(input).appendTo(d1);
                        this.sizeControl = input;

                        var d1 = dc.create("div", { className: "form-group" }, f);
                        var l1 = dc.create("label", { className: 'control-label', innerHTML: "Color: " }, d1);
                        this.colorControl = dc.create("input", { type: 'color', value: "#000000" }, d1);

                        //var d1 = dc.create("div", { className: "form-group" }, f);

                        //l1 = dc.create("label", { }, d1);                       
                        //this.boldControl = dc.create("input", { type: 'checkbox' }, l1);
                        //$(l1).append("   Bold");
                        //dc.create("br", {}, d1);
                        //l1 = dc.create("label", { }, d1);
                        //this.italicControl = dc.create("input", { type: 'checkbox' }, l1);
                        //$(l1).append("   Italic");
                        //dc.create("br", {}, d1);
                        //l1 = dc.create("label", { }, d1);
                        //this.underlineControl = dc.create("input", { type: "checkbox" }, l1);
                        //$(l1).append("   Underline");
                        //dc.create("br", {}, d1);

                        this.sizeControl = input;
                    },

                    show: function(g) {
                        $(this.node).show();
                    },

                    bindTo: function() {
                        var symbol = this.targetSymbol;

                        if (symbol != null) {
                            $(this.sizeControl).val(parseInt(symbol.font.size));
                            //$(this.colorControl).val(symbol.color.toHex());
                            this.colorControl.setColor(symbol.color);
                            $(this.inputControl).val(symbol.text);

                            var f = symbol.font;
                            //console.debug(f);
                            if (f.style == "italic") $(this.italicControl).attr("checked", "checked");
                            if (f.weight == "bold") $(this.boldControl).attr("checked", "checked");
                            if (f.decoration == "underline") $(this.underlineControl).attr("checked", "checked");
                        }
                    },

                    getSymbol: function() {
                        var size = this.sizeControl.value;
                        var font = new Font(size).setFamily("serif");
                        var isBold = $(this.boldControl).is(":checked");
                        if (isBold == true) font.setWeight(Font.WEIGHT_BOLD);

                        var isItalic = $(this.italicControl).is(":checked");
                        if (isItalic == true) font.setStyle(Font.STYLE_ITALIC);

                        var isUDL = $(this.underlineControl).is(":checked");
                        if (isUDL == true) font.setDecoration("underline");

                        var textSym = new TextSymbol(this.inputControl.value).setFont(font);

                        var c = this.colorControl.color;
                        textSym.setColor(c);

                        return textSym;
                    }
                });
            });

