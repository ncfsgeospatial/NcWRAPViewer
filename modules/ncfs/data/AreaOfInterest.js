define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/Evented",
  "dojo/topic",
  "esri/layers/FeatureLayer",
  "esri/graphic",
  "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/tasks/GeometryService",
  "esri/geometry/webMercatorUtils", "esri/lang",
  "modules/ncfs/data/ParcelUpdater",
  "modules/BootStrapDialog"
], function (
  declare, lang, Evented, topic, FeatureLayer, Graphic, QueryTask, Query,
  GeometryService, webMercatorUtils, esriLang, ParcelUpdater, BootStrapDialog
) {
    return declare([Evented], {
        aoiid: null,
        featureLayer: null,
        gsvc: null,
        symbol: null,
        parcelLayer: null,
        parcelFeatures: null,
        LastName: null,
        FirstName: null,
        MiddleName: null,
        userName: null,
        feature: null,
        isNew: null,
        dialog: null,
        workingDialog: null,
        constructor: function (params) {
            this.featureLayer = params.layer;
            this.gsvc = new GeometryService(config.geoServiceUrl);
            this.parcelLayer = params.parcelLayer;
            this.isNew = true;
            this.userName = params.user;
        }, // end constructor

        addParcels: function (features) {
            var feature = features[0];
            this.LastName = feature.attributes.OWNER1;
            this.MiddleName = "";
            this.FirstName = "";
            this.parcelFeatures = features;
            this.add(features);
        },

        add: function (features) {
            var polygons = [];
            $.each(features, function (i, item) {
                polygons.push(item.geometry);
            });

            this.gsvc.union(polygons, lang.hitch(this, function (result) {
                var aoi = new Graphic(result);
                var pt = aoi.geometry.getExtent().getCenter();
                var attributes = {};
                attributes.aoi_id = 0;
                var d = new Date();
                attributes.date_created = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
                attributes.user_name = this.userName;
                attributes.aoi_acres = 0;
                attributes.county_name = "";
                attributes.ncfs_district = 0;
                attributes.ncfs_region = 0;
                attributes.owner_lastname = this.LastName;
                attributes.owner_firstname = this.FirstName;
                attributes.owner_middlename = this.MiddleName;
                var llpt = webMercatorUtils.webMercatorToGeographic(pt);
                attributes.remarks = "";
                attributes.latdecdeg = llpt.y.toFixed(3);
                attributes.longdecdeg = llpt.x.toFixed(3);
                aoi.attributes = attributes;

                this.feature = aoi;
                this.dialog = new BootStrapDialog({ href: "assets/aoieditor.html", title: "", isPanel: true });

                this.dialog.on("ui-loaded", lang.hitch(this, function () {
                    this.populate();
                }));
                this.dialog.startup();

            }));  // end union
        },

        editAttributes: function(aoi) {
            this.feature = aoi;
            this.isNew = false;

            if (this.featureLayer == undefined) {
                this.featureLayer = new FeatureLayer(config.aoiFeatureurl);
            }

            this.dialog = new BootStrapDialog({ href: "assets/aoieditor.html", isPanel: true });

            this.dialog.on("ui-loaded", lang.hitch(this, function () {
                this.populate();
            }));
            this.dialog.startup();
        },

        populate: function () {
            var dialog = this.dialog;
            var savebtn = $("<button type='button' class='btn btn-primary'>");
            var cancelBtn = $("<button type='button' class='btn btn-default'>");

            $(this.dialog.uiDialog).addClass("ncfs-edit-aoi");

            $(cancelBtn).click(lang.hitch(this, function () {
                dialog.hide();
                dialog.destroy();
                this.emit("update-cancel", {});
            })).appendTo(dialog.footerDiv).text("Cancel");

            $(dialog.footerDiv).addClass("right");

            $(savebtn).click(lang.hitch(this, function () {
                this.save();
               // dialog.destroy();
            })).appendTo(dialog.footerDiv).text("Save");

            var feature = this.feature;
            $(".aoi-name").val(feature.attributes.aoi_name);
            $(".aoi-label").val(feature.attributes.aoi_label);
            $(".aoi-owner-last").val(feature.attributes.owner_lastname);
            $(".aoi-owner-first").val(feature.attributes.owner_firstname);
            $(".aoi-owner-middle").val(feature.attributes.owner_middlename);
            $(".aoi-county").html(feature.attributes.county_name);
            $(".aoi-coords").html(feature.attributes.latdecdeg  + "," +feature.attributes.longdecdeg);
            $(".aoi-remarks").val(feature.attributes.remarks);
            $(".aoi-acres").val(feature.attributes.aoi_acres);

            if (this.isNew) {
                $(".aoi-acreage-container").hide();
            }

            this.dialog.show();

            this.emit("attribute-dialog-show", {});
            //topic.publish("ui-change", { visible: ".ncfs-edit-aoi", hidden: "" });
        },

        showWorkingPanel: function() {
            if (this.workingDialog == null) {
                this.workingDialog = new BootStrapDialog({ title: "Updating Area of Interest", href: "assets/working.htm", isPanel: true });
                this.workingDialog.startup();
            }

            this.workingDialog.show();
        },

        save: function () {
            this.showWorkingPanel();

            var attributes = this.feature.attributes;
            attributes.owner_lastname = $(".aoi-owner-last").val();
            attributes.owner_firstname = $(".aoi-owner-first").val();
            attributes.owner_middlename = $(".aoi-owner-middle").val();
            attributes.remarks = $(".aoi-remarks").val();
            attributes.aoi_name = $(".aoi-name").val();
            attributes.aoi_label = $(".aoi-label").val();

            if (this.isNew) {
                this.featureLayer.applyEdits([this.feature], null, null, lang.hitch(this, this.onAddComplete));
            } else {
                this.featureLayer.applyEdits(null, [this.feature], null, lang.hitch(this, this.onUpdateComplete));
            }
        },

        onUpdateComplete: function () {
            this.emit("update-complete", {});
            this.workingDialog.hide();
            this.dialog.destroy();
        },

        onAddComplete: function (adds, updates, deletes) {
            var a = adds[0];
            this.aoiid = a.objectId;
            this, this.saveParcels();
        },

        saveParcels: function() {
            if (this.parcelFeatures != null) {
                var pup = new ParcelUpdater({});
                pup.on("complete", lang.hitch(this, function () {
                    this.emit("add-complete", {});
                    this.workingDialog.hide();
                }));
                pup.on("error", lang.hitch(this, this.showError));
                pup.add(this.parcelFeatures, this.aoiid);
            } else {
                this.emit("add-complete", {});
                this.workingDialog.hide();
            }
        },

        showError: function(e){
            $(this.workingDialog.contentDiv).empty()

            if (e.error){
                $(this.workingDialog.contentDiv).html("Error:" + e.error.message);
                if (e.error.details) {

                    $.each(e.error.details, function (i, de) {
                        $(this.workingDialog.contentDiv).append("<p>" + de + "</p>");
                    });
                }
            } else {
                $(this.workingDialog.contentDiv).html("Error: Unexpected Error Occurred in Application");
            }
        }
    });
});
