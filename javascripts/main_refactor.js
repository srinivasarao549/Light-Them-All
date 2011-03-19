/// WIP : refactoring with backbone js

$(function(){
  
  if(!console) console = { log: function(){}, error: function(){} };
  
  var isChrome = /chrome/i.test(navigator.userAgent);
  var isAndroidOS = /android/i.test(navigator.userAgent);
  var hasTouch = ('ontouchstart' in window);
  
(function(lta){
  
  var Color = lta.Color = Backbone.Model.extend({ 
    // Colors constants
    R: 1, G: 2, RG: 3, B: 4, RB: 5, GB: 6, RGB: 7,
    
    initialize: function() {
      var color = this.get('color');
      if(color) {
        var value = 0;
        var self = this;
        _.each(color.toUpperCase().split(''), function(a){
          if(self[a]) value |= self[a];
        });
        this.set({ value: value });
      }
    },
    
    mix: function(c2) { 
      return new Color({ value: this.get('value') | c2.get('value') });
    },
    
    filter: function(c2) { 
      return new Color({ value: this.get('value') & c2.get('value') });
    },
    
    toRgba: function(alpha, lum) {
      var c = this.get('value');
      
      if(typeof(alpha)=='undefined') alpha=1;
      if(typeof(lum)=='undefined') lum=255;
      if(alpha<0) alpha=0;
      if(alpha>1) alpha=1;
      
      var colorOn = Math.min(255,lum);
      var colorOff = Math.min(255,lum-colorOn);
      var r=0, g=0, b=0;
      if(c==this.R) {
        r=colorOn; g=colorOff; b=colorOff;
      }
      else if(c==this.G) {
        r=colorOff; g=colorOn; b=colorOff;
      }
      else if(c==this.B) {
        r=colorOff; g=colorOff; b=colorOn;
      }
      else if(c==this.RG) {
        r=colorOn; g=colorOn; b=colorOff;
      }
      else if(c==this.RB) {
        r=colorOn; g=colorOff; b=colorOn;
      }
      else if(c==this.GB) {
        r=colorOff; g=colorOn; b=colorOn;
      }
      else if(c==this.RGB) {
        r=colorOn; g=colorOn; b=colorOn;
      }
      return 'rgba('+r+','+g+','+b+','+alpha+')';
    }

  });
  
  
  var Orientation = lta.Orientation = Backbone.Model.extend({
    TOPLEFT: 0, TOP: 1, TOPRIGHT: 2, RIGHT: 3, BOTTOMRIGHT: 4, BOTTOM: 5, BOTTOMLEFT: 6, LEFT: 7,
    
    initialize: function(){
      var orientation = this.get('orientation');
      if(orientation) {
        orientation = orientation.replace(' ', '').toUpperCase()
        var value = -1;
        if(typeof(this[orientation])==='number')
          value = this[orientation];
        this.set({ value: value });
      }
    },
    
    val: function(){
      return this.get('value'); 
    },
    
    next: function(){
      var val = this.get('value');
      return new Orientation({ value: val===7 ? 0 : val+1 });
    },
    prev: function(){
      var val = this.get('value');
      return new Orientation({ value: val===0 ? 7 : val-1 });
    },
    toRadian: function() {
      return (this.get('value')-3) * Math.PI / 4;
    }
  });
  
  
  
  var Position = lta.Position = Backbone.Model.extend({
    initialize: function(){
      
    },
    x: function(v) {
      if(typeof(v)==="undefined")
        return this.get('x');
      this.set({ x: v });
      return this;
    },
    y: function(v) {
      if(typeof(v)==="undefined")
        return this.get('y');
      this.set({ y: v });
      return this;
    },
    move: function(orientation) {
      var val = orientation.get('value');
      if(val==orientation.TOPLEFT)
        return this.x(x-1).y(y-1);
      if(val==orientation.TOP)
        return this.y(y-1);
      if(val==orientation.TOPRIGHT)
        return this.x(x+1).y(y-1);
      if(val==orientation.RIGHT)
        return this.x(x+1);
      if(val==orientation.BOTTOMRIGHT)
        return this.x(x+1).y(y+1);
      if(val==orientation.BOTTOM)
        return this.y(y+1);
      if(val==orientation.BOTTOMLEFT)
        return this.x(x-1).y(y+1);
      if(val==orientation.LEFT)
        return this.x(x-1);
    }
  })
  
  
  
  // A game object displayable on the Map
  var MapObject = lta.MapObject = Backbone.Model.extend({
    
    defaults: {
      kind: 'none' // receptor, laser, wall, bomb, tool
    },
    
    ray: function() {
      
    }
    
    // Some methods used by map view
  });
  
  
  var Tool = lta.Tool = MapObject.extend({
    
    defaults: {
      kind: 'tool',
      type: 'SIMPLE'
    },
    
    initialize: function() {
      var type = this.get('type');
      var icon = new Image();
      var self = this;
      icon.onload = function(){ self.trigger('icon-load') }
      icon.src = 'images/tool/'+(type.toLowerCase())+'.png';
      this.set({ icon: icon });
      var rayTransforms = this.get('rayTransforms');
      this.input = [];
      for(var o in rayTransforms)
        this.input[new Orientation({ orientation: o }).val()] = rayTransforms[o];
    },
    
    ray: function(orientation, color) {
      var f = this.input[orientation.val()];
      if(typeof(f)==='undefined') return {};
      return f(color);
    }
    
  });
  
  var ToolCollection = lta.ToolCollection = Backbone.Collection.extend({
    model: Tool
  });
  
  var Tools = lta.Tools = new ToolCollection([
    new Tool({
      type: 'SIMPLE',
      rayTransforms: {
        topleft: function(color) { return { bottomleft: color } },
            top: function(color) { return { bottom: color } },
         bottom: function(color) { return { top: color } },
     bottomleft: function(color) { return { topleft: color } },
           left: function(color) { return { left: color } }
      }
    }),
    new Tool({
      type: 'DOUBLE',
      rayTransforms: {
        topleft: function(color) { return { bottomleft: color } },
            top: function(color) { return { bottom: color } },
       topright: function(color) { return { bottomright: color } },
          right: function(color) { return { right: color } },
    bottomright: function(color) { return { topright: color } },
         bottom: function(color) { return { top: color } },
     bottomleft: function(color) { return { topleft: color } },
           left: function(color) { return { left: color } }
      }
    }),
    new Tool({
      type: 'CONE',
      rayTransforms: {
            top: function(color) { return { left: color } },
         bottom: function(color) { return { left: color } },
           left: function(color) { return { top: color, bottom: color } }
      }
    }),
    new Tool({
      type: 'QUAD',
      rayTransforms: {
          right: function(color) { return { top: color, left: color } },
           left: function(color) { return { top: color, right: color } }
      }
    }),
    new Tool({
      type: 'REFRACTOR',
      rayTransforms: {
        topleft: function(color) { return { bottomright: color } },
          right: function(color) { return { topleft: color } },
    bottomright: function(color) { return { topleft: color } },
           left: function(color) { return { bottomright: color } }
      }
    }),
    new Tool({
      type: 'TRIANGLE',
      rayTransforms: {
        topleft: function(color) { return { right: color } },
        right: function(color) { return { topleft: color, bottomleft: color } },
        bottomleft: function(color) { return { right: color } }
      }
    }),
    new Tool({
      type: 'SPLITER',
      rayTransforms: {
        left: function(color) { return {
          topright: color.filter(new Color('R')),
          right: color.filter(new Color('G')),
          bottomright: color.filter(new Color('B')) } }
      }
    })
  ]);
  
  
  var Sound = lta.Sound = Backbone.Model.extend({
    initialize: function(){
      this.player =  $(this.get('node')).clone()[0];
    },
    play: function() {
      this.player.play();
      return this;
    }
  });
  
  var Case = lta.Case = Backbone.Model.extend({
    
  });
  
  var Grid = lta.Grid = Backbone.Model.extend({
    
  });
  
  var Panel = lta.Panel = Backbone.Model.extend({
    
  });
  
  var Level = lta.Level = Backbone.Model.extend({
    
  });
  
  // Manage the laser canvas
  var RayTracer = lta.RayTracer = Backbone.View.extend({
    
  });
  
  // Manage the bottom panel with tools
  var PanelView = lta.PanelView = Backbone.View.extend({
    
  });
  
  // Manage the grid canvas (objects canvas)
  var GridView = lta.GridView = Backbone.View.extend({
    
  });
  
  // Manage the game
  var Game = lta.Game = Backbone.Controller.extend({
    
  });
  
}(window.lta));
  
});

