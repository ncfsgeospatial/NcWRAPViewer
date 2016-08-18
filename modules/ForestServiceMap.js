

﻿define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/event",
    "dojo/Evented",
    "dojo/topic",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/on",
    "dojo/_base/connect",
    "esri/map",
    "esri/tasks/GeometryService",
    "esri/config",
    "esri/urlUtils",
    "esri/dijit/Scalebar",
    "src/js/bootstrapmap.js",
    "esri/SpatialReference",
    "esri/geometry/Extent",
    "esri/graphic",
    "esri/dijit/BasemapLayer",
    "esri/dijit/Basemap",
    "esri/toolbars/edit",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/virtualearth/VETiledLayer",
    "modules/GoogleEarthWMS.js",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/renderers/SimpleRenderer",
    "esri/geometry/Multipoint",
    "esri/geometry/Point",
    "esri/geometry/webMercatorUtils",
    "esri/graphicsUtils",
    "dojo/_base/Color",
    "esri/InfoTemplate",
    "esri/tasks/query",
    "modules/SimpleToc.js", "modules/query/GoogleGeocoder.js",
    "modules/query/CountySearch.js", "modules/query/ParcelSearch.js",
    "modules/BasemapToolbar.js",
    "modules/query/CoordinateSearch.js", "modules/IdentifyTool.js",
    "dojo/domReady!"

], function (
  declare, lang, event, Evented, topic, dc, dom, on, connect,
  Map, GeometryService, esriConfig, urlUtils, Scalebar, BootstrapMap, SpatialReference, Extent, Graphic, BasemapLayer, Basemap, Edit,
  ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer, VETiledLayer, GoogleEarthWMS, FeatureLayer, GraphicsLayer,
  SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol, SimpleRenderer, Multipoint, Point,
  webMercatorUtils, graphicUtils, Color, InfoTemplate, Query,
  SimpleToc, GoogleGeocoder, CountySearch, ParcelSearch,
  BasemapToolbar, CoordinateSearch, IdentifyTool
) {
    return declare([Evented], {
        map: null,
        basemapToolbar: null,
        loaded: null,
        standLayer: null,
        tractLayer: null,
        geometryService: null,

        isLoaded: null,
        page: null,
        extentChangeHandler: null,

        loadingDiv: null,

        constructor: function (options) {

            if (options) {
                this.page = options.page;
            }
            this.isLoaded = false;
            // end constructor
        },

        startUp: function () {
            var webMercator = new SpatialReference({ wkid: 102100 });
            var initialExtent = new Extent(-9447929, 3992649, -8345210, 4402481, new SpatialReference({ wkid: 102100 }));
            this.loaded = false;
            esriConfig.defaults.geometryService = new GeometryService(config.geoServiceUrl);
            esriConfig.defaults.io.proxyUrl = "proxy.ashx";
            esriConfig.defaults.io.alwaysUseProxy = false;
            esri.config.defaults.io.corsEnabledServers.push("www.ncmhtd.com");
            urlUtils.addProxyRule({
                urlPrefix: "www.ncmhtd.com/arcgis/rest/services/secure",
                proxyUrl: "proxy.ashx"
            });
            //urlUtils.addProxyRule({
            //    urlPrefix: "https://ge-nt.ncmhtd.com",
            //    proxyUrl: "proxy.ashx"
            //});


            this.geometryService = esriConfig.defaults.geometryService;


            if (config.useBing) {
                map = BootstrapMap.create("mapDiv", {
                    extent: initialExtent,
                    logo: false,
                    responsiveResize: false,
                    scrollWheelZoom: true
                });
            } else {
                map = BootstrapMap.create("mapDiv", {
                    basemap: "streets",
                    extent: initialExtent,
                    logo: false,
                    responsiveResize: false,
                    scrollWheelZoom: true
                });
            }

            this.map = map;
            var scalebar = new Scalebar({
                map: map,
                scalebarUnit: "dual"
            });

            var loadingDiv = dc.create("div");
            $(loadingDiv).html(config.loadingHtml).appendTo("#mapDiv_root");

            $(loadingDiv).show();
            map.on("update-start", function () { $(loadingDiv).show(); });
            map.on("update-end", function () { $(loadingDiv).hide(); });
            this.loadingDiv = loadingDiv;

            map.on("load", lang.hitch(this, this._loadLayers));
            map.on("load", lang.hitch(this, this._resizeMapWindow));
            (config.useBing) ? this._createBingBasemapToolbar() : this._createBasemapToolbar();
        },

        _resizeMapWindow: function () {
            var w = $(document).width();
            var h = $(document).height();
            if (w > 480) {
                this.map.resize();
                if (this.basemapToolbar) {
                    this.basemapToolbar.show();
                }
            } else {
                //$("#mapDiv").css("height", "auto");

                this.map.resize();
                if (this.basemapToolbar) {
                    this.basemapToolbar.hide();
                }
            }
        },

         showLoading:function() {
             $(this.loadingDiv).show();
         },
         hideLoading: function() {
             $(this.loadingDiv).hide();
         },

         hasCookie: function(cname){
             var cookie = this.getCookie(cname);
             var hasCookie = (cookie == "") ? false : true;
             return hasCookie;
         },

         setCookie: function(cname, cvalue, exdays) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays*24*60*60*1000));
            var expires = "expires="+d.toUTCString();
            document.cookie = cname + "=" + cvalue + "; " + expires;
         },

         getCookie: function(cname) {
                var name = cname + "=";
                var ca = document.cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') c = c.substring(1);
                    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
                }
                return "";
         },


        _createBingBasemapToolbar: function () {

            var veTileLayer = new VETiledLayer({
                bingMapsKey: 'AscPI28h3D_XELPbaMB1iKgBJkyIsw2fXn5gav5vp0Vxr_B2_o7rBhsWM9rQceEP',
                mapStyle: VETiledLayer.MAP_STYLE_AERIAL_WITH_LABELS
            });

            connect.connect(veTileLayer, "onError", function (e) {
                veTileLayer.show();
                BootstrapDialog.alert("There was an error in the load: " + e.message);
            });
            var topoLayer = new ArcGISTiledMapServiceLayer("https://server.arcgisonline.com/arcgis/rest/services/USA_Topo_Maps/MapServer", {
                opacity: 1,
                visible: false,
                maxScale: 18000
            });

            var wmsLayer = new GoogleEarthWMS();


            this.map.addLayer(veTileLayer);
            this.map.addLayers([wmsLayer, topoLayer]);
            //this.map.addLayer(topoLayer);
            //this.map.addLayer(wmsLayer);
            this.VETileLayer = veTileLayer;
            var root = dom.byId("mapDiv_root");
            var tb = dc.create("div", { className: "btn-group ags-basemap-toolbar", style: {position: "absoloute", left: "50px", top: "15px"} }, root);

            var input1 = dc.create("button", { className: "btn btn-default", innerHTML: "Map" }, tb);
            var input2 = dc.create("button", { className: "btn btn-default", innerHTML: "Hybrid" }, tb);
            var input3 = dc.create("button", { className: "btn btn-default", innerHTML: "Aerials" }, tb);

            var hideTopo = function () {
                topoLayer.hide();
                wmsLayer.hide();
            }

            $(input1).click(function (e) { event.stop(e); veTileLayer.setMapStyle(VETiledLayer.MAP_STYLE_ROAD); hideTopo(); veTileLayer.show(); });
            $(input2).click(function (e) { event.stop(e); veTileLayer.setMapStyle(VETiledLayer.MAP_STYLE_AERIAL_WITH_LABELS); hideTopo(); veTileLayer.show(); });
            $(input3).click(function (e) { event.stop(e); veTileLayer.setMapStyle(VETiledLayer.MAP_STYLE_AERIAL); hideTopo(); veTileLayer.show(); });

            var input4 = dc.create("button", { className: "btn btn-default", innerHTML: "Topo" }, tb);
            $(input4).click(function (e) {
                event.stop(e); veTileLayer.hide(); wmsLayer.show(); topoLayer.show();
            });



        },

        _createBasemapToolbar: function () {
            config.basemapToolbar.map = this.map;
            var tb = new BasemapToolbar(config.basemapToolbar, "#mapDiv_root");
            this.basemapToolbar = tb;
        },

        setBasemap: function (basemap) {
            if (this.basemapToolbar) {
                this.basemapToolbar._changeBasemap(basemap);
            }
        },

        _makeFeatureLayer: function (options) {
            if (options.visible == undefined) options.visible = true;

            var flayer = new FeatureLayer(options.url, {
                mode: FeatureLayer.MODE_ONDEMAND,
                outFields: ["*"], id: options.id,
                opacity: options.opacity,
                visible: options.visible
            });

            // if Options has a template
            if (options.template) {
                var template = new InfoTemplate();
                template.setTitle(options.template.title);
                var html = $(options.template.node).html();
                //console.debug(html);
                if (html != undefined) {
                    template.setContent(html);
                    flayer.setInfoTemplate(template);
                }
            }

            // If you need to render in some way
            if (options.renderer) {

                switch (options.renderer.type) {
                    case "polygon":
                        if (options.renderer.color) {
                            var sym = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                        new Color(options.renderer.outline.color), options.renderer.outline.width),
                                        new Color(options.renderer.color));
                            var render = SimpleRenderer(sym);
                            flayer.renderer = render;

                        } else {
                            var sym = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                       new Color(options.renderer.outline.color), options.renderer.outline.width));
                            var render = SimpleRenderer(sym);
                            flayer.renderer = render;
                        }
                }
            }

            // min & max scale
            if (options.minScale || options.maxScale) {
                flayer.on("load", function () {
                    if (options.minScale) flayer.setMinScale(options.minScale);
                    if (options.maxScale) flayer.setMaxScale(options.maxScale);
                });
            }

            return flayer;
        },
        _makeLayer: function (a) {
            var getLayersByLayerName = function (c, f) {
                var b = [],
                d = c.layerInfos.length;
                while (d--) {
                    var a = c.layerInfos[d];
                    if (f.contains(a.name)) {
                        b.push(a.id);
                        if (a.subLayerIds != undefined) {
                            var e = a.subLayerIds.length;
                            while (e--) b.push(a.subLayerIds[e])
                        }
                    }
                }
                return b
            };


            var c = typeof a.opacity !== "undefined" ? a.opacity : 1,
            d = typeof a.visible !== "undefined" ? a.visible : true;
            a.type = typeof a.type !== "undefined" ? a.type : "Dynamic";
            var b = a.type === "Dynamic" ? new ArcGISDynamicMapServiceLayer(a.url, {
                id: a.id,
                opacity: c,
                visible: d
            }) : new ArcGISTiledMapServiceLayer(a.url, {
                id: a.id,
                opacity: c,
                visible: d
            });
            a.layer = b;
            b.on("error", function (a) {
                console.debug(b);
                console.debug(a);
                //alert("Error: "  + a.message)
            });
            if (a.layers) b.on("load", function () {
                if (a.layers[0] == "All") return;
                var c = getLayersByLayerName(b, a.layers);
                if (c.length > 0) {
                    b.setVisibleLayers(c);
                    a.visible ? b.show() : b.hide()
                } else b.hide()
            });

            if (a.minScale || a.maxScale) {
                b.on("load", function () {
                    if (a.minScale != undefined) b.setMinScale(a.minScale);
                    if (a.maxScale != undefined) b.setMaxScale(a.maxScale);
                });
            }


            return b
        },
        _getQuerystring: function (a) { a = a.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]"); var c = "[\\?&]" + a + "=([^&#]*)", d = new RegExp(c), b = d.exec(window.location.href); return b == null ? "" : decodeURIComponent(b[1].replace(/\+/g, " ")) },
        _getLayersByLayerName: function (c, f) { var b = [], d = c.layerInfos.length; while (d--) { var a = c.layerInfos[d]; if (f.contains(a.name)) { b.push(a.id); if (a.subLayerIds != undefined) { var e = a.subLayerIds.length; while (e--) b.push(a.subLayerIds[e]) } } } return b },
        _loadLayers: function () {
            var mapLayers = [];
            var map = this.map;

            var makeFeatureLayer = this._makeFeatureLayer;
            var makeLayer = this._makeLayer;

            $.each(config.operationalLayers, function (indx, item) {
                item.layer = (item.type === "FeatureLayer") ? makeFeatureLayer(item) : makeLayer(item);
                mapLayers.push(item.layer);
            });

            var h = this.map.on("layers-add-result", lang.hitch(this, function () {
                connect.disconnect(h);
                this._processBasicRequest();
            }));
            this.map.addLayers(mapLayers);

        },

        _loadComplete: function () {

            if (!this.isLoaded) {
                esri.setRequestPreCallback(function (ioArgs) { if (ioArgs.url.indexOf("GPServer") > -1) { ioArgs.preventCache = true; } return ioArgs; });
                this.emit("load-complete", {});
            }
        },

        _processBasicRequest: function () {
            // only do this on initial load...
            if (this.loaded) return;
            this.loaded = true;

            var address = this._getQuerystring("address");
            if (address) {
                var gc = new GoogleGeocoder({map: this.map});
                gc.on("execute-complete", lang.hitch(this, function () {
                    this.showImagery();
                    //this.emit("load-complete", {});
                    this._loadComplete();
                }));
                gc.findLocation(address);

                return;
            }

            var pid = this._getQuerystring("pid");
            if (pid) {

               var ps = new ParcelSearch({map: this.map, url: config.parcelSearchUrl });

                ps.doSearch("OBJECTID=" + pid, true);
                //this.emit("load-complete", {});
                this._loadComplete();
                this.showImagery();
                return;
            }

            var county = this._getQuerystring("county");
            if (county) {
               var cs = new CountySearch({ map: this.map, url: config.countyUrl }, "");

                cs.doSearch(county);
                //this.emit("load-complete", {});
                this._loadComplete();
                return;
            }

            var latlong = this._getQuerystring("coords");
            if (latlong) {
               var coordSearch = new CoordinateSearch({ url: config.geoServiceUrl, zoom: 15 });
                coordSearch.on("error", function (e) {
                    alert(e.message);
                });
                coordSearch.on("execute-complete", lang.hitch(this, function () {
                    //this.emit("load-complete");
                    this._loadComplete();
                }));
                this.showImagery();
                coordSearch.execute(latlong);
                return;
            }

            this._loadComplete();
        },

        _onStateChange: function (e) {
            var state = {};
            topic.publish("state-change", state);
        },

        popState: function(u) {
            topic.publish("window-pop-state", { object: u });

            if (this.extentChangeHandler == null) {
                this.enableHistory();
            }

            if (u.query.basemap) {
                this.setBasemap(u.query.basemap);
            }

            if (u.query.x && u.query.y && u.query.level) {
                var x = parseFloat(u.query.x);
                var y = parseFloat(u.query.y);
                var l = parseInt(u.query.level);

                var pt = new Point(x, y, map.spatialReference);
                this.extentChangeHandler.pause();

                // When the map has had its extent changed then resume writing history <<<<<<<<  A >>>>>>>>>>>
                on.once(map, "extent-change", lang.hitch(this, function (evt) {
                    //console.debug("resuming");
                    this.extentChangeHandler.resume();
                }));
                this.map.centerAndZoom(pt, l);
            }
        },

        enableHistory: function () {
            if (this.extentChangeHandler == null) {
                this.extentChangeHandler = on.pausable(this.map, "extent-change", lang.hitch(this, this._onStateChange));
            }
        },

        checkState: function (state) {
            return JSON.stringify(state) === JSON.stringify(window.history.state);
        },

        pushState: function(state){
            var pt = this.map.extent.getCenter();
            var l = this.map.getLevel();
            state.basemap = this.map.getBasemap();
            state.x = pt.x;
            state.y = pt.y;
            state.level = l;

            var params = $.param(state);
            window.history.pushState(state, null, this.page + params);
        },

        showImagery: function (value) {
            this.setBasemap("Aerials");
        },

        showError: function (a) {
            $(".sidepanel").hide();
            $("#ERRORPANEL").show();
            var b = a; if (a.message) { b = a.message; $.each(a.details, function (c, a) { b += "<br/>" + a }) }
            $("#ERRORMESSAGE").html(b)
            alert(b);
        },

        zoomToFeatures: function (features) {
            this.map.setExtent(graphicUtils.graphicsExtent(features), true);
        },

        createSymbol: function (options) {
            if (options.type == "polygon") {
                var sym = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                      new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                        new Color(options.outline.color), options.outline.width),
                                        new Color(options.color));
                return sym;
            } else if (options.type == "polyline") {
                var sym = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                        new Color(options.color), options.width);
                return sym;
            } else if (options.type == "marker") {
               var sym = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, options.size,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color(options.outline.color), options.outline.width),
                    new Color(options.color));
               return sym;
            }
        },

        addGraphicsLayer: function (graphics, name) {
            var glayer = new GraphicsLayer({ id: name });
            this.map.addLayer(glayer);
            $.each(graphics, function (indx, g) {
                glayer.add(g);
            });
        },

        InitPopupDisplay: function () {
            var popup = this.map.infoWindow;

            popup.on("show", lang.hitch(this, function () {
                $("#ags-panel-details").show();
            }));
            popup.on("hide", lang.hitch(this, function () {
                this.map.graphics.clear();
            }));
            this.map.infoWindow.set("popupWindow", false);
            popup.on("set-features", lang.hitch(this, this._onSetPopupFeatures));
            popup.on("selection-change", lang.hitch(this,  function () {
                this._populatePopup(popup.getSelectedFeature());
            }));

            popup.on("clear-features", function () {
                $("#ags-panel-details").hide();
            });
        },

        _onSetPopupFeatures: function(features) {
            var popup = this.map.infoWindow;
            this._updatePopupPager();
        },

        _updatePopupPager: function() {
            var popup = this.map.infoWindow;

            $("#detailspager").empty();
            if (popup.count > 1) {
               $("#details").hide();

                var d = dc.create("div", {}, dom.byId("detailspager"));
                dc.create("div", {
                    innerHTML: popup.features.length + " Features Found",
                    className: "nav"
                }, d);
                var lg = dc.create("div", { className: "list-group"}, d);

                var pfn = lang.hitch(this, this._populatePopup);
                $.each(popup.features, function(indx, item) {
                    var li = dc.create("div", {
                        className: "list-item"
                    }, lg);
                    var a = dc.create("a", {
                        innerHTML: item.layerName,
                        href: "javascript:void(0);"
                    }, li);

                    $(a).click(function () {
                        //pfn(item);
                        popup.select(indx);
                    });
                });

                dc.create("hr", { }, d);
            }
        },

        _populatePopup: function (feature) {
            if (feature) {

                var content = feature.getContent();
                $("#details").html(content);
                $("#details").show();
                $(".button").button();

                var fn = lang.hitch(this, function () {
                    this.zoomToFeatures([feature]);
                });
                var div = $("<div>");
                var zoomBtn = $("<button>");
                $(zoomBtn).text("Zoom To").appendTo(div).addClass("btn btn-primary").mousedown(fn);
                $(div).addClass("ags-details-nav").appendTo("#details");

                var fn2 = lang.hitch(this, function () {
                    var popup = this.map.infoWindow;
                    popup.clearFeatures();
                    $("#details").html("<p>No features identified</p>")
                    $("#detailspager").empty();
                });

                var clearBtn = $("<button>");
                $(clearBtn).text("Clear").appendTo(div).addClass("btn btn-warning").click(fn2);

                topic.publish("popup-populated");
            }
        },

        enableIdentify: function (id) {
            var params = {};
            params.tasks = [];
            params.excludedLayers = ["County_Boundary_WM", "COUNTY_BOUNDARY_WM"];
            params.excludedMapLayers = ["layer0", "layer1", "layer2", "County Boundary"];
            params.map = this.map;
            params.tract_id = id;
            var idTool = new IdentifyTool(params);
            return idTool;
        }
    });
});
