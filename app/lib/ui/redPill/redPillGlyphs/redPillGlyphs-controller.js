define([], function() {
    "use strict";
    function RedPillGlyphsController($scope, selectGlyphs, updateCPS) {
        this.$scope = $scope;
        this.$scope.name = 'redPillGlyphs';
        this.$scope.selectGlyphs = selectGlyphs;
        this.$scope.updateCPS = updateCPS;
        
        // a default value
        this.$scope.selector = 'glyph';
        
        this.$scope.glypsize = this.$scope.initialGlypsize = 50;
        this.$scope.$on('cpsUpdate', function(){
            this.$scope.$apply()
        }.bind(this));
    }
    RedPillGlyphsController.$inject = ['$scope', 'selectGlyphs'];
    var _p = RedPillGlyphsController.prototype;
    
    return RedPillGlyphsController;
})
