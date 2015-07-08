define([
    '../_BaseModel'
], function(
    Parent
){
    "use strict";
    function SpecimenSizesModel(parent) {
        this.fontSize = 144;
        this.lineHeight = null;
        this.lineHeightSetting = 1;

        Object.defineProperty(this, 'parent', {
            value: parent,
            enumerable: false,
            writable: true,
            configurable: true
        });
    }
    var _p = SpecimenSizesModel.prototype = Object.create(Parent.prototype);

    _p.updateLineHeight = function() {
        var lineHeight,
            lineHeightSetting = this.lineHeightSetting,
            fontSize = this.fontSize;

        // I would use the words directly as setting here, not numbers
        // i.e. if lineHeightSetting === 'tight'
        // also, the values to be filled in the formualar for each setting
        // should be data, then we would just pick from an object
        // if(lineHeightSetting in lineHeightSettingData)
        //        insert lineHeightSetting[lineHeightSetting] into the calculation
        // and a hint where this formula comes from would be nice as well
        // I think I remember that peter posted something about this
        // 0 = tight, 1 = normal, 2 = loose, -1 = custom (don't touch it then')
        if (lineHeightSetting != -1) {
            if (lineHeightSetting == 1) {
                lineHeight = (1 / (0.1 * fontSize + 0.58) + 0.8673).toFixed(1);
            } else if (lineHeightSetting == 0) {
                lineHeight = (1 / (0.1525 * fontSize + 0.85) + 0.7785).toFixed(1);
            } else if (lineHeightSetting == 2) {
                lineHeight = (1 / (0.087 * fontSize + 0.195) + 1.062).toFixed(1);
            }
            this.lineHeight = lineHeight;
        }
    };

    return SpecimenSizesModel;
});
