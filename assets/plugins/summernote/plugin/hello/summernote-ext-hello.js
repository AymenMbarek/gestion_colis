(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('jquery'));
  } else {
    factory(window.jQuery);
  }
}(function($) {
  $.extend($.summernote.plugins, {
    /**
     * @param {Object} context - context object has status of editor.
     */
    'hello': function(context) {
      var self = this;
      var ui = $.summernote.ui;
      context.memo('button.hello', function() {
        var button = ui.button({
          contents: '<i class="fa fa-child"/> Hello',
          tooltip: 'hello',
          click: function() {
            self.$panel.show();
            self.$panel.hide(500);
            context.invoke('editor.insertText', 'hello');
          },
        });
        var $hello = button.render();
        return $hello;
      });
      this.events = {
        'summernote.init': function(we, e) {
          console.log('summernote initialized', we, e);
        },
        'summernote.keyup': function(we, e) {
          console.log('summernote keyup', we, e);
        },
      };
      this.initialize = function() {
        this.$panel = $('<div class="hello-panel"/>').css({
          position: 'absolute',
          width: 100,
          height: 100,
          left: '50%',
          top: '50%',
          background: 'red',
        }).hide();

        this.$panel.appendTo('body');
      };
      this.destroy = function() {
        this.$panel.remove();
        this.$panel = null;
      };
    },
  });
}));
