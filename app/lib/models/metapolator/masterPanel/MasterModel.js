define([
    './_ElementModel'
  , './GlyphModel'
], function(
    Parent
  , GlyphModel
){
    "use strict";
    function MasterModel(name, baseParameters, baseOperators, parent, masterPanel) {
        this.level = "master";
        this.name = name;
        this.displayName = name;
        this.display = false;
        this.edit = [true, true];
        this.ag = "Ag";
        this.children = [];
        this.parameters = [];
        this.addBaseModels(baseParameters, baseOperators);
        
        Object.defineProperty(this, 'parent', {
            value: parent,
            enumerable: false,
            writable: true,
            configurable: true
        });
        Object.defineProperty(this, 'masterPanel', {
            value: masterPanel,
            enumerable: false,
            writable: true,
            configurable: true
        });
    }
    
    var _p = MasterModel.prototype = Object.create(Parent.prototype);
    
    _p.addGlyph = function(name) {
        this.children.push(
            new GlyphModel(name, this.name, this.baseParameters, this.baseOperators, this, this.masterPanel)
        );
    };
   
   _p.findGlyphByName = function(glyphName) {
       window.logCall("findGlyphByName");
       for (var i = 0, l = this.children.length; i < l; i++) {
           var glyph = this.children[i];
           if (glyph.name == glyphName) {
               return glyph;
           }
       }
       return false;
   };
    
    
    return MasterModel;
});
