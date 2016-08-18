define([
    "dojo/_base/declare",
    "dojo/_base/lang"
],
     function (declare, lang
      ) {
         return declare([], {
             adds: [],
             removes: [],
             preUpdatedGraphics: [],
             postUpdatedGraphics: [],
             graphicLayer: null,
             constructor: function (options, node) {


                 this.adds = options.adds;
                 this.removes = options.removes;

                 this.preUpdatedGraphics = options.preUpdatedGraphics;
                 this.postUpdatedGraphics = options.postUpdatedGraphics;

                 this.graphicLayer = options.layer;
             },

             performRedo: function () {
                 var l = this.graphicLayer;

                 if (this.adds) {
                     $.each(this.adds, function (indx, item) {
                         l.add(item);
                     });
                 }
                 if (this.removes) {
                     $.each(this.removes, function (indx, item) {
                         l.remove(item);
                     });
                 }

                 if (this.preUpdatedGraphics) {
                     $.each(this.preUpdatedGraphics, function (indx, item) {
                         l.remove(item);
                     });
                     $.each(this.postUpdatedGraphics, function (indx, item) {
                         l.add(item);
                     });
                 }
             },

             performUndo: function () {
                 var l = this.graphicLayer;

                 if (this.adds) {
                     $.each(this.adds, function (indx, item) {
                         l.remove(item);
                     });
                 }
                 if (this.removes) {
                     $.each(this.removes, function (indx, item) {
                         l.add(item);
                     });
                 }

                 if (this.preUpdatedGraphics) {
                     $.each(this.preUpdatedGraphics, function (indx, item) {
                         l.add(item);
                     });
                     $.each(this.postUpdatedGraphics, function (indx, item) {
                         l.remove(item);
                     });
                 }

             }

         })

     });

