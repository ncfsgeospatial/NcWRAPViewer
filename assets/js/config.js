var config = {};

config.operationalLayers = [
    //{
    //    id: "Parcels",
    //    url: "https://www.ncmhtd.com/arcgis/rest/services/General/Parcels/MapServer",
    //    type: "Dynamic",
    //    opacity: .5,
    //    visible: true,
    //    maxScale: 24000,
    //    layers: ["Parcels"]
    //},

{
    id: "Parcels",
    url: "https://www.ncmhtd.com/arcgis/rest/services/General/Parcels/FeatureServer/0",
    type: "FeatureLayer",
    opacity: 0.75,
    visible: false,
    minScale: 24000,
    renderer: {
        type: "polygon",
        color: [255, 200, 0, 0.01],
        outline: { color: [255, 200, 0], width: 2 }
    },
    template: {
        title: "<b>${OWNER1}</b>",
        node: "#ParcelsTemplate"
    }
},
{
    id: "County Boundary",
    url: "https://www.ncmhtd.com/arcgis/rest/services/AG_FS/FS_Forest_Management_Overlay/MapServer",
    type: "Dynamic",
    opacity: .75,
    visible: false,
    layers: ["County Boundary"]
},{
    id: "Railroads",
    url: "https://www.ncmhtd.com/arcgis/rest/services/AG_FS/FS_Forest_Management_Overlay/MapServer",
    visible: false,
    opacity: 1,
    layers: ["Railroads"]
},{
    id: "Rivers and Streams",
    url: "https://www.ncmhtd.com/arcgis/rest/services/AG_FS/FS_Forest_Management_Overlay/MapServer",
    type: "Dynamic",
    opacity: .5,
    visible: false,
    layers: ["NHD Streams", "24k Streams"]
}, {
    id: "NWI Wetlands",
    url: "https://www.ncmhtd.com/arcgis/rest/services/AG_FS/FS_Forest_Management_Overlay/MapServer",
    type: "Dynamic",
    opacity: .5,
    visible: false,
    layers: ["NWI Wetlands"]
}, {
    id: "Contour Lines",
    url: "https://www.ncmhtd.com/arcgis/rest/services/AG_FS/FS_Forest_Management_Overlay/MapServer",
    type: "Dynamic",
    opacity: .5,
    visible: false,
    layers: ["100 Foot Contour Lines", "20 Foot Contour Lines", "2 Foot Contour Lines", "4 Foot Contour Lines"],
    minScale: 1000000,
    maxScale: 2400
}, {
    id: "River Basins",
    url: "https://www.ncmhtd.com/arcgis/rest/services/AG_FS/FS_Forest_Management_Overlay/MapServer",
    type: "Dynamic",
    opacity: .5,
    visible: false,
    layers: ["River Basins"],
    maxScale: 1000000
}];

config.featureEditorOptions = {
    url: "https://www.ncmhtd.com/arcgis/rest/services/secure/FPPT/FeatureServer",
    sublayers: [
        { id: "Access Points",  layerid: 0 },
        { id: "Slash Laps", layerid: 1  },
        { id: "Stream Crossing", layerid: 2},
        { id: "Logging Deck",  layerid: 3},
        { id: "Tools to Capture Sediment",  layerid:4 },
        { id: "Tools to control runoff",   layerid:5},
        { id: "Access Road",  layerid:6 },
        { id: "Fence",  layerid:7 },
        { id: "Skid Trail",  layerid: 8},
        { id: "Utility Line",  layerid: 9 },
        { id: "User Defined Stream",   layerid: 10 },
        { id: "User Defined Waterbody",  layerid: 13 },
        { id: "User Defined Wetland",  layerid:14 },
        { id: "SMZ",  layerid: 15 },
        { id: "Structure",  layerid: 16 }
    ]
}

config.dropboxToken = 'MC1h81cmOoQAAAAAAAAAGlylZcBCZ3YztMx-3gp9QI05jEVIvWeSD-teVX34OkrY'
config.workingHTML = "<div class='callbackindicator'><center><img src='images/callbackactivityindicator.gif' alt='working' /><br/>Querying the GIS database...</center></div>";
config.geoServiceUrl = "https://www.ncmhtd.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";
config.printTaskUrl = "https://www.ncmhtd.com/arcgis/rest/services/AG_FS/ExportNCFSWebMap/GPServer/Export%20Web%20Map";

