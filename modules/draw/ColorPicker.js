define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/json",
        "dojo/dom-construct",
        "dojo/Evented",
        "dijit/popup",
        "esri/Color",
        "esri/dijit/ColorPicker",
        "dijit/ColorPalette",
        "dijit/TooltipDialog"
         
], function (declare, lang, dojo, dc, Evented, popup, Color, ColorPicker, ColorPalette, TooltipDialog) {
    return declare([Evented], {
        node: null,
        dialog: null,
        visible: false,
        widget: null,
        widgetNode: null,
        widgetCreated: false,
        color: null,
        constructor: function(params, attachTo) {
            this.node = dc.create("button", { className: "btn btn-default" }, attachTo);
            dc.create("span", { className: "ags-color-input", innerHTML: "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;", style: "min-width: 250px" }, this.node);

            this.color = new Color(params.color);
            this.setColor(this.color);

            this.widgetNode = dc.create("div", {});

            this.dialog = new TooltipDialog({
                content: this.widgetNode
            });

            $(this.node).click(lang.hitch(this, this._nodeClick));
        },

        _changeColor: function(evt) {
            var c = new Color();
            if (this.widget) {
                c = this.widget.color;
            }
            this.setColor(c);
            popup.close(this.dialog);
        },

        setColor: function(c) {
            $(this.node).css({ backgroundColor: c.toHex(), color: c.toHex() });
            this.color = c;
        },

        getColor: function() {
            return this.color;
        },

        _nodeClick: function() {
            this.visible = !this.visible;
            if (this.visible) {
                popup.open({
                    popup: this.dialog,
                    around: this.node
                });
                if (!this.widgetCreated) this.createWidget();
            } else {
                popup.close(this.dialog);
                //this.destroyWidget();
            }
        },

        createWidget: function() {
            this.widget = new ColorPicker({ color: this.color }, this.widgetNode);
            this.widget.on("color-change", lang.hitch(this, this._changeColor));
            this.widget.startup();
            this.widgetCreated = true;
        },

        destroyWidget: function() {
            if (this.widget) {
                this.widget.destroy();
            }
        }
    });
});





