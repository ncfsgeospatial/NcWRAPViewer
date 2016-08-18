define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Evented",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/_base/html",
    "esri/dijit/editing/Add",
    "esri/dijit/editing/Delete",
    "esri/dijit/editing/Cut",
    "esri/dijit/editing/Update",
    "esri/dijit/editing/Union",
    "esri/graphic"
],
     function (declare, lang, Evented,
         dc, dom, html,
         Add, Delete, Cut, Update,Union, Graphic   
      ) {

         
         return declare([Evented], {

             undoList: [],
             redoList: [],

             undoButton: null,
             redoButton: null,
            

             constructor: function (options, node) {
                this.undoButton =  dc.create("button", {
                     className: "btn btn-warning disabled", innerHTML: "Undo"
                 }, node);

                 this.redoButton = dc.create("button", {
                     className: "btn btn-warning disabled", innerHTML: "Redo"
                 }, node);

                 

                 $(this.undoButton).click(lang.hitch(this, this.undoClicked));
                 $(this.redoButton).click(lang.hitch(this, this.redoClicked));

                 this.reset();

                 
             },

             addNew: function (newGraphics, featureLayer) {

                 var operation = new Add({
                     featureLayer: featureLayer,
                     addedGraphics: newGraphics
                 });
                 this._pushUndo(operation);

             },

             addUpdate: function (feature, originalFeature, featureLayer) {

                 //if (originalFeature == null) return;
                 //if (originalFeature == undefined) return;

                 var operation = new Update({
                     featureLayer: featureLayer,
                     preUpdatedGraphics: [new Graphic(originalFeature)],
                     postUpdatedGraphics: [feature]
                 });
                 this._pushUndo(operation);

             },

             addMerge: function(deletedFeatures, mergeFeature, featureLayer){

                 var operation = new Union({
                     featureLayer: featureLayer,
                     deletedGraphics: deletedFeatures,
                     preUpdatedGraphics: deletedFeatures,
                     postUpdatedGraphics: [mergeFeature]
                 });
                 this._pushUndo(operation);
             },


             addSplit: function (adds, origFeature, featureLayer) {
                
                 var g = new Graphic(origFeature);
                 var operation = new Cut({
                     featureLayer: featureLayer,
                     addedGraphics: adds,
                     preUpdatedGraphics: [g],
                     postUpdatedGraphics: []
                 });
                 
                 this._pushUndo(operation);
                
             },

             addDelete: function (features, featureLayer) {

                 //var deleted = $.map(features, function (f) {
                 //    var g = new Graphic(f);
                 //    return g;
                 //});

                 var operation = new Delete({
                     featureLayer: featureLayer,
                     deletedGraphics: features
                 });
                 this._pushUndo(operation);

             },

             

             _pushUndo: function (operation) {
                 this.undoList.push(operation);
                 this._enableBtn(this.undoButton, true);
             },

             _popUndo: function () {
                 var operation = this.undoList.pop();
                 if (this.undoList.length === 0) {
                     this._enableBtn(this.undoButton, false);
                 }
                 return operation;
             },

             _pushRedo: function (operation) {
                 this.redoList.push(operation);
                 this._enableBtn(this.redoButton, true);
             },

             _popRedo: function () {
                 var oper = this.redoList.pop();
                 if (this.redoList.length === 0) {
                     this._enableBtn(this.redoButton, false);
                 }
                 return oper;
             },

             undoClicked: function () {

                 console.debug(this.undoList)
                 if (this.undoList.length === 0) {
                     return;
                 }

                 var operation = this._popUndo();
                 this._pushRedo(operation);
                 operation.performUndo();

             },
            

             redoClicked: function () {

                 console.debug(this.redoList)
                 if (this.redoList.length === 0) {
                     return;
                 }
                 var operation = this._popRedo();                
                 operation.performRedo();
                 this._pushUndo(operation);

             },

             reset: function () {
                 this.undoList = [];
                 this.redoList = [];
                 this._enableBtn(this.redoButton, false);
                 this._enableBtn(this.undoButton, false);
             },

             _enableBtn: function (btn, isEnable) {
                 if (isEnable) {
                     $(btn).show();
                     html.removeClass(btn, 'disabled');
                     
                 } else {
                     $(btn).hide();
                     html.addClass(btn, 'disabled');
                   
                 }
             }

    });
});