//config.tractFeatureurl = "http://10.234.3.64/arcgis/rest/services/secure/FPPT/FeatureServer/11";
//config.standFeatureurl = "http://10.234.3.64/arcgis/rest/services/secure/FPPT/FeatureServer/12";
config.areaOfInterestFeatureurl = "http://10.234.3.48/arcgis/rest/services/secure/FPPT/FeatureServer/17";
config.tractFeatureurl = "https://www.ncmhtd.com/arcgis/rest/services/secure/FPPT/FeatureServer/11";
config.standFeatureurl = "https://www.ncmhtd.com/arcgis/rest/services/secure/FPPT/FeatureServer/12";
config.parcelTractFeatureurl = "https://www.ncmhtd.com/arcgis/rest/services/secure/FPPT/FeatureServer/17";
//  removed 5/14/2015 --config.ncfsRegionUrl = "https://www.ncmhtd.com/arcgis/rest/services/AG_FS/CountyBase_for_FS_WM/MapServer/2";
config.countyUrl = "https://www.ncmhtd.com/arcgis/rest/services/General/CountyBase_WM/MapServer/1";
config.parcelSearchUrl = "https://www.ncmhtd.com/arcgis/rest/services/AG_FS/CountyBase_for_FS_WM/MapServer/0";

//  removed 5/14/2015 -- config.refreshDataUrl = "https://www.ncmhtd.com/arcgis/rest/services/secure/UpdateAcreage/GPServer/UpdateAcreage";
config.exportDataUrl = "https://www.ncmhtd.com/arcgis/rest/services/secure/fpptZipExporter/GPServer/fpptShpExporter"
config.deleteTractUrl = "https://www.ncmhtd.com/arcgis/rest/services/secure/FPPT_tractRemover/GPServer/tractRemover";


config.tractInfoTemplate = "<table class='table table-condensed'><tbody><tr class='info'><td>Tract ID:</td><td>${tract_id}</td></tr><tr class='info'><td>Tract Name:</td><td>${tract_name}</td></tr><tr class='info'><td>Acres:</td><td class='round2'>${tract_acres}</td></tr><tr class='info'><td>County:</td><td>${county_name}</td></tr><tr class='info'><td>Owner:</td><td>${owner_lastname}</td></tr><tr class='info'><td>Location:</td><td>${latdecdeg}/${longdecdeg}</td></tr><tr class='info'><td>Remarks:</td><td>${remarks}</td></tr><tr class='info'><td>User:</td><td id='tdTractOwner'><span id=spanTractOwner>${user_name}</span></td></tr></tbody></table>";
config.managementAreasListTemplate = "<tr><td>${ma_num}</td><td>${stand_label}</td><td class='round2'>${stand_acres}</td><td>${remarks}</td></tr>";
config.basemapToolbar = {
    initialBasemap: "streets",
    basemaps: [{ id: "streets", text: "Street Map" },
               { id: "satellite", text: "Aerials" },
               { id: "topo", text: "Topo", minzoom: 15 }
    ]
};

config.useBing = true;

// tooltips
config.tocButtonTooltip = "Turn on or off layers that are available in the current map document";
config.drawButtonTooltip = "Add temporary markup items to the map document.  (these do not get saved to the database and will not be available in your next session)";
config.addFeaturesButtonTooltip = "Add permanant features to the GIS Database";
config.editManagementAreaTooltip = "Show edit tools window";
config.printDialogTooltip = "Show Print Dialog";
config.createTractButtonTooltip = "Show List of Selected Parcels";
config.createTractHelpButtonTooltip = "Show Help";
config.editTractTooltip = "Edit Tools";
config.homeButtonTooltip = "Return to Management Tract Home Page"

config.printDisclaimer="";

// Basic MA Editing Toolbar
config.startSplitTooltip = {
    placement: "right",
    trigger: "hover",
    title: "Click on map to start adding a line to split Management Tract, Double Click to complete"
}

config.basicEditingTooltip = {
    placement: "right",
    trigger: "hover",
    title: "Basic Editing Option: Use lines to spliting the tract into multiple polygons"
}

config.tractAPIServiceUrl = "TractController";


config.loadingHtml = "<div class='ui-widget-overlay' style='position:absolute; z-index:4; top: 0px; left: 0px; height:100%; width:100%;color:red; font-size:large;font-weight:bold;text-align:center; vertical-align: middle;'><p><img src='images/loading.gif'></p><p>Loading Map...Please Wait</p></div>";



config.MergeTractExplanation = "<p>This Tract has Multiple Features, you need to merge the features or delete one of the features before continuing to the next step.  Click 'Merge' to combine the multiple polygons into one multi-part polygons, click 'Start Editing' to initiate the editing of features.</p>";
