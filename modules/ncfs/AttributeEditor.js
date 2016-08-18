define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Evented",
     "dojo/dom-construct",
    "dojo/dom",
    "modules/BootStrapDialog"
], function (declare, lang, Evented,
         dc, dom, BootStrapDialog
      ) {
        return declare([Evented], {

            fields: null,
            attributeEditNode: null,
            editControls: null,
            dialog: null,
            constructor: function (params) {

                this.fields = params.fields;
                this.dialog = new BootStrapDialog({ isPanel: false, title: "Edit Attributes" });                
                this.dialog.on("ui-loaded", lang.hitch(this, function () {
                    this.attributeEditNode = this.dialog.contentDiv;
                }));

                this.dialog.startup();


            },

            _saveAttributes: function (g) {

                if (g.attributes == undefined) return;

                $.each(this.fields, lang.hitch(this, function (indx, item) {
                    if (item.readonly != true) {
                        var input = this._getInputControl(item);
                        g.attributes[item.name] = $(input).val();
                    }
                }));

            },

            //  Attribute Editing
            setFeature: function (g) {

                if (this.attributeEditNode == null) this.attributeEditNode = this.dialog.contentDiv;


                this.editControls = [];
                if (g.attributes == undefined) return;

                $(this.attributeEditNode).empty().show();

                $.each(this.fields, lang.hitch(this, function (indx, item) {
                    
                    var input = this._createformGroup(item);
                    if (item.readonly == true && item.value != undefined) {
                        $(input).val(item.value);
                    } else {
                        $(input).val(g.attributes[item.name]).attr("field", item.name);
                    }
                        
                    this.editControls.push(input);
                    
                }));


                var footer = this.dialog.footerDiv;
                $(footer).empty();
                var cancelBtn = dc.create("button", {
                    innerHTML: "Cancel",
                    className: "btn btn-default"
                }, footer);
                dc.create("span", {
                    innerHTML: "&nbsp;&nbsp;"
                }, footer);
                var savebtn = dc.create("button", {
                    innerHTML: "Save",
                    className: "btn btn-default"
                }, footer);

                $(cancelBtn).click(lang.hitch(this, function () {                    
                    this.dialog.hide();
                    this.emit("cancel-clicked", { graphic: g });
                }));

                $(savebtn).click(lang.hitch(this, function () {
                    this._saveAttributes(g);
                    this.dialog.hide();
                    this.emit("ok-clicked", {graphic: g});
                }));


                this.dialog.show();
            },



            _getInputControl: function (f) {

                var item = null;
                var i = 0; n = this.editControls.length;
                for (i = 0; i < n; i++) {
                    item = this.editControls[i];
                    if ($(item).attr("field") == f.name) {
                        return item;
                    }
                }

            },
            _createformGroup: function (p) {

                var d = dc.create("div", { className: "form-group" }, this.attributeEditNode);
                var l = dc.create("label", {
                    className: "col-sm-6 control-label",
                    innerHTML: p.text
                }, d);
                var d1 = dc.create("div", {
                    className: "col-sm-6"
                }, d);

                var control = dc.create("input", {
                    type: "text", className: "form-control", placeholder: p.placeholder
                }, d1);

                if (p.readonly == true) $(control).attr("readonly", "readonly");


                return control;

            }
       

        });


});