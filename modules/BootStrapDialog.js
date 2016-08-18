

define([
  "dojo/_base/declare",
  "dojo/_base/lang",
   "dojo/Evented",
   "dojo/dom-construct",
    "dojo/dom",
   "dojo/Deferred",
], function (
  declare, lang,Evented, dc, dom, Deferred

) {
    return declare([Evented], {

        node: null,
        uiDialog: null,
        params: null,
        contentDiv: null,
        footerDiv: null,
        headerDiv: null,        
        constructor: function (params, attachTo) {
            this.node = $(attachTo);
            this.params = params;
                                 
        },
      
        startup: function () {

            var deferred = new Deferred();
           
            if (this.params.isPanel) {

                var mc = $(".main-container");
                var d = dc.create("div", {className: "container ags-content-panel"}, mc[0]);
                this.uiDialog = d;

                this.headerDiv = dc.create("div", { className: "" }, d);
                if (this.params.title) {
                    var h4 = dc.create("h4", { innerHTML: this.params.title }, this.headerDiv);
                }
               

                this.contentDiv = dc.create("div", {}, d);
                this.footerDiv = dc.create("div", {}, d);

                if (this.params.content) { $(this.contentDiv).html(this.params.content); }
                if (this.params.href) {
                    $(this.contentDiv).load(this.params.href, lang.hitch(this, function () {
                        var uiDeferred = new Deferred();
                        this.emit("ui-loaded", {});
                        uiDeferred.resolve();
                        return uiDeferred.promise;
                    }));
                }

            } else {
                var modal = dc.create("div");
                var modalD = dc.create("div");
                var modalContent = dc.create("div");
                var mdh = dc.create("div");
                var mdb = dc.create("div");
                var mdf = dc.create("div");
                var ht = $("<h4 class='modal-title'>");
                ht.html(this.params.title);

                this.uiDialog = modal;
                $(modal).appendTo("body").addClass("modal fade");
                $(modal).attr("tabindex", "-1").attr("role", "dialog").attr("aria-labelledby", "myLargeModalLabel").attr("aria-hidden", "true");
                $(modalD).appendTo(modal).addClass("modal-dialog");
                $(modalContent).addClass("modal-content").appendTo(modalD);
                //<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                var closeBtn = $("<button type='button' class='close' data-dismiss='modal' aria-hidden='true'>");
                $(mdh).appendTo(modalContent).append(closeBtn).append(ht).addClass("modal-header");
                $(closeBtn).append("&times;").click(function() {$(modal).hide()});
                $(mdb).appendTo(modalContent).addClass("modal-body")
                if (this.params.content) { $(mdb).html(this.params.content); }
                if (this.params.href) {
                    $(mdb).load(this.params.href, lang.hitch(this, function() {                                            
                        this.emit("ui-loaded", {});
                        deferred.resolve();                        

                    }));
                }

                $(mdf).addClass("modal-footer").appendTo(modalContent);

                this.headerDiv = mdh;
                this.footerDiv = mdf;
                this.contentDiv = mdb;
            }
          
            
            return deferred.promise;
                          
        },       

        show: function () {
           
            if (this.params.isPanel == true) {
                var h = $(".main-container").height();                
                $(".ags-content-panel").hide();
                $(".ags-panel").hide();
                $(this.uiDialog).show().css({ "width": "100%", "height": h + "px", "overflow": "auto" });
            } else {              
                $(this.uiDialog).modal('show');
                //$(".ags-panel").hide();
                $(".ui-draggable").draggable().resizable();
                var h = $(".main-container").height();
                $(this.contentDiv).css({ "max-height": h + "px", "overflow-y": "auto" })
                

            }

            
        },

        hide: function () {

            if (this.params.isPanel == true) {
                $(".ags-content-panel").first().show();
                $(this.uiDialog).hide();
            } else {
                $(this.uiDialog).modal('hide');
            }           
        },
        destroy: function () {
            if (this.params.isPanel == true) {
                $(this.uiDialog).remove();
                $(".ags-content-panel").first().show();
            } else {
                $(this.uiDialog).modal('hide').remove();
            }                      
        }


    });
});




