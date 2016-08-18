define([
  "dojo/_base/declare",
  "dojo/_base/lang",
   "dojo/dom",
   "dojo/dom-construct",
   "dojo/_base/window",  
   "dojo/Evented",
   "dojo/topic",
   "dojo/Deferred",
   "modules/FloatingPanel"
], function (
  declare, lang, dom, dc, win, Evented, topic, Deferred, FloatingPanel

) {
    return declare([Evented], {       
        params: null,
        node: null,
        toolbarContainer: null,
        contentContainer: null,
        headerContainer: null,
        focused: null,
        delay: null,
        toolbarHidden: null,
        constructor: function (params) {            
            //this.params = params;
            //this.delay = 5000;
            //this.toolbarHidden = false;
        },
              
        addLinkButton: function (params) {
            var b = this.createButtonIcon(params);
            return b;
        },

        addPanel: function(params) {
            var panel = this.createFloatingPanel({ id: params.id, title: params.text, innerHTML: params.innerHTML, offset: params.offset });
            if (params.className != "") {
                $(panel.node).addClass(params.className);
            }

            return panel;
        },

        addButtonPanel: function (params) {
            if (params.className == undefined) params.className = "";

            var panel = this.createFloatingPanel({ id: params.id, title: params.text, innerHTML: params.innerHTML, offset: params.offset });
            if (params.className != "") {                
                $(panel.node).addClass(params.className);
            }
            var b = this.createButtonIcon(params);

            $(b).click(function () {
                topic.publish("panel-open", {panel: panel});
                panel.show();
            });

            return { button: b, panel: panel }
        },

        createButtonIcon: function (p) {
            if (!p.title) p.title = "";

              p.className = p.name + "-icon";
              p.buttonClassName = "left-button" + p.index;

              var b =  dc.create("div", {
                  className: p.buttonClassName + " float-button"                    
              }, dom.byId("mapDiv_root"));

              var b = dc.create("div", {
                  className: p.className +  " ags-button-icon"                  
              }, b);

              var s = dc.create("img", {                  
                  style: "height: 35px; width: 35px",
                  src: p.image
              }, b);

              if (p.title) {
                  var  tooltip =  {
                          placement: "right",
                          trigger: "hover",
                          title: p.title
                  }
                  $(b).tooltip(tooltip);
              }

              return b;
        },

        createFloatingPanel: function (p) {
            var panel = new FloatingPanel(p);
            return panel;
        }
    });
});




