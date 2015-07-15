define([
    'metapolator/ui/redPill/cpsPanel/elements/cpsTools'
  , 'metapolator/ui/redPill/cpsPanel/elementToolbar/clickHandler'
], function(
    cpsTools
  , clickHandler
) {
    "use strict";
    function RuleController($scope) {
        this.$scope = $scope;
        $scope.index = this.index;
        this.initNewPropertyHandler = this.initNewProperty.bind(this);
        this.cancelNewPropertyHandler = this.cancelNewProperty.bind(this);
        $scope.newProperty = false;
        $scope.$on('finalizeNewProperty', this.finalizeNewProperty.bind(this));
        this.clickToolHandler = clickHandler.bind(this, 'toolClick');
    }

    RuleController.$inject = ['$scope'];
    var _p = RuleController.prototype;

    _p.cancelNewProperty = function() {
        // if a new-property is open: close it
        this.$scope.newProperty = false;
    };

    // this is currently an alias of cancelNewProperty
    // because the new-property controller will add the new property
    // itself to the model
    _p.finalizeNewProperty = _p.cancelNewProperty;

    _p.initNewProperty = function() {
        // open a new-property interface
        this.$scope.newProperty = true;
    };

    return RuleController;
});
