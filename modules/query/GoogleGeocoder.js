define([
  "dojo/_base/declare",
  "dojo/_base/lang",
   "dojo/Evented",
  "esri/symbols/PictureMarkerSymbol",
  "esri/geometry/Multipoint",
  "esri/geometry/Point",
  "esri/SpatialReference",
  "esri/geometry/webMercatorUtils",
  "esri/graphic"
], function (
  declare, lang, Evented, PictureMarkerSymbol, Multipoint, Point, SpatialReference, webMercatorUtils, Graphic
) {
    return declare([Evented], {

        

        geocoder: null,
        zoomLevel: null,
        showHint: null,
        constructor: function (options, attachTo) {

            this.showHint = true;
            this.zoomLevel = options.zoomLevel || 15;

            if (attachTo) {
                $(attachTo).empty().load("assets/GoogleGeocoder.html", _initUI);
            }

        },

        _initUI: function () {

            var form = $(attachTo).find("form");
            var txt = $(attachTo).find(".gc-txtsearchbox");
            $(attachTo).css("display", "none").addClass("modal fade").attr("aria-hidden", "true");

            var findLocation = this.findLocation;
            $(form).submit(function () {
                findLocation($(txt).val());
            });

            $(txt).attr("autocomplete", "off");

            var geocoder = this.geocoder;

            if (this.showHint == true) {
                var cache = {};
                $(txt).autocomplete({
                    source: function (request, response) {

                        if (geocoder == undefined) {
                            geocoder = new google.maps.Geocoder();
                        }
                        var term = request.term;
                        if (term in cache) {
                            response($.map(cache[term], function (loc) {
                                return {
                                    label: loc.formatted_address,
                                    value: loc.formatted_address
                                }
                            }));
                            return;
                        }
                        //
                        geocoder.geocode({ 'address': request.term }, function (results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                cache[term] = results;
                                response($.map(results, function (loc) {
                                    return {
                                        label: loc.formatted_address,
                                        value: loc.formatted_address
                                    }
                                }));


                            } else {

                                console.debug(status);
                            }
                        });
                    },
                    minLength: 5,
                    select: function (event, ui) {
                        var item = ui.item;
                        $(txt).val(ui.item.value);
                        $(form).submit();
                        $(".modal").hide();
                        $(".modal-backdrop").remove();
                        return false;
                    },
                    open: function () {
                        $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
                    },
                    close: function () {
                        $(this).removeClass("ui-corner-top").addClass("ui-corner-all");
                    }
                });

            }  // end show autocomplete


        },

        findLocation: function (value) {
            var geocoder = this.geocoder;
            if (geocoder == undefined) geocoder = new google.maps.Geocoder();
            var zoomLevel = this.zoomLevel;

            var indx = value.indexOf(",NC, US");
            if (indx < 0)
                value = value + ",NC, US";

            geocoder.geocode({ 'address': value }, lang.hitch(this, this.onGeocodeComplete));

        },

        onGeocodeComplete: function (results, status) {

            var zoomLevel = this.zoomLevel;
            if (status == google.maps.GeocoderStatus.OK) {
                var items = [];
                var symbol = new PictureMarkerSymbol('images/pin.png', 52, 52);
                var points = new Multipoint(map.spatialReference);
                $.each(results, function (indx, item) {

                    if (item.geometry.bounds) {
                        var northEast = item.geometry.bounds.getNorthEast();
                        var pt = new Point(northEast.lng(), northEast.lat(), new SpatialReference({ wkid: 4326 }))
                        var geom = webMercatorUtils.geographicToWebMercator(pt);

                        var sw = item.geometry.bounds.getSouthWest();
                        var pt2 = new Point(sw.lng(), sw.lat(), new SpatialReference({ wkid: 4326 }))
                        var geom2 = webMercatorUtils.geographicToWebMercator(pt2);
                        points.addPoint(geom);
                        points.addPoint(geom2);
                    } else {

                        var location = item.geometry.location;
                        var pt = new Point(location.lng(), location.lat(), new SpatialReference({ wkid: 4326 }))
                        var geom = webMercatorUtils.geographicToWebMercator(pt);
                        var graphic = new Graphic(geom, symbol);
                        map.graphics.add(graphic);
                        points.addPoint(geom);
                    }

                });

                switch (points.points.length) {
                    case 0:
                        break;
                    case 1:
                        map.centerAndZoom(points.getExtent().getCenter(), zoomLevel);
                        break;
                    default:
                        map.setExtent(points.getExtent().expand(2));
                        break;
                }

                this.emit("execute-complete", {});

            } else {
                //dojo.byId("locatorError").innerHTML = "Geocode was not successful for the following reason: " + status;
            }
        }

    });
});

