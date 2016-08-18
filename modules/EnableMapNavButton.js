define([
  "dojo/_base/declare",
  "dojo/_base/lang",
   "dojo/dom",
   "dojo/dom-construct",
   "dojo/_base/window",
   "dojo/Evented",
   "dojo/topic"
], function (
    declare, lang, dom, dc, win, Evented, topic
) {
    return declare([Evented], {
        params: null,
        map: null,
        node: null,
        constructor: function (params) {
            this.map = params.map;
            if (params.node == undefined) {
                this.node = dom.byId("mapDiv_root");
            }
            this.createUI();
        },


        createUI: function () {
            var p = {};

            p.className = "nav-icon";
            p.buttonClassName = "nav-button";           

            var b = dc.create("div", {
                className: p.buttonClassName + " float-button"
            }, this.node);

            var b = dc.create("button", {
                className: "btn btn-default"
            }, b);

            var s = dc.create("span", {
                className: "glyphicon glyphicon-ban-circle"
            }, b);

            var s2 = dc.create("span", {
                innerHTML: "disable"
            }, b);

            //if (p.title) {
            var tooltip = {
                placement: "right",
                trigger: "hover",
                title: "Disable/Enable Map Navigation"
            }
            $(b).tooltip(tooltip);
            //}


            $(b).on("click", lang.hitch(this, function () {
                if (this.map.isPan) {
                    this.map.disablePan()
                    this.map.disableDoubleClickZoom();
                    $(s2).html("Enable");
                } else {
                    this.map.enableDoubleClickZoom();
                    this.map.enablePan();
                    $(s2).html("Disable");
                }

            }));
        }


    })

});












