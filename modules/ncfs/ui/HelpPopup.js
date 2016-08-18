define([
  "dojo/_base/declare",
  "dojo/_base/lang",
   "dojo/Evented",
     "dojo/Deferred",
  "modules/BootStrapDialog"
], function (
  declare, lang, Evented, Deferred, BootStrapDialog

) {
    return declare([Evented], {

        dialog: null,
        showOnLoad: null,
        constructor: function (options, attachTo) {
            
            this.showOnLoad = true;
            if (options.showOnLoad == false) this.showOnLoad = false;


            this.dialog = new BootStrapDialog({ href: options.url, title: "Help" });

          

            this.dialog.on("ui-loaded", lang.hitch(this, function () {
                this.emit("ui-loaded", {});
                this.populate();
            }));


            this.dialog.startup();            
        },

        populate: function () {

            var dialog = this.dialog;            
            var cancelBtn = $("<button type='button' class='btn btn-default'>");

           
            $(cancelBtn).click(function () {
                dialog.hide();
            }).appendTo(dialog.footerDiv).text("Ok");


            if (this.showOnLoad) dialog.show();

        }        

       


    });
});

