define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/graphicsUtils",
  "dojo/_base/connect"
], function (
  declare, lang, QueryTask, Query, graphicUtils, connect

) {
    return declare([], {

        url: null,
        map: null,
        constructor: function (params, attachTo) {
            this.map = map;
            this.url = params.url;
        },

        doSearch: function (value, selectGraphics) {

            var query = new Query();
            var task = new QueryTask(this.url);
            if (value == "") return;

            query.where = value;
            query.returnGeometry = true;
            query.outFields = ["*"];
            task.execute(query, function (results) {
                map.setExtent(graphicUtils.graphicsExtent(results.features), true);
                if (selectGraphics == true) {

                    var h = map.on("zoom-end", function () {
                        connect.disconnect(h);
                        map.infoWindow.setFeatures(results.features);
                    });
                }
            });

        }


    });
});

