define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/Evented",
  "dojo/topic",
  "dojo/_base/json",
  "dojo/dom-construct",
  "dojo/dom",
  "esri/tasks/PrintTask",
  "esri/tasks/Geoprocessor",
  "esri/geometry/scaleUtils",
  "modules/BootStrapDialog",
  "dojo/domReady!"
], function (
  declare, lang, Evented, topic, dojo,  dc, dom,PrintTask, Geoprocessor, scaleUtils, BootStrapDialog
) {
    return declare([Evented], {
        url: null,
        printTask: null,
        gpPrintTask: null,
        node: null,
        map: null,       
        tractid: null,        
        visible: null,
        token: null,
        loaded: null,
        closeOnPrint: false,
        tractAttributes: null,
        dialog: null,
        constructor: function (options, attachTo) {
            this.map = map;
            this.node = document.createElement("div");
            $("body").append(this.node);
            this.visible = false;
            this.loaded = false;
            topic.subscribe("window-pop-state", lang.hitch(this, this.handlePopState));
            topic.subscribe("state-change", lang.hitch(this, this._onStateChange));
            
        },

        startUp: function () {
            
            this.dialog = new BootStrapDialog({isPanel: false, href:"assets/PrintPage2.html", title: "Print"});

            var d = this.dialog.startup();
            d.then(lang.hitch(this, this._interfaceLoaded));

            this.printTask = new PrintTask(config.printTaskUrl);
            this.printTask.on("error", lang.hitch(this, this._error));

            this.gpPrintTask = new Geoprocessor(config.printTaskUrl);
            this.gpPrintTask.on("error", lang.hitch(this, this._error));

            this.getToken();

        },


        getToken: function(){
            
            $.ajax({
                url: "printToken.ashx",
                type: "get",
                contentType: 'application/json; charset=utf-8',
                success: lang.hitch(this, function (data) {
                    this.token = data;
                })
           });
        },

        _interfaceLoaded: function () {
            
            this.loaded = true;
            $(".ags-print-panel").hide();
            this.emit("load-complete", {});                              
            $(".ags-print-main").show();

            $(".usespecificscale").click(function () {
                $(".ags-print-map-scale").fadeToggle();
            });

            var closeBtn = dc.toDom("<button type='button' class='btn btn-default print-nav tract-close-button' data-dismiss='modal'>Close</button>");
            $(closeBtn).click(lang.hitch(this, this.close));

            var printBtn = dc.toDom('<button type="button" class="btn btn-primary tract-print-button print-nav">Print</button>');
            $(printBtn).click(lang.hitch(this, this.print));
            var printClose = dc.toDom('<button type="button" class="btn btn-primary tract-print-close-button print-nav">Print & Close</button>');
            $(printClose).click(lang.hitch(this, this.printClose));
            dc.place(closeBtn, this.dialog.footerDiv);
            dc.place(printBtn, this.dialog.footerDiv);
            dc.place(printClose, this.dialog.footerDiv);
            $(this.dialog.contentDiv).css({height: "400px", overflow: "auto", width: "auto"})

          
        },

        _error: function (e) {            
            $(".ags-print-error").html("Error:" + e.error.message);
            $(".ags-print-panel").hide();
            $(".ags-print-error-message").show();
            $(".modal-footer").show();
            if (e.error.details) {
                $.each(e.error.details, function (i, de) {
                    $(".ags-print-error").append("<p>" + de + "</p>");
                });
            }
        },
        _onShow: function () {
            
            

            $(".ags-panel").hide();
            $(".ags-print-panel").hide();
            $(".modal-footer").show();
            this.visible = true;
            $(".ags-print-main").show();
            this.dialog.show();

                      
            

            if ($(".usespecificscale").is(":checked")) {
                $(".ags-print-map-scale").val(Math.round(scaleUtils.getScale(this.map)));
            }

        },
        show: function () {
            //var h = $(".main-container").height();
            //$(".ags-content-panel").hide();
            //$(this.node).show();;
            //if (h > 0) {
            //    $(this.node).css({
            //        "width": "100%", "height": h + "px", "overflow": "auto"
            //    });
            //}
            this._onShow();
        },

        close: function() {

            $(".ags-content-panel").first().show();
            $(this.node).hide();

            this.visible = false;
            this.emit("close", {});

        },


               

        _createformGroup: function (p, c) {

            var d = dc.create("div", { className: "form-group" }, c);
            var l = dc.create("label", {
                className: "col-sm-6 control-label",
                innerHTML: p.text
            }, d);
            var d1 = dc.create("div", {
                className: "col-sm-6"
            }, d);

            var control = dc.create("input", {
                type: "text", className: "form-control", placeholder: p.placeholder
            }, d1);
            return control;

        },



        populate: function (data) {
            // plot name                                      
            $(".tract-name").val(data.tract_name);           
            $(".tract-label").val(data.tract_label);
            $(".map-name").val("");
            this.tractid = data.tractid;                    
            this.tractAttributes = data;


           






        },

        _getAttributesFromForm: function () {

            var data = this.tractAttributes;
            data.MapName = $(".map-name").val() + " ";
            data.TractName = $(".tract-name").val() + " ";
            data.TractLabel = $(".tract-label").val();
            data.Company = $(".company").val();
            data.Author = $(".author").val();
            data.TractID = this.tractid;
            data.Disclaimer = config.printDisclaimer;

            var reportData = [];
            for (att in data) {
                var obj = {};
                var value = data[att] || " ";
                value = value.toString().trim();
                if (value.toLowerCase() == "null") value = " ";
                if (value.toLowerCase() == "undefined") value = " ";
                if (value.indexOf("undefined") > 0) value = " ";
                if (value == "") value = " ";
                obj[att] = value;
                reportData.push(obj);
            };
            return reportData;
        },

        _printSucceeded: function (results) {
            
            this.emit("success");

            if (this.closeOnPrint) {
                window.open(results[0].value.url + "?ts=" + new Date().getTime());
                this.close();
            } else {
                var url = results[0].value.url + "?ts=" + new Date().getTime();
                $(".ags-success-button").empty().append("<span>Click <a href='" + url + "' target='_blank'>here</a> to download your map</span>");
              
                $(".ags-print-panel").hide();
                $(".ags-print-success").show();
                $(".modal-footer").show();
            }                       
        },

        print: function () {
            this.closeOnPrint = false;
            this._print();
        },

        printClose: function () {
            this.closeOnPrint = true;
            this._print();
        },


        _print: function () {

           

            $(".ags-print-panel").hide();
            $(".ags-print-message").show();
            $(".modal-footer").hide();

            // get the Parameters entered by user            
            var title = " ";
            var tmp = "";
            var format = "PDF";

            // report size
            var formVals = $(".page-size-form").serializeArray();
            var pagesizeval = formVals[0].value;
           
            var formVals = $(".print-options-form").serializeArray();
            var pageori = formVals[0].value;            
            var grid = formVals[1].value;
 
            tmp = "fppt_" + pagesizeval + "_" + pageori +  "_" + grid;

            // get the web map as json object
            var webmapjson = this.printTask._getPrintDefinition(map);
            var token = this.token;
            
            $.each(webmapjson.operationalLayers, function (indx, l) {
                if (l.url) {
                    l.url = l.url.replace("https://www.ncmhtd.com", "http://localhost:6080");

                    if (l.url.indexOf("secure/FPPT") > 0) {
                        l.token = token;
                    }                   
                }
            });

            
            if ($(".usespecificscale").is(":checked")) {
                var scale = $(".ags-print-map-scale").val();
                if (!isNaN(scale)) {
                    webmapjson.mapOptions.scale = scale;
                }                
            }
            var layoutOptions = {};
            layoutOptions.customTextElements = this._getAttributesFromForm();
            layoutOptions.titleText = title;
            webmapjson.layoutOptions = layoutOptions;

            //console.debug(dojo.toJson(webmapjson));

            var printParams = { Web_Map_as_JSON: dojo.toJson(webmapjson), Format: format, Layout_Template: tmp }
            this.gpPrintTask.execute(printParams, lang.hitch(this, this._printSucceeded));           
            return false;

        },

       

        // History handling
        _onStateChange: function (e) {
           
        },

        handlePopState: function (e) {
            


        },

    });
});

