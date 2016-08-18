
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
   "dojo/dom",
   "dojo/dom-construct",
   "dojo/_base/window",
   "dojo/_base/event",
   "dojo/Evented",
   "dojo/Deferred",
   "modules/LegendItem.js",
   "esri/dijit/BasemapGallery",
   "esri/dijit/Legend"
], function (
  declare, lang, dom, dc, win, event, Evented, Deferred, LegendItem, BasemapGallery, Legend
) {
    return declare([Evented], {

        node: null,
        map: null,
        mode: null,
        legendButtonStyle: null,
        legendBelow: null,

        layersTab: null,
        legendTab: null,
        basemapTab: null,
        tocDiv: null,
        style: "SINGLE",
        token: null,
        constructor: function (params, attachTo) {
            this.node = $(attachTo)[0];
            this.map = params.map;
            this.mode = params.mode || "table";
            this.legends = [];



            if (this.style == "TAB") {
                this.createStructure();
            } else {
                this.tocDiv = dc.create("div", {}, this.node);
            }

            map.on("layer-add-result", lang.hitch(this, "refresh"));

            this.legendButtonStyle = "jquery";
            this.legendBelow = true;

            this.refresh();
        },
        refresh: function () {

            //$(this.node).empty();
            (this.mode == "table") ? this._refreshTable2() : this._refreshBootStrap();

        },



        createStructure: function() {

            var tabBar = dc.create("div", {}, this.node);

            var ul = dc.create("ul", {
                    className: "nav nav-tabs",
                    role: "tablist"
            }, tabBar);

            var tabContent = dc.create("div", {
                className: "tab-content"
            }, this.node);

           this.legendTab = dc.create("div", {
                className: "tab-pane fade in active",
                id: "legend-tab",
               innerHTML: "legendDiv"
            }, tabContent);
            this.layersTab = dc.create("div", {
                className: "tab-pane fade",
                id: "layers"
            }, tabContent);

            this.basemapTab = dc.create("div", {
                className: "tab-pane fade",
                id: "basemaps"
            }, tabContent);

            this.tocDiv = dc.create("div", {}, this.layersTab);

            this.createTab({ text: "Legend", target: "#legend-tab"}, ul, this.legendTab);
            this.createTab({ text: "Layers", target: "#layers" }, ul, this.layersTab);
            this.createTab({ text: "BaseMaps", target: "#basemaps" }, ul, this.basemapTab);

            $(tabBar).tab();

            var basemapContainer = dc.create("div",{ className: "ags-basemap-gallery" }, this.basemapTab);
            var basemapGallery = new BasemapGallery({
                showArcGISBasemaps: true,
                map: this.map
            }, dc.create("div", {  }, basemapContainer));
            basemapGallery.startup();

            var legend = new Legend({
                map: this.map
            }, dc.create("div", {}, this.legendTab));
            //legend.startup();


        },

        createTab: function(p, ul, t){


            var li = dc.create("li", {
                className: ""
            }, ul);
            var a = dc.create("a", {
                innerHTML: p.text,
                href: p.target
            }, li);

            $(a).click(function (e) {
                e.preventDefault()
                $(this).tab('show');
            });

            return
        },

        _refreshBootStrap: function () {

            //var graphiclayers = $.map(this.map.graphicsLayerIds, function (item) {
            //    return this.map.getLayer(item);
            //});

            //var dlayers = $.map(this.map.layerIds, function (item) {
            //    return this.map.getLayer(item);
            //});
            //layers = dlayers.concat(graphiclayers);
            //layers.reverse();

            //var ul = this.node;

            //$.each(layers, function (indx, item) {

            //    var g1 = item.id.indexOf("layer");
            //    if (g1 === 0)
            //        return;

            //    var g2 = item.id.indexOf("graphicsLayer");
            //    if (g2 === 0)
            //        return;


            //    var li = $("<li>");
            //    var a = $("<a>");
            //    var span = $("<span class='glyphicon'>");
            //    $(li).append(a).appendTo(ul);


            //    if (item.visible) {
            //        $(span).addClass("glyphicon-ok");
            //    }

            //    $(a).append(span).append(item.id);


            //    $(li).hover(function () { }, function () {

            //    }).click(function () {
            //        if (item.visible == true) {
            //            item.hide();
            //            $(span).removeClass("glyphicon-ok");
            //            //$(span).addClass("glyphicon-unchecked");
            //        } else {
            //            item.show();
            //            $(span).addClass("glyphicon-ok");
            //            //$(span).removeClass("glyphicon-unchecked");
            //        }
            //    });
            //});


        },

        _refreshTable: function () {

            $(this.tocDiv).empty();
            var map = this.map;
            var table = $("<table cellspacing='2' cellpadding='2' class='ags-table-of-contents' >");
            $(table).appendTo(this.tocDiv);

            var graphiclayers = $.map(this.map.graphicsLayerIds, function (item) {
                return this.map.getLayer(item);
            });

            var dlayers = $.map(this.map.layerIds, function (item) {
                return this.map.getLayer(item);
            });
            layers = dlayers.concat(graphiclayers);
            layers.reverse();

            $.each(layers, lang.hitch(this, function (indx, item) {

                var g1 = item.id.indexOf("layer");
                if (g1 === 0)
                    return;

                //console.debug(item.id);

                var g2 = item.id.indexOf("graphicsLayer");
                if (g2 === 0)
                    return;



                var tr = $("<tr>");
                var td1 = $("<td>");
                var td2 = $("<td>");
                var td3 = $("<td>");
                var legendDiv = $("<div>");
                $(legendDiv).addClass("ags-legend").attr("layerName", item.id);
                $(table).append(tr);

                var span = $("<input type='checkbox'/>");
                $(td2).append(item.id)

                if (this.legendBelow == false) {
                    $(tr).append(td3).append(td1).append(td2);
                    $(td3).append(legendDiv);

                } else {
                    $(tr).append(td1).append(td3).append(td2);
                    // legend below
                    var trl = $("<tr>");
                    var tdl1 = $("<td colspan='2'>");
                    var tdl2 = $("<td>");
                    $(tdl2).append(legendDiv);
                    $(trl).append(tdl1).append(tdl2).appendTo(table).hide();

                    if (this.legendButtonStyle == "jquery") {
                        var btn = $("<span>");
                        var btnSpan = $("<span class='ui-icon ui-icon-squaresmall-plus'>");
                        $(btn).click(function (evt) {
                            event.stop(evt);
                            $(trl).slideToggle();
                            if ($(btnSpan).hasClass("ui-icon-squaresmall-plus")) {
                                $(btnSpan).addClass("ui-icon-squaresmall-minus").removeClass("ui-icon-squaresmall-plus");
                            } else {
                                $(btnSpan).addClass("ui-icon-squaresmall-plus").removeClass("ui-icon-squaresmall-minus");
                            }
                        }).appendTo(td3).append(btnSpan);
                    } else {
                        var bsBtn = $("<span class='glyphicon glyphicon-plus-sign'>");
                        $(bsBtn).click(function (evt) {
                            event.stop(evt);
                            $(trl).slideToggle();
                            if ($(bsBtn).hasClass("glyphicon-plus-sign")) {
                                $(bsBtn).addClass("glyphicon-minus-sign").removeClass("glyphicon-plus-sign");
                            } else {
                                $(bsBtn).addClass("glyphicon-plus-sign").removeClass("glyphicon-minus-sign");
                            }
                        }).appendTo(td3);
                    }
                }



                var leg = new LegendItem({ layer: item, token: true }, legendDiv);
                leg.refresh();


                if (item.visible) {
                    $(span).attr("checked", "checked");
                }


                $(span).click(function (evt) {
                    if (item.visible == true) {
                        item.hide();
                    } else {
                        item.show();
                    }
                }).appendTo(td1);





            }));

        },

        _refreshTable2: function () {


            $(this.tocDiv).empty();
            var map = this.map;


            var graphiclayers = $.map(this.map.graphicsLayerIds, function (item) {
                return this.map.getLayer(item);
            });

            var dlayers = $.map(this.map.layerIds, function (item) {
                return this.map.getLayer(item);
            });
            dlayers.reverse();
            graphiclayers.reverse();
            //layers = dlayers.concat(graphiclayers);
            //layers.reverse();
            //console.clear();
            $.each(graphiclayers, lang.hitch(this, this.buildNode));
            $.each(dlayers, lang.hitch(this, this.buildNode));
            //$.each(layers, lang.hitch(this, function (indx, item) {





            //}));

            $(this.tocDiv).addClass("table table-condensed");
            //var m = this.map;
            //$(this.tocDiv).addClass("table table-condensed").sortable({

            //    stop: lang.hitch(this, function (event, ui) {

            //        var layerName = $(ui.item[0]).attr("layerName");
            //        var indx = $(".ags-toc").index(ui.item[0]);
            //        var total = $(".ags-toc").length;
            //        var layer = m.getLayer(layerName);
            //        if (layer) {
            //            var layindx = total - indx;
            //            m.reorderLayer(layer, layindx);
            //        }

            //    })

            //});


            // initially grey out items
            this.updateOnExtentChange();
            this.map.on("extent-change", lang.hitch(this, this.updateOnExtentChange));
            this.map.on("layers-reordered", lang.hitch(this, function (results) {
                //console.debug(results);

            }));

        },

        buildNode: function(indx, item){
            //console.debug(item.id)

            var d = dc.create("div", { className: "ags-toc row", layerName: item.id }, this.tocDiv);

            var chkd = dc.create("div", { className: "col-md-1" }, d)
            var chk = dc.create("input", {
                type: "checkbox",
                className: "tocchk",
                layerName: item.id,
                minScale: item.minScale,
                maxScale: item.maxScale
            }, chkd);

            if (item.visible) {
                $(chk).attr("checked", "checked");
            }

            var legendbtnD = dc.create("div", { className: "col-md-1" }, d);
            var textD = dc.create("div", { className: "col-md-9" }, d);

            var legendRow = dc.create("div", { className: "row" }, d)
            var legendcol1 = dc.create("div", { className: "col-md-3" }, legendRow)
            var legendDiv = dc.create("div", { className: "ags-legend col-md-9", style: "display:none" }, legendRow);
            if (this.legendButtonStyle == "jquery") {
                var btn = dc.create("span", { style: "display:inline" }, legendbtnD);
                var btnSpan = dc.create("span", { className: "ui-icon ui-icon-squaresmall-plus" }, btn);
                $(btn).click(function (evt) {
                    event.stop(evt);
                    $(legendDiv).slideToggle();
                    if ($(btnSpan).hasClass("ui-icon-squaresmall-plus")) {
                        $(btnSpan).addClass("ui-icon-squaresmall-minus").removeClass("ui-icon-squaresmall-plus");
                    } else {
                        $(btnSpan).addClass("ui-icon-squaresmall-plus").removeClass("ui-icon-squaresmall-minus");
                    }
                });
            } else {
                var bsBtn = dc.create("span", { className: "glyphicon glyphicon-plus-sign" }, legendbtnD);
                $(bsBtn).click(function (evt) {
                    event.stop(evt);
                    $(trl).slideToggle();
                    if ($(bsBtn).hasClass("glyphicon-plus-sign")) {
                        $(bsBtn).addClass("glyphicon-minus-sign").removeClass("glyphicon-plus-sign");
                    } else {
                        $(bsBtn).addClass("glyphicon-plus-sign").removeClass("glyphicon-minus-sign");
                    }
                });
            }

            item.on("visibility-change", function (evt) {
                if (item.visible) {
                    $(chk).attr("checked", "checked");
                } else {
                    $(chk).removeAttr("checked");
                }
                //console.debug(chk);
            });



            //$(textD).dropdown();

            var span = dc.create("span", { innerHTML: item.id }, textD);
            var leg = new LegendItem({ layer: item, token: true }, legendDiv);
            leg.refresh();

            $(chk).click(function (evt) {
                console.debug(item);
                if (item.visible == true) {
                    item.hide();
                } else {
                    item.show();
                }
            });



            var g1 = item.id.indexOf("layer");
            if (g1 === 0)
                $(d).hide();

            var g2 = item.id.indexOf("graphicsLayer");
            if (g2 === 0)
                $(d).hide();
        },

        updateOnExtentChange: function () {
            var scale = this.map.getScale();
            var tocs = $(".tocchk");
            $.each(tocs, function (indx, toc) {
                var parent = $(toc).parent();
                var minScale = parseFloat($(toc).attr("minScale"));
                var maxScale = parseFloat($(toc).attr("maxScale"));
                var enabled = true;
                if (minScale != "0" && minScale < scale) {
                    enabled = false;
                }
                if (maxScale != "0" && maxScale > scale) {
                    enabled = false;
                }
                var disabled = $(toc).attr("disabled");
                if (enabled == false) {
                    $(toc).attr("disabled", "disabled");
                    $(parent).removeClass("toc-enabled").addClass("toc-disabled");
                } else {
                    $(toc).removeAttr("disabled");
                    $(parent).removeClass("toc-disabled").addClass("toc-enabled");
                }
            });

        }



    });
});
