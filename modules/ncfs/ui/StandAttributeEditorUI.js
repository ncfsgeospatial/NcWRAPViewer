define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/Evented",
  "dojo/topic",
  "dojo/dom-construct",
  "dojo/dom",
  "dojo/Deferred",
   "esri/graphic",
   "esri/layers/GraphicsLayer",
], function (
  declare, lang, Evented, topic, dc, dom, Deferred, Graphic, GraphicsLayer

) {
    return declare([Evented], {

        node: null,

        graphicsLayer: null,

        view: null,
        visible: null,
        loaded: null,

        map: null,
        feature: null,
        
        form: null,
        footer: null,

        acreageControl: null,
        labelControl: null,
        numControl: null,
        remarkControl: null,
        isExcludedControl: null,

        layer: null,
        features: null,
        currentfeature: null,
        currentIndex: null,
        symbol: null,


        constructor: function (options, attachTo) {
            
            this.map = options.map;
            this.layer = options.layer;
            this.features = options.features;
            this.symbol = options.symbol;
          
            this.view = "maedit";
            this.visible = false;
            this.loaded = false;
            this.currentIndex = -1;

            this.node = attachTo;

            topic.subscribe("window-pop-state", lang.hitch(this, this.handlePopState));
            topic.subscribe("state-change", lang.hitch(this, this._onStateChange));

        },

        startup: function () {

            this.graphicsLayer = new GraphicsLayer();
            this.map.addLayer(this.graphicsLayer);

            this.currentIndex = 0;
            if (this.features != null) {
                this.createUI();
                this.populate();
            } else {
                $(this.node).empty();
            }
            
            this.loaded = true;
        },


        createUI: function () {           

            $(this.node).empty();

            var d = dc.create("div", {}, this.node);

            var backBtn = dc.create("button", {
                className: "btn btn-primary btn-block",
                innerHTML: "Back to Tract Information Page"
            }, d);

            $(backBtn).click(lang.hitch(this, this._close));

            this._createEditForm();
           

            this.messageControl = dc.create("div", {
                className: ""                
            }, this.node);

            this.createNav();
        },


        _createEditForm: function () {

            var panel = dc.create("div", { className: "panel" }, this.node);

            this.form = dc.create("form", {
                className: "form-horizontal",
                role: "form",
                action: "javascript:void(0)"
            }, panel);

            this.acreageControl = this._createReadOnlyformGroup({
                text: "Acreage:", placeholder: "Management Area Acreage"
            });
            $(this.acreageControl);

            this.labelControl = this._createformGroup({
                text: "Label:", placeholder: "Enter Management Area Label"
            });

            this.numControl = this._createformGroup({
                text: "Number:", placeholder: "Enter Management Area Number"
            });

            this.remarkControl = this._createformGroup({
                text: "Remarks:", placeholder: "Enter Management Area Remarks"
            });

        },


        createNav: function () {

            var d = dc.create("div", {
                className: "form-group"
            }, this.node)


            this.footer = dc.create("div", {
                className: "col-sm-offset-2 col-sm-10 centered"
            }, d)


            if (this.features.length > 1) {
                var firstBtn = dc.create("button", {
                    className: "btn btn-primary",
                    innerHTML: "First"
                }, this.footer);

                $(firstBtn).click(lang.hitch(this, this._first));

                var backBtn = dc.create("button", {
                    className: "btn btn-primary",
                    innerHTML: "Back"
                }, this.footer);
                $(backBtn).click(lang.hitch(this, this._back));

                var nextBtn = dc.create("button", {
                    className: "btn btn-primary",
                    innerHTML: "Next"
                }, this.footer);
                $(nextBtn).click(lang.hitch(this, this._next));

                var lastBtn = dc.create("button", {
                    className: "btn btn-primary",
                    innerHTML: "Last"
                }, this.footer);
                $(lastBtn).click(lang.hitch(this, this._last));
            } else {

                this.createSaveUI();
            }

         
        },

        _next: function() {
            this._saveFeature();
            this.currentIndex++;
            if (this.currentIndex >= this.features.length) {
                this.currentIndex = this.features.length;
            }
            if (this.currentIndex < 0) {
                this.currentIndex = 0;
            }
            if (this.currentIndex >= this.features.length) {
                return;
            } else {
                this.populate();
                this._initStateChange();
            }
        },

        _back: function() {
            this._saveFeature();
            this.currentIndex--;
            if (this.currentIndex < 0) this.currentIndex = 0;
            this.populate();
            this._initStateChange();
        },

        _first: function(){
            this._saveFeature();
            this.currentIndex = 0;
            this.populate();
            this._initStateChange();
        }, 

        _last: function() {
            this._saveFeature();
            this.currentIndex = this.features.length - 1;
            this.populate();
            this._initStateChange();
        },

        _save: function() {
            this._saveFeature();
            this.hide();
            this.emit("dialog-closed", {});
        },

      

        _close: function() {

            this._saveFeature();
            this.hide();
            this.emit("dialog-closed", {});

        },


        _createformGroup: function(p) {

           

            var d = dc.create("div", { className: "form-group" }, this.form);
            var l = dc.create("label", {
                className: "col-sm-6 control-label",
                innerHTML: p.text
            }, d);
            var d1 = dc.create("div", {
                className: "col-sm-6"
            }, d);

            var control = dc.create( "input", {                
                type:"text", className:"form-control",  placeholder: p.placeholder
            }, d1);
            return control;



        },
        _createReadOnlyformGroup: function (p) {



            var d = dc.create("div", { className: "form-group" }, this.form);
            var l = dc.create("label", {
                className: "col-sm-6 control-label",
                innerHTML: p.text
            }, d);
            var d1 = dc.create("div", {
                className: "col-sm-6"
            }, d);

            //var control = dc.create("input", {
            //    type: "text", className: "form-control", placeholder: p.placeholder
            //}, d1);
            control = dc.toDom("<input type='text' class='form-control' readonly />");
            dc.place(control, d1);
            return control;



        },

        createSaveUI: function() {
            var cancel = dc.create("button", {
                className: "btn btn-primary",
                innerHTML: "Cancel"
            }, this.footer);

            $(cancel).click(lang.hitch(this, this._close));
            //dc.create("&nbsp;&nbsp;", this.footer);

            var save = dc.create("button", {
                className: "btn btn-primary",
                innerHTML: "Save"
            }, this.footer);
            $(save).click(lang.hitch(this, this._save));
        },



        highlightFeature: function() {
            this.graphicsLayer.clear();            
            var a = new Graphic(this.currentfeature.geometry, this.symbol);
            this.graphicsLayer.add(a);
            this.graphicsLayer.show();
            
           
        },

        setFeature: function(f){

            this.features = [f];
            this.currentIndex = 0;
            $(this.node).empty();
            this.currentfeature = f;
            this._createEditForm();
            this._populateForm();

            this.footer = dc.create("div", {
                className: "col-sm-offset-2 col-sm-10 centered"
            }, this.node);

            this.createSaveUI();
            this.highlightFeature();
            this.show();

        },



        populate: function () {

            if (isNaN(this.currentIndex)) this.currentIndex = 0;
            if (this.currentIndex < 0) return;
            if (this.currentIndex >= this.features.length) return;

            this.currentfeature = this.features[this.currentIndex];

            this._populateForm();

            var num = this.currentIndex + 1
            $(this.messageControl).html(num + " of " + this.features.length + " records");

            this.highlightFeature();
            
        },

        _populateForm:function(){
            $(this.numControl).val(this.currentfeature.attributes.ma_num);
            $(this.labelControl).val(this.currentfeature.attributes.stand_label);
            $(this.remarkControl).val(this.currentfeature.attributes.remarks);
            $(this.acreageControl).val(this.currentfeature.attributes.stand_acres);

            var l = $(this.labelControl).val();
            if (l == "") $(this.labelControl).val(this.currentIndex + 1);

        },


        
        
        _saveFeature: function () {

            if (this.currentIndex < 0) return;
            if (this.currentIndex >= this.features.length) return;

            var g =  this.features[this.currentIndex];

            var datachanged = false;
            var label = $(this.labelControl).val();
            if (label != g.attributes.stand_label) {
                datachanged = true;
                g.attributes.stand_label = label;
            }

            var manum = $(this.numControl).val();
            if (manum != g.attributes.ma_num) {
                datachanged = true;
                g.attributes.ma_num = manum;
            }

            var data = $(this.remarkControl).val();
            if (data != g.attributes.remarks) {
                g.attributes.remarks = data;
                datachanged = true;
            }
            if (datachanged == true) {
                 $(this.footer).hide();
                this.layer.applyEdits(null, [g], null, lang.hitch(this, this._saveCompleted));

            }
        },

        _saveCompleted: function () {
            $(this.footer).show();
        },

        

        show: function() {
            this.visible = true;
            $(this.node).show();
            if (this.graphicsLayer!=null)  this.graphicsLayer.show();
        },

        hide: function() {
            this.visible = false;
            $(this.node).hide();
            if (this.graphicsLayer != null) this.graphicsLayer.hide();
        },

       

        handlePopState: function (e) {
            var u = e.object;
            this.hide();
            if (u.query.view == "maedit") {
                this.show();
                if (u.query.standeditindex) {                 
                    if (this.loaded == false) this.startup(0);
                    this.currentIndex = u.query.standeditindex;
                    this.populate();                    
                }
            } 

        },

        _initStateChange: function() {
            topic.publish("state-change", {
                view: this.view,
                standeditindex: this.currentIndex
            })
        },

        _onStateChange: function (e) {
            //console.debug(e);
            if (e.view == "maedit") {
                e.view = this.view;
                e.standeditindex = this.currentIndex;
            }            
        },




    });
});

