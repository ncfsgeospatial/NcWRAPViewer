function getQuerystring(a) { a = a.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]"); var c = "[\\?&]" + a + "=([^&#]*)", d = new RegExp(c), b = d.exec(window.location.href); return b == null ? "" : decodeURIComponent(b[1].replace(/\+/g, " ")) }

var map;
var portalUrl = "https://www.arcgis.com";
require(["modules/ForestServiceMap.js",
        "modules/ncfs/data/AreaOfInterest.js",
        "esri/config",
        "esri/InfoTemplate",
        "esri/map",
        "esri/request",
        "esri/geometry/scaleUtils",
        "esri/SpatialReference",
        "esri/geometry/Point",
        "esri/layers/FeatureLayer",
        "esri/layers/KMLLayer",
        "esri/renderers/SimpleRenderer",
        "esri/symbols/PictureMarkerSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "lib/geojsonlayer.js",
        "dojo/dom",
        "dojo/json",
        "dojo/on",
        "dojo/parser",
        "dojo/sniff",
        "dojo/_base/array",
        "esri/Color",
        "dojo/_base/lang",
        "dojo/domReady!"],
  function (MiniMap, aoi, esriConfig, InfoTemplate, Map, request, scaleUtils, SpatialReference, Point, FeatureLayer,
            KMLLayer,SimpleRenderer, PictureMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol,
            GeoJsonLayer, dom, JSON, on, parser, sniff, arrayUtils, Color, lang) {

      var fsMap = new MiniMap();

      map = fsMap.map;
//      v                                                                                                                                                                                                                                                                          ar flayer = new FeatureLayer('https://www.ncmhtd.com/arcgis/rest/services/General/Parcels/FeatureServer/0', { mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"] });
//      var parcelLayer;
      fsMap.on("load-complete", function () {
          console.log('Map load complete');
          var pt = new Point(-8947161, 4216593, new SpatialReference({ wkid: 102100 }));
          map.centerAndZoom(pt, 6);
          console.log('Map load complete');
      });

      fsMap.startUp();

      on(dom.byId("uploadForm"), "change", function (event) {
          var fileName = event.target.value.toLowerCase();

          if (sniff("ie")) { //filename is full path in IE so extract the file name
              var arr = fileName.split("\\");
              fileName = arr[arr.length - 1];
          }
          if (fileName.indexOf(".gpx") !== -1)  {//is file a gpx - if not notify user
              generateFeatureCollection(fileName, 'gpx', FeatureLayer);
          }
          else if (fileName.indexOf(".zip") !== -1) {//is file a zip - if not notify user
              generateFeatureCollection(fileName, 'shapefile', FeatureLayer);
          }
          else if (fileName.indexOf(".km") !== -1) {//is file a zip - if not notify user
              kmlToArc(event.target.files[0]);
              // asynchronously do conversion
          }
          else {
              dom.byId('upload-status').innerHTML = '<p style="color:red">Add shape as .gpx, .kmz, .kml, or zipped shapefile as .zip file</p>';
          }
      });

      function generateFeatureCollection(fileName, filetype, layerClass) {
          var name = fileName.split(".");
          //Chrome and IE add c:\fakepath to the value - we need to remove it
          //See this link for more info: http://davidwalsh.name/fakepath
          name = name[0].replace("c:\\fakepath\\", "");

          dom.byId('upload-status').innerHTML = '<b>Loading </b>' + name;

          //Define the input params for generate see the rest doc for details
          //http://www.arcgis.com/apidocs/rest/index.html?generate.html
          var params = {
              'name': name,
              'targetSR': map.spatialReference,
              'maxRecordCount': 1000,
              'enforceInputFileSizeLimit': true,
              'enforceOutputJsonSizeLimit': true
          };

          //generalize features for display Here we generalize at 1:40,000 which is approx 10 meters
          //This should work well when using web mercator.
          var extent = scaleUtils.getExtentForScale(map, 40000);
          var resolution = extent.getWidth() / map.width;
          params.generalize = true;
          params.maxAllowableOffset = resolution;
          params.reducePrecision = true;
          params.numberOfDigitsAfterDecimal = 0;

          var myContent = {
              'filetype': filetype,
              'publishParameters': JSON.stringify(params),
              'f': 'json',
              'callback.html': 'textarea'
          };

          //use the rest generate operation to generate a feature collection from the zipped shapefile
          request({
              url: portalUrl + '/sharing/rest/content/features/generate',
              content: myContent,
              form: dom.byId('uploadForm'),
              handleAs: 'json',
              load: lang.hitch(this, function (response) {
                  if (response.error) {
                      errorHandler(response.error);
                      return;
                  }
                  var layerName = response.featureCollection.layers[0].layerDefinition.name;
                  dom.byId('upload-status').innerHTML = '<b>Loaded: </b>' + layerName;
                  addShapeToMap(response.featureCollection, layerClass);
              }),
              error: lang.hitch(this, errorHandler)
          });
      }

      function errorHandler(error) {
          dom.byId('upload-status').innerHTML = "<p style='color:red'>" + error.message + "</p>";
      }

      function addShapeToMap(featureCollection, layerClass) {
          //add the shape to the map and zoom to the feature collection extent
          //If you want to persist the feature collection when you reload browser you could store the collection in
          //local storage by serializing the layer using featureLayer.toJson()  see the 'Feature Collection in Local Storage' sample
          //for an example of how to work with local storage.
          var fullExtent;
          var layers = [];

          // Associate dojo template with each feature in order to transform Graphic.attributes into an HTML representation
          arrayUtils.forEach(featureCollection.layers, function (layer) {
              var infoTemplate = new InfoTemplate("Details", "${*}");
              var featureLayer = new layerClass(layer, {
                  infoTemplate: infoTemplate
              });
              //associate the feature with the popup on click to enable highlight and zoom to
              featureLayer.on('click', function (event) {
                  map.infoWindow.setFeatures([event.graphic]);
              });
              //change default symbol if desired. Comment this out and the layer will draw with the default symbology
              changeRenderer(featureLayer);
              fullExtent = fullExtent ? fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
              layers.push(featureLayer);
          });
          map.addLayers(layers);
          map.setExtent(fullExtent.expand(1.25), true);
          dom.byId('upload-status').innerHTML = "";
      }

      function changeRenderer(layer) {
          //change the default symbol for the feature collection for polygons and points
          var symbol = null;
          switch (layer.geometryType) {
              case 'esriGeometryPoint':
                  symbol = new PictureMarkerSymbol({
                      'angle': 0,
                      'xoffset': 0,
                      'yoffset': 0,
                      'type': 'esriPMS',
                      'url': 'http://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png',
                      'contentType': 'image/png',
                      'width': 20,
                      'height': 20
                  });
                  break;
              case 'esriGeometryPolygon':
                  symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            new Color([112, 112, 112]), 1), new Color([136, 136, 136, 0.25]));
                  break;
          }
          if (symbol) {
              layer.setRenderer(new SimpleRenderer(symbol));
          }
      }

      function kmlToArc(file) {
        // upload to dropbox, get publicly accessible url, pass it to arc
        var xhr = new XMLHttpRequest();
        xhr.upload.onprogress = function(evt) {
          var percentComplete = parseInt(100.0 * evt.loaded / evt.total);
          // Upload in progress. Do something here with the percent complete.
        };

        xhr.onload = function() {
          if (xhr.status === 200) {
            var fileInfo = JSON.parse(xhr.response);
            // Upload succeeded, get a shareable link to it.
            getPublicLink(fileInfo.path_display)
            }
          else {
            var errorMessage = xhr.response || 'Unable to upload file';
            // Upload failed. Do something here with the error.
          }
        };
        xhr.open('POST', 'https://content.dropboxapi.com/2/files/upload');
        xhr.setRequestHeader('Authorization', 'Bearer ' + config.dropboxToken);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({
            path: '/projects/NcWRAP/KML/' + file.name,
            mode: 'overwrite',
            autorename: true,
            mute: false
            }));

        xhr.send(file);
      }

      function getPublicLink(path) {
        // get publicly accessible url and pass it to arc
        var xhr = new XMLHttpRequest();
        xhr.upload.onprogress = function(evt) {
          var percentComplete = parseInt(100.0 * evt.loaded / evt.total);
          // Upload in progress. Do something here with the percent complete.
        };

        xhr.onload = function() {
          if (xhr.status === 200) {
            var fileInfo = JSON.parse(xhr.response);
            // Upload succeeded, got a shareable link, pass it to arc, and get a feature in return
            var kml=new KMLLayer((fileInfo.url).replace('www.dropbox.com','dl.dropboxusercontent.com'))
            // put it on the map
            changeRenderer(kml);
            map.addLayers([kml]);
            kml.on("load", function(evt) {
              var kmlLayer=evt.layer;
              var kmlExtent, layers = kmlLayer.getLayers();
              dojo.forEach(layers, function(lyr) {
                if ( lyr.graphics && lyr.graphics.length > 0 ) {
                  var lyrExtent = esri.graphicsExtent(lyr.graphics);
                  if (typeof kmlExtent === 'undefined') {
                    // this should be the only realistic case because there should be only one layer
                    kmlExtent = lyrExtent;
                  } else {
                    // but just in case
                    kmlExtent = kmlExtent.union(lyrExtent);
                  }
                }});
              map.setExtent(kmlExtent.expand(1.5));
            });
            dom.byId('upload-status').innerHTML = "";
            //should factor the above into another fuction and add call it from addShapeToMap
          }
          else {
            var errorMessage = xhr.response || 'Unable to upload file';
            // Upload failed. Do something here with the error.
          }
        };
        xhr.open('POST', 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings');
        xhr.setRequestHeader('Authorization', 'Bearer ' + config.dropboxToken);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify({
            path: path,
            settings: {'requested_visibility':{'.tag':'public'}},
            }));
      }});
