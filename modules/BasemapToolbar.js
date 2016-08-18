define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/json",
        "dojo/Evented",
        "dojo/topic",
        "esri/dijit/BasemapLayer",
        "esri/dijit/Basemap",
        "modules/SimpleTOC.js",
        "dojo/domReady!"],
            function (declare, lang, dojo, Evented, topic, BasemapLayer, Basemap, SimpleToc) {
                return declare([Evented], {
                    currentBasemap: null,
                    attachTo: null,
                    node: null,
                    menubar: null,
                    basemaps: null,
                    map: null,
                    constructor: function (params, attachTo) {
                        this.map = params.map;
                        this.attachTo = attachTo;
                        this.menubar = "#BASEMAPLISTDROPDOWN";
                        this.basemaps = params.basemaps;

                        var tb = $("<div class='btn-group ags-basemap-toolbar hidden-xs'>");
                        $(tb).appendTo(attachTo);
                        this.node = tb;

                        var ul = $(this.menubar);
                        $(ul).empty();

                        var map = this.map;

                        $.each(params.basemaps,lang.hitch(this, function (indx, item) {

                            var clickFn = lang.hitch(this,function () {
                                map.setBasemap(item.id);

                                $(".ags-basemap-menuitem").removeClass("glyphicon-ok");
                                $(".ags-basemap-button").removeClass("btn-primary");
                                $(b).addClass("btn-primary");
                                $(span).addClass("glyphicon-ok");
                            });

                            if (item.urls) {


                                var layers = $.map(item.urls, function (url) {
                                    var layer = new BasemapLayer({ url: url });
                                    return layer;
                                });
                                var baseMap = new Basemap({
                                    layers: layers,
                                    title: item.text
                                });

                                clickFn = lang.hitch(this,function () {
                                    map.setBasemap(baseMap);

                                    if (item.minzoom)
                                        if (map.getLevel() > item.minzoom) {
                                            map.setLevel(item.minzoom);
                                        }

                                    $(".ags-basemap-menuitem").removeClass("glyphicon-ok");
                                    $(".ags-basemap-button").removeClass("btn-primary");
                                    $(b).addClass("btn-primary");
                                    $(span).addClass("glyphicon-ok");

                                });

                            }


                            var b = $("<button type='button'>");
                            $(b).addClass("btn btn-default ags-basemap-button").html(item.text).appendTo(tb).click(clickFn);

                            var li = $("<li>");
                            var a = $("<a>");
                            var span = $("<span class='glyphicon ags-basemap-menuitem'>");
                            $(li).append(a).appendTo(ul);
                            $(a).append(span).append(item.text).click(clickFn);

                            if (item.id == params.initialBasemap) {
                                $(b).addClass("btn-primary");
                                $(span).addClass("glyphicon-ok");
                            }

                            item.click = clickFn;

                        }));

                        if (params.TableOfContentsButton == true) {
                            // code for dropdown menu
                            var tocBG = $("<div class='btn-group'>")
                            var tocd = $("<ul class='dropdown-menu dropdown-menu-right' role='menu'>");
                            var tocButton = $("<button type='button' class='btn btn-default dropdown-toggle' data-toggle='dropdown'>");
                            var caret = $("<span class='caret'>");
                            $(tocButton).text("More").append(caret);
                            var toc = new SimpleToc({ map: this.map, mode: "bootstrap" }, tocd);
                            $(tocBG).append(tocButton).appendTo(tb).append(tocd);
                        }


                    }, // end constructor



                    hide: function () {
                        $(this.node).hide();
                    },

                    show: function () {
                        $(this.node).show();
                    },

                    _changeBasemap: function (name) {
                        //var map = this.map;
                        $.each(this.basemaps, function (a, b) {
                            if (b.text == name) {
                                b.click();
                            }
                        });
                    }




                }); // end return declare
            }); //end define
