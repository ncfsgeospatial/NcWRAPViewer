

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/connect",
    "dojo/Evented",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "esri/tasks/IdentifyResult",
    "esri/InfoTemplate",
    "esri/graphic",
    "esri/symbols/PictureMarkerSymbol",
     "esri/lang"
],
function (declare, lang, connect, Evented, IdentifyTask, IdentifyParameters,
         IdentifyResult, InfoTemplate, Graphic, PictureMarkerSymbol, esriLang) {
    return declare([Evented], {
        map: null,
        visible: null,
        handle: null,
        symbol: null,
        node: null,
        tolerance: null,
        showEventGraphic: null,
        useButtons: null,
        taskList: null,
        tasks: null,
        excludedLayers: null,
        excludedMapLayers: null,
        excludedFields: null,
        workingHTML: null,
        tractid: 0,
        constructor: function (params) {

            this.map = params.map;
            this.tolerance = 3;
            this.symbol = new PictureMarkerSymbol("./images/pin.png", 24, 24);
            this.showEventGraphic = true;
            this.useButtons = true;
            this.node = "#details";
            if (params.tract_id != undefined) {
                this.tractid = params.tract_id;
            }

            this.excludedMapLayers = [];
            if (params.excludedMapLayers) this.excludedMapLayers = params.excludedMapLayers;
            this.tasks = params.tasks;
            this.excludedFields = ["SHAPE", "SHAPE.AREA", "SHAPE.LEN", "OBJECTID", "SHAPE.STAREA()", "SHAPE.STLENGTH()"];
            this.excludedLayers = params.excludedLayers;

            this.workingHTML = "<div class='callbackindicator'><center><img src='images/callbackactivityindicator.gif' alt='working' /><br/>Querying the GIS database...</center></div>";
            if (params.workingHTML) this.workingHTML = params.workingHTML;
     
            if (params.tasks.length == 0) {
                this.map.on("layer-add-result", lang.hitch(this, this.refresh));
                this.map.on("layers-add-result", lang.hitch(this, this.refresh));
                this.refresh();
            } else {
                this.taskList = $.map(params.tasks, lang.hitch(this, this._initLayer));
            }
            


        }, // end constructor

        refresh:function() {
            this._gatherMapLayers();
        },

        _getLayersByLayerName: function (c, f) { var b = [], d = c.layerInfos.length; while (d--) { var a = c.layerInfos[d]; if (f.contains(a.name)) { b.push(a.id); if (a.subLayerIds != undefined) { var e = a.subLayerIds.length; while (e--) b.push(a.subLayerIds[e]) } } } b = this._removeDups(b); return b },
        _getIdentifyLayers: function (e) { for (var b = e.visibleLayers, c = [], a = 0, f = b.length, a = 0; a < f; a++) { var d = e.layerInfos[b[a]]; !this.excludedLayers.contains(d.name) && c.push(d.id) } c = this._removeDups(c); return c; },

        _removeDups: function (a) {

            var b = [];
            $.each(a, function (i, c) {
                if (!(b.contains(c))) b.push(c);
            });
            return b;
        },

        _getGraphicContent: function (graphic, layerName) {

            var excludedFields = [];
            if (this.excludedFields) excludedFields = this.excludedFields;
           
            var content = "";
            var c = $("#" + layerName.replace(" ", "_") + "Template");
            if (c.length > 0) {
                content = $(c).html();
            } else {
                var data = [];
                data.push("<span class='ags-details-layer-label'>" + layerName + "</span>");
                data.push("<table>");
                var hasAttributes = false;
                for (att in graphic.attributes) {
                  
                    if (!excludedFields.contains(att.toUpperCase())) {
                        hasAttributes = true;                        
                        var value = graphic.attributes[att] || "";
                        var keyVal = { "FieldName": att, "Value": value }                        
                        if ((value.substr) && (value.substr(0, 4) == "http")) {
                            data.push(esriLang.substitute(keyVal, "<tr><td>&nbsp;</td><td class='ags-details-label'><a href='${Value}' target='blank'>${FieldName}</a></td></tr>"));
                        } else {
                            data.push(esriLang.substitute(keyVal, "<tr><td class='ags-details-label'>${FieldName}</td><td class='ags-details-value'>${Value}</td></tr>"));
                        }
                    }
                }
                if (hasAttributes == false) {
                    data.push("<tr><td class='ags-details-value' colspan='2'>" + layerName + " feature</td></tr>");
                }

                data.push("</table>");
                content = data.join("");
            }

            return content;
        },

        addEventGraphic: function (evt) {
            var symbol = this.symbol;
            var idg = new Graphic(evt.mapPoint, symbol);
            //this.map.graphics.add(idg);
        },

        _initLayer: function (item) {

            var lyr = this.map.getLayer(item.layer);
            if (lyr != null) {
                var idlayerids = [];
                if (item.idLayers != undefined) {
                    item.idLayerIds = this._getLayersByLayerName(lyr, item.idLayers);
                }
                
                var url = (item.url) ? item.url : lyr.url;
                var identifyTask = new IdentifyTask(url);
                var identifyParams = new IdentifyParameters();
                identifyParams.tolerance = this.tolerance;
                identifyParams.returnGeometry = true;
                identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
                item.task = identifyTask;
                item.params = identifyParams;
                item.loaded = true;
            } else {
                item.loaded = false;
            }
            return item;

        },

        _gatherMapLayers: function() {           
            var map = this.map;
            var tasks = [];
            $.each(this.map.layerIds, lang.hitch(this, function (indx, id) {
                
                if (!this.excludedMapLayers.contains(id)) {
                    var g1 = id.indexOf("layer");
                    if (g1 === 0)
                        return;


                    var lyr = map.getLayer(id);
                    var url = lyr.url;
                    
                    if (lyr.url.indexOf("MapServer") > 0) {
                        tasks.push({ layer: lyr.id });
                    }

                    
                }                
            }));

            

            $.each(this.map.graphicsLayerIds, lang.hitch(this, function (indx, id) {                
                if (!this.excludedMapLayers.contains(id)) {                    
                    var lyr = map.getLayer(id);                     
                    if (lyr && lyr.url) {                        
                        var url = lyr.url;
                        if (lyr.url.indexOf("FeatureServer") > 0) {                            
                            var indx = url.indexOf("FeatureServer");
                            var baseUrl = url.substr(0, indx);                            
                            url = baseUrl + "/MapServer/";
                            var layerId = lyr.layerId;                                                   
                            tasks.push({ layer: lyr.id, url: url, idLayerIds: [layerId] });
                        }
                        if (lyr.url.indexOf("MapServer") > 0) {
                            var indx = url.indexOf("MapServer");
                            var baseUrl = url.substr(0, indx);
                            url = baseUrl + "/MapServer/";
                            var layerId = lyr.layerId;
                            tasks.push({ layer: lyr.id, url: url, idLayerIds: [layerId] });
                        }
                    }
                }
            }));

            this.tasks = tasks;
            this.taskList = $.map(tasks, lang.hitch(this, this._initLayer));
        },

           

        onNoResults: function () {
           
            var f = map.infoWindow.features;            
            if (f== null || f.length == 0) {
                $(this.node).empty().append("No Features found at this location");
            }

        },

        onError: function (e) {
            var f = map.infoWindow.features;
            console.debug(f);
            if (f==null ||   f.length == 0) {
                $(this.node).empty().html("An Error Occurred in the Identify Task: " + e.message);
            }
        },

        onBegin: function () {
            $(this.node).empty().html(this.workingHTML);
        },

        _ProcessResults: function (idResults) {
            
            if (idResults.length == 0) {
                this.onNoResults();
                this.emit("no-results", {});
                return;
            }

            var tractid = this.tractid;

            var getContent = lang.hitch(this, this._getGraphicContent);

            var idFeatures = [];
            $.each(idResults, function (i, idResult) {
                console.debug(idResult);
                var graphic = idResult.feature;
                if (graphic.attributes["Tract ID"]) {                    
                    if (graphic.attributes["Tract ID"] == tractid) {
                       
                        idFeatures.push(graphic);
                        graphic.layerName = idResult.layerName;
                        var content = getContent(graphic, idResult.layerName);
                        var it = new InfoTemplate(idResult.layerName, content);
                        graphic.setInfoTemplate(it);
                    }
                    
                } else {
                    idFeatures.push(graphic);
                    graphic.layerName = idResult.layerName;
                    var content = getContent(graphic, idResult.layerName);
                    var it = new InfoTemplate(idResult.layerName, content);
                    graphic.setInfoTemplate(it);
                }

                
            });

            var prevFeatures = map.infoWindow.features;
            if (prevFeatures) {
                var features = prevFeatures.concat(idFeatures);
                this.map.infoWindow.setFeatures(features);
            } else {
                this.map.infoWindow.setFeatures(idFeatures);
            }

        },

        execute: function (evt) {            

            // show the info window         
            this.map.graphics.clear();
            this.map.infoWindow.clearFeatures();
            this.onBegin();
            if (this.showEventGraphic) {
                this.addEventGraphic(evt);
            }

            this.map.infoWindow.show(evt.mapPoint);

            var i = 0;

           
            
            var iExecute = 0;
            var ul = this.taskList.length;
            for (indx = 0; indx < ul; indx++) {
                var id2 = this.taskList[indx];
                if (id2.loaded == true) {
                    var lyr = this.map.getLayer(id2.layer);
                    if (lyr) {
                        if (lyr.visible == true) {
                            var identifyParams = id2.params;
                            var identifyTask = id2.task;                            
                            if (lyr.type == "Feature Layer") {
                                id2.idLayerIds = [lyr.layerId];                                
                            }

                            identifyParams.geometry = evt.mapPoint;
                            identifyParams.mapExtent = map.extent;
                            identifyParams.layerIds = id2.idLayerIds || this._getIdentifyLayers(lyr);                            
                            var d = identifyTask.execute(identifyParams);
                            iExecute++;
                            d.then(lang.hitch(this, this._ProcessResults)); //, lang.hitch(this, this.onError));
                        }
                    }
                }
            }

            if (this.map.infoWindow.features && this.map.infoWindow.features.length == 0) {
                this.onNoResults();
            }

            if (iExecute == 0) {
                this.onNoResults();
            }

        },


        onClick: function (evt) {
            this.execute(evt);
        },

        activate: function () {

            connect.disconnect(this.handle);
            this.handle = this.map.on("click", lang.hitch(this, "onClick"));
            this.emit("activated", {});
        },

        deactivate: function () {

            this.map.graphics.clear();

            connect.disconnect(this.handle);
            
        }

    }); // end return declare
});                                                            //end define