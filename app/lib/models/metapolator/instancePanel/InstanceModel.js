define([
    '../_BaseModel'
  , './GlyphModel'
  , './AxisModel'
], function(
    Parent
  , GlyphModel
  , AxisModel
){
    "use strict";
    function InstanceModel(id, name, displayName, axes, designSpace, color, parent) {
        this.id = id;
        this.name = name;
        this.displayName = displayName;
        this.axes = axes;
        this.children = [];
        this.edit = [false, false];
        this.ag = "Ag";
        this.designSpace = designSpace;
        this.color = color;
        this.exportFont = true;
        this.openTypeFeatures = true;
        this.updateMetapolationValues();
        
        Object.defineProperty(this, 'parent', {
            value: parent,
            enumerable: false,
            writable: true,
            configurable: true
        });
        
        this.addInitialGlyphs();
    }
    
    var _p = InstanceModel.prototype = Object.create(Parent.prototype);
    
    _p.addInitialGlyphs = function() {
        var glyphs = this.parent.parent.parent.glyphs;
        for (var i = glyphs.length - 1; i >= 0; i--) {
            var glyphName = glyphs[i];
            this.addGlyph(glyphName);
        }
    };
    
    _p.updateMetapolationValues = function () {
        window.logCall("updateMetapolationValues");
        var axes = this.axes
          , n = axes.length - 1
          , thisPiece;
        // when only 1 axis, the value is alway 1
        // this also prevents the possibility from dividing by 0, which can only appear with 1 master
        if (n === 0) {
            axes[0].metapolationValue = 1;
        } else {
            var cake = 0;
            for (var i = n; i >= 0; i--) {
                thisPiece = parseFloat(axes[i].axisValue);
                cake += thisPiece;
            }
            for (var j = n; j >= 0; j--) {
                thisPiece = parseFloat(axes[j].axisValue);
                axes[j].metapolationValue = thisPiece / cake;
            }   
        }
    };
    
    _p.addGlyph = function (name) {
        window.logCall("addGlyph");
        this.children.push(
            new GlyphModel(name, this.name, this)
        );
    };
   
    _p.addAxis = function(master, axisValue, metapolationValue) {
        window.logCall("addAxis");
        this.axes.push(
            new AxisModel(master, axisValue, metapolationValue)
        ); 
        this.updateMetapolationValues();   
    };
    
    _p.reDestributeAxes = function(slack) {
        // this functin is called after a change of slack master
        var axes = this.axes
          , l = axes.length
          , ratio
          , max = null
          , highest = null;
        // 1 find highest of the others
        for (var i = 0; i < l; i++) {
            if (axes[i].axisValue >= max && i != slack) {
                highest = i;
                max = axes[i].axisValue;
            }
        }
        // 2 find ratio of others compared to highest
        ratio = 100 / (parseFloat(max) + parseFloat(axes[slack].axisValue));
        console.log(ratio);
        for (var j = 0; j < l; j++) {
            axes[j].axisValue = this.formatAxisValue(ratio * axes[j].axisValue);
        }
    };
    
    _p.formatAxisValue = function(x) {
        return Math.round(x * 10) / 10;
    };
    
    return InstanceModel;
});
