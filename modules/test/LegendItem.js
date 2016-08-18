define([
  "dojo/_base/declare",
  "dojo/_base/lang",  
  "esri/request",
  "dojo/dom-construct"
], function (
  declare, lang, esriRequest, dc, Legend

) {
    return declare([], {
        node: null,
        layer: null,
        legendUrl: null,
        baseUrl: null,
        token: null,
        constructor: function (params, node) {
            this.node = node;
            this.layer = params.layer;

            if (params.token) this.token = params.token;

            //console.debug(this.layer);
            this.legendUrl = "";
            if (this.layer.url) {

                var url = this.layer.url;
                var indx = url.indexOf("FeatureServer");
                if (indx < 0)
                    indx = url.indexOf("MapServer");


                var baseUrl = url.substr(0, indx);
                this.baseUrl = baseUrl;

                var chk = url.indexOf("arcgis");
                if (chk == -1) return;

                this.legendUrl = baseUrl + "/MapServer/legend"
            }

        },
        refresh: function () {

            if (this.legendUrl == "") return;

            var layersRequest = esriRequest({
                url:  this.legendUrl,
                content: { f: "json" },
                callbackParamName: 'callback',
                handleAs: 'json'
            });
            layersRequest.then(lang.hitch(this, this._legendCallback));

        },


        _legendCallback: function (data) {

            //console.debug(data);
            if (this.layer.type == "Feature Layer") {
                var id = this.layer.layerId;
                $.each(data.layers, lang.hitch(this, function (indx, item) {
                    if (item.layerId == id) {
                        //console.debug(id);
                        this._refreshNode(item);
                    }
                }));
            } else {
                this.legends = data.layers;
                $(this.node).append(this._createLegend());
            }

        },

        _createLegend: function () {

            var d = dc.create("div");
            var visible = this.layer.visibleLayers;
            console.debug(visible);
            if (visible == undefined) return;

            var url = this.layer.url;

            if (visible == null) return;
            if (visible == undefined) return;

            var i = 0; n = this.legends.length;
            while (i < n) {

                if (visible.contains(this.legends[i].layerId)) {
                    var legendItem = this.legends[i];
                    $.each(legendItem.legend, function (indx, l) {
                        var img = $("<img>");
                        $(img).attr("src", url + "/" + legendItem.layerId + "/images/" + l.url);
                        $(d).append(img).append(l.label).append("<br/>");
                        //console.debug(img);
                    });
                }
                i++;
            }

            return d;

        },


        _refreshNode: function (legendItem) {
            var d = this.node;
            $(d).empty();

            var token = this.token;

            var lurl = this.baseUrl;
            $.each(legendItem.legend, function (indx, l) {
                var container = $("<div>");
                $(container).appendTo(d);
                var img = $("<img>");

                var url = lurl + "MapServer/" + legendItem.layerId + "/images/" + l.url;
                if (token!=null) url = "proxy.ashx?" + url 
                //console.debug(url);
                $(img).attr("src", url );
                $(container).append(img).append(l.label);
            });


        }


    });
});




