define([
    'jquery'
], function(
    $
) {
    "use strict";
    function AppController($scope, model, registerFrontend) {
        registerFrontend(this);
        this.$scope = $scope;
        this.$scope.name = 'app';
        this.$scope.model = this.model = model;
        
        $scope.getLandscapeLeft = function() {
            var end = $scope.model.display.panel.viewState * 2
              , parts = 0;
            for (var i = 0; i < end; i++) {
                parts += $scope.model.display.panel.panels[i].share;
            }
            return "calc(" + (parts / -16) + " * 100%)";
        };
        
        // every click outside a local menu head button
        // collapses the local menu
        $scope.releaseLocalMenu = function (event) {
            //console.log($(event.target).parents('.lm-head').length);
            if (!($(event.target).parents('.lm-head').length || $(event.target).hasClass("lm-head"))) {
                $scope.model.display.localMenu = null;
            }
        };
        
        $scope.reAdjustPanels = function (){
            var windowWidth = $(window).outerWidth();
            for (var i = $scope.model.display.panel.panels.length - 1; i >= 0; i--) {
                var panel = $scope.model.display.panel.panels[i];
                if (panel.restricted) {
                    var width = panel.share / 16 * windowWidth, difference;
                    if (width < panel.min) {
                        difference = width - panel.min;
                    } else if (width > panel.max) {
                        difference = width - panel.max;
                    }
                    if (difference) {
                        panel.share = (width - difference) / windowWidth * 16;
                        for (var j = 0, l = panel.giveTo.length; j < l; j++) {
                            var giveTo = panel.giveTo[j],
                                giveToPanel = $scope.model.display.panel.panels[giveTo];
                            giveToPanel.share = ((giveToPanel.share / 16 * windowWidth) + difference) / windowWidth * 16;
                        }
                    }
                }
            }
            $scope.model.display.panel.totalPanelParts = $scope.getTotalParts();
        };
        
        $scope.getTotalParts = function() {
            var parts = 0;
            for (var i = 0, l = $scope.model.display.panel.panels.length; i < l; i++) {
                var panel = $scope.model.display.panel.panels[i];
                parts += panel.share;
            }
            return parts;
        };
        
        $scope.reAdjustPanels();
    }

    AppController.$inject = ['$scope', 'metapolatorModel', 'registerFrontend'];
    var _p = AppController.prototype;

    _p.redraw = function() {
        this.$scope.$apply();
    };

    return AppController;
});
