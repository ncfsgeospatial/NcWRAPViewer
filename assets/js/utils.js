if (!Array.indexOf) {
    Array.prototype.indexOf = function (obj) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == obj) {
                return i;
            }
        }
        return -1;
    }
}

Array.prototype.remove = function (obj) {
    var a = [];
    var i = this.length;
    while (i--) {
        var val = this[i];
        if (val != obj) {
            a.push(val);
        }
    }
    return a;
};

Array.prototype.contains = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
};

function extentHistoryChangeHandler() {
    //dijit.byId("zoomprev").disabled = navToolbar.isFirstExtent();
    //dijit.byId("zoomnext").disabled = navToolbar.isLastExtent();
}

function showLoading() {
    //esri.show(loading);
    //$("#progressBar").show();
    map.hideZoomSlider();
}

function hideLoading(error) {
    //esri.hide(loading);
    //$("#progessBar").hide();
    map.showZoomSlider();

}

// FORMAT NUMBERS WITH COMMAS
function addCommas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

// RESIZE THE MAP
function resizeMap(maps) {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
        dojo.forEach(maps, function (aMap) {
            aMap.resize();
            aMap.reposition();
        });
    }, 500);
}

function changeBaseMap(id) {
    dojo.forEach(basemapGallery, function (basemap) {
        if (basemap.id === id)
            basemap.show();
        else
            basemap.hide();
    });
}

function zoomMap(feature) {

    var fExtent = feature.geometry.getExtent();
    map.setExtent(fExtent);
}


// for point, create extent for point feature, then set extent
function zoom2pt(feature, PtOffset) {

    // if offset not passed use default of 1000
    var offset = PtOffset ? PtOffset : 1000;


    var xMin, yMin, xMax, yMax;
    //set extent from point

    var lat = feature.geometry.y;
    var lon = feature.geometry.x;


    pExtent = new esri.geometry.Extent();


    pExtent.xmin = lon - offset;
    pExtent.ymin = lat - offset;
    pExtent.xmax = lon + offset;
    pExtent.ymax = lat + offset;
    pExtent.spatialReference = feature.geometry.spatialReference;


    //set map extent
    map.setExtent(pExtent);
}

//Progress bar function	
//turn on progress bar
function toggleProgressBarOn() {
    //esri.show("progressBar");
    $("#progressBar").show();


}
//turn off bar if all layers have loaded
function toggleProgressBarOff() {
    //esri.hide("progressBar");

    $("#progressBar").hide();


}
function disableToolbar() {
    navToolbar.deactivate();
    map.enableScrollWheelZoom();
}

function loadAdditionalLayers() {
    var lyrs2Add = [];
    var il = additionalLayers.length;
    var i = 0;
    for (i = 0; i < il; i++) {
        var item = additionalLayers[i];
        var lyr = null;
        if (item.isTiled == false) {
            lyr = new esri.layers.ArcGISDynamicMapServiceLayer(item.url, { id: item.title, opacity: item.transparency, visible: item.visible });
        } else {
            lyr = new esri.layers.ArcGISTiledMapServiceLayer(item.url, { id: item.title, opacity: item.transparency, visible: item.visible });
        }
        if (item.visibleLayers != undefined) {
            lyr.setVisibleLayers(item.visibleLayers);
        }
        lyrs2Add.push(lyr);
    };
    map.addLayers(lyrs2Add);
}



function makeQueryUrl(serviceName, layerName) {

    var lyr = map.getLayer(serviceName);
    if (lyr != null) {
        var i = 0;
        var l = lyr.layerInfos.length;
        while (i < l) {
            if (lyr.layerInfos[i].name.toUpperCase() === layerName.toUpperCase()) {
                return lyr.url + "/" + i;
            }
            i++;
        }
    }

}


function getQuerystring(a) { a = a.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]"); var c = "[\\?&]" + a + "=([^&#]*)", d = new RegExp(c), b = d.exec(window.location.href); return b == null ? "" : decodeURIComponent(b[1].replace(/\+/g, " ")) }
