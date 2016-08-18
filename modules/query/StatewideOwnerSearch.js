define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/graphicsUtils"
], function (
  declare, lang, QueryTask, Query, graphicUtils

) {
    return declare([], {

        inputArray: null,
        map: null,

        constructor: function (params, attachTo) {
            this.map = params.map;
            this.inputArray = params.values;

    
            var html = "<div class='ownersearch'><div><span class='swos_caption_county'></span></div>"
                     + "<div><select id='swos_select_county'></select></div>"
                     + "<div class='swos_owner'><div><span class='swos_caption_owner'></span></div>"
                     + "<div><input type='text' id='swos_ownername' placeholder='Enter Owner Name'/></div></div>"
                     + "<div class='swos_results'></div></div>";


            var map = this.map;
            var counties = ["Alamance", "Alexander", "Alleghany", "Anson", "Ashe", "Avery", "Beaufort", "Bertie", "Bladen", "Brunswick", "Buncombe", "Burke", "Cabarrus", "Caldwell", "Camden", "Carteret", "Caswell", "Catawba", "Chatham", "Cherokee", "Chowan", "Clay", "Cleveland", "Columbus", "Craven", "Cumberland", "Currituck", "Dare", "Davidson", "Davie", "Duplin", "Durham", "Edgecombe", "Forsyth", "Franklin", "Gaston", "Gates", "Graham", "Granville", "Greene", "Guilford", "Halifax", "Harnett", "Haywood", "Henderson", "Hertford", "Hoke", "Hyde", "Iredell", "Jackson", "Johnston", "Jones", "Lee", "Lenoir", "Lincoln", "McDowell", "Macon", "Madison", "Martin", "Mecklenburg", "Mitchell", "Montgomery", "Moore", "Nash", "New Hanover", "Northampton", "Onslow", "Orange", "Pamlico", "Pasquotank", "Pender", "Perquimans", "Person", "Pitt", "Polk", "Randolph", "Richmond", "Robeson", "Rockingham", "Rowan", "Rutherford", "Sampson", "Scotland", "Stanly", "Stokes", "Surry", "Swain", "Transylvania", "Tyrrell", "Union", "Vance", "Wake", "Warren", "Washington", "Watauga", "Wayne", "Wilkes", "Wilson", "Yadkin", "Yancey"];

            $(attachTo).html(html);

            if (params.CountyCaption == undefined) { params.CountyCaption = "Select the county" }
            $(".swos_caption_county").html(params.CountyCaption);

            if (params.OwnerCaption == undefined) { params.OwnerCaption = "Enter Owner Name" }
            $(".swos_caption_owner").html(params.OwnerCaption);

            var select = "#swos_select_county";
            var swos_results = ".swos_results";

            //var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 255]), 4), new Color([255, 0, 255, 0.01]));
            var txtbox = "#swos_ownername";

            i = 0;
            il = counties.length;
            $(select).append("<option value=''>---Choose a County---</option>");
            for (i = 0, il = counties.length; i < il; i++) {
                $(select).append("<option value='" + counties[i] + "'>" + counties[i] + "</option>");
            };
            $(".swos_owner").hide();
            $(select).change(function () {
                $(swos_results).empty();
                $(".swos_owner").show();
                $(txtbox).val("");
                $(txtbox).focus();
            });

            var parcelSearchTask = new QueryTask(params.url);
            var parcelSearchQuery = new Query();
            var doSearch = function () {

                $(swos_results).empty().append(config.workingHTML);
                var value = $("#swos_ownername").val();

                if (value == "")
                    return;

                var where = "(OWNER1 like '%" + value + "%' OR OWNER2 like '%" + value + "%')";
                var county = $("#swos_select_county").val();
                if (county != "") {
                    where += " AND (COUNTY='" + county + "')";
                }

                parcelSearchQuery.where = where;
                parcelSearchQuery.outFields = ["OWNER1", "OWNER2", "COUNTY", "PIN", "PHYSADDR", "PHYSCITY"]
                parcelSearchQuery.returnGeometry = false;

                var content = $("#ParcelTemplate").html();

                parcelSearchTask.execute(parcelSearchQuery, function (results) {
                    $(swos_results).empty();
                    $(swos_results).append(results.features.length + " Features Found");
                    $.each(results.features, function (indx, result) {
                        var record = esri.substitute(result.attributes, content);
                        var d = $("<div>");
                        d.html(record).appendTo(swos_results).click(function () {
                            $(swos_results).empty().append(config.workingHTML);
                            var owner = result.attributes.OWNER1;
                            parcelSearchQuery.returnGeometry = true;
                            parcelSearchQuery.where = "OWNER1 = '" + owner + "' AND COUNTY = '" + county + "'";
                            parcelSearchTask.execute(parcelSearchQuery, function (results) {
                                var g = results.features[0];
                                map.setExtent(g.geometry.getExtent(), true);
                                $(swos_results).empty();
                                params.onComplete(g);
                            });
                        });
                    });
                    $(swos_results + " .record:odd").addClass("odd");

                    $(".record").hover(function () {
                        $(this).addClass("highlight");
                    }, function () {
                        $(this).removeClass("highlight");
                    });
                });
            };


            $("#swos_ownername").attr("title", "Enter Owner Name");
            $("#swos_ownername").attr("autocomplete", "off");
            $("#swos_ownername").autocomplete({
                source: function (request, response) {
                    doSearch();
                },
                minLength: 4
            });



        }


    });
});

