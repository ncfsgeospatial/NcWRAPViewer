define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Evented",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/_base/html",
    "modules/ncfs/operations/Operation",   
    "esri/graphic"
],
     function (declare, lang, Evented,
         dc, dom, html,
         Operation, Graphic
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

                 var op = new Operation({
                     layer: featureLayer,
                     adds: newGraphics
                 });
                 this._pushUndo(op);

             },

             addUpdate: function (feature, originalFeature, featureLayer) {

                 if (originalFeature == null) return;
                 if (originalFeature == undefined) return;

                 var operation = new Operation({
                     layer: featureLayer,
                     preUpdatedGraphics: [new Graphic(originalFeature)],
                     postUpdatedGraphics: [feature]
                 });
                 this._pushUndo(operation);

             },

             addDelete: function (features, featureLayer) {
                 var operation = new Operation({
                     layer: featureLayer,
                     deletes: features
                 });
                 this._pushUndo(operation);

             },

             addSplit: function(adds, removes, featureLayer){
                 var operation = new Operation({
                     layer: featureLayer,
                     deletes: removes,
                     adds: adds
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

             undoClicked: function() {
                 if (this.undoList.length === 0) {
                     return;
                 }

                 var operation = this._popUndo();
                 this._pushRedo(operation);
                 operation.performUndo();

             },
            

             redoClicked: function () {
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
                     html.removeClass(btn, 'disabled');
                 } else {
                     html.addClass(btn, 'disabled');
                 }
             }

    });
});
