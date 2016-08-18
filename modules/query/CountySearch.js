define([
  "dojo/_base/declare",
  "dojo/_base/lang",
   "dojo/Evented",
  "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/graphicsUtils"
], function (
  declare, lang, Evented, QueryTask, Query, graphicUtils

) {
    return declare([Evented], {

        inputArray: null,
        map: null,
        url: null,
        url2: null,
        attachTo: null,       
        constructor: function (options, attachTo) {
            this.map = options.map;
            this.inputArray = options.values;
            var counties = ["Alamance", "Alexander", "Alleghany", "Anson", "Ashe", "Avery", "Beaufort", "Bertie", "Bladen", "Brunswick", "Buncombe", "Burke", "Cabarrus", "Caldwell", "Camden", "Carteret", "Caswell", "Catawba", "Chatham", "Cherokee", "Chowan", "Clay", "Cleveland", "Columbus", "Craven", "Cumberland", "Currituck", "Dare", "Davidson", "Davie", "Duplin", "Durham", "Edgecombe", "Forsyth", "Franklin", "Gaston", "Gates", "Graham", "Granville", "Greene", "Guilford", "Halifax", "Harnett", "Haywood", "Henderson", "Hertford", "Hoke", "Hyde", "Iredell", "Jackson", "Johnston", "Jones", "Lee", "Lenoir", "Lincoln", "McDowell", "Macon", "Madison", "Martin", "Mecklenburg", "Mitchell", "Montgomery", "Moore", "Nash", "New Hanover", "Northampton", "Onslow", "Orange", "Pamlico", "Pasquotank", "Pender", "Perquimans", "Person", "Pitt", "Polk", "Randolph", "Richmond", "Robeson", "Rockingham", "Rowan", "Rutherford", "Sampson", "Scotland", "Stanly", "Stokes", "Surry", "Swain", "Transylvania", "Tyrrell", "Union", "Vance", "Wake", "Warren", "Washington", "Watauga", "Wayne", "Wilkes", "Wilson", "Yadkin", "Yancey"];
            this.inputArray = $.map(counties, function (county) {
                return { value: county, text: county }
            });
            
            this.onComplete = options.onComplete;
            this.url = options.url;
            this.attachTo = attachTo;

            this.url2 = "http://www.ncmhtd.com/arcgis/rest/services/AG_FS/CountyBase_for_FS_WM/MapServer/2";

        },

        startUp: function() {
                var attachTo = this.attachTo;

                var select = $("<select>");
                $(attachTo).empty().append(select);

                $(select).append("<option value=''>---Choose a County---</option>");
                $.each(this.inputArray, function (indx, item) {
                    $(select).append("<option value='" + item.value + "'>" + item.text + "</option>");
                });

                var query = new Query();
                var task = new QueryTask(options.url);
                $(select).change(lang.hitch(this, function () {
                    var value = $(select).val();
                    if (value == "") return;
                    this.doSearch(value);                    
                }));
        },

        doSearch: function (value) {

            var query = new Query();
            var task = new QueryTask(this.url);
            if (value == "") return;

            query.where = "CO_NAME = '" + value.toUpperCase() + "'";
            query.returnGeometry = true;
            task.execute(query, lang.hitch(this, function (results) {
                this.map.setExtent(graphicUtils.graphicsExtent(results.features), false);                
                this.emit("search-complete", {});
            }));

        }


    });
});

