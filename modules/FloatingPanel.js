define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/_base/window",
    "dojo/Evented",
    "dojo/Deferred"
], function (
  declare, lang, dom, dc, win, Evented, Deferred

) {
    return declare([Evented], {
        node: null,
        minTop: 50,
        offset: 0,
        firstShow: true,
        constructor: function(p) {
            if (p.innerHTML == undefined) p.innerHTML = "";
            if (p.offset == undefined) p.offset = 0;

            var minTop = this.minTop;

            var panel = dc.create("div", {
                className: "panel panel-default ags-bootstrap-panel ags-panel"
            }, win.body());
            this.offset = p.offset;

            var header = dc.create("div", {
                className: "panel-heading"
            }, panel);

            $(panel).draggable().draggable("disable").resizable({
                "minHeight": 200,
                "minWidth": 200
            });
            $(header).mouseover(function () {
                $(panel).draggable("enable");
            }).mouseout(function () {
                $(panel).draggable("disable");
            });


            var closeBtn = dc.toDom("<button type='button' class='close' aria-label='Close'><span aria-hidden='true'>&times;</span></button>");
            dc.place(closeBtn, header);
            dc.create("h4", {
                innerHTML: p.title,
                className: "panel-title"
            }, header);

            $(closeBtn).click(lang.hitch(this, function () {
                this.emit("close", {});
                $(panel).fadeOut();
            }));

            var bodyd = dc.create("div", {
                className: "panel-body",
                style: "height: 300px"
            }, panel);

            var content = dc.create("div", {
                innerHTML: p.innerHTML
            }, bodyd);

            if (p.id) $(content).attr("id", p.id);

            $(panel).on("dragstop", function (event, ui) {
                if (ui.position.top < minTop) {
                    $(panel).css("top", minTop + "px");                    
                }              
            });
            $(panel).on("resizestop", function (event, ui) {
                var h = $(panel).height();
                var hh = $(header).height();
                var dh = parseInt((h - (hh + 20)));
                $(bodyd).css({                    
                    height: dh  + "px"
                });
            });

            this.node = panel;
        },

        show: function () {
            $(".ags-bootstrap-panel").css("z-index", 1);
            $(this.node).show();
            $(this.node).css("z-index", 2);
            if (this.firstShow && this.offset > 0) {
                var nOffset = $(this.node).offset();
                $(this.node).css("top", nOffset.top + this.offset).css("left", nOffset.left + this.offset);
            }
            this.firstShow = false;
            this.emit("show", {});
        },

        hide: function () {           
            $(this.node).hide();
            this.emit("close", {});
        }
    });
});




