define([], function() {
    "use strict";
    function DesignSpacePanelController($scope, metapolatorModel) {
        this.$scope = $scope;
        this.$scope.name = 'designSpacePanel';

        $scope.selectDesignSpace = function (space) {
            $scope.model.setCurrentDesignSpace(space);
            // after switching design space, we need to set a new current instance
            // the last instance used in the design space is stored as lastInstance
            var currentInstance = space.lastInstance;
            metapolatorModel.instancePanel.setCurrentInstance(currentInstance);
        };

        $scope.addDesignSpace = function() {
            $scope.model.addDesignSpace();
            // should not talk to the model, but to the instancePanel Controller
            // not sure yet how exactly.
            metapolatorModel.instancePanel.setCurrentInstance(null);
            // too global. what is the container of design spaces?
            $scope.model.currentDesignSpace.lastInstance = null;
        };

        $scope.duplicateDesignSpace = function () {
            // each item in here should duplicate itself
            // this is too much overall knowledge about the structure in
            // one place.
            var oldDesignSpace = $scope.model.currentDesignSpace
              , panel = metapolatorModel.instancePanel;
            $scope.model.duplicateDesignSpace();
            var sequence0 = metapolatorModel.instancePanel.sequences[0];
            for (var i = metapolatorModel.instancePanel.sequences.length - 1; i >= 0; i--) {
                var sequence = metapolatorModel.instancePanel.sequences[i];
                for (var j = sequence.children.length - 1; j >= 0; j--) {
                    var instance = sequence.children[j];
                    // how many hit's are there? has every sequence one or
                    // many instances where: instance.designSpace === oldDesignSpace ?
                    if (instance.designSpace === oldDesignSpace) {
                        var axes = [];
                        for (var k = 0, l = instance.axes.length; k < l; k++) {
                            var axis = $scope.model.currentInstance.axes[k];
                            // now this on the other hand is a very informal
                            // definition of an axis.
                            axes.push({
                                axisValue: axis.axisValue,
                                metapolationValue : axis.metapolationValue,
                                master: axis.master // is this a MOM-Master?
                            });
                        }

                        sequence0.addInstance(axes, $scope.model.currentDesignSpace);
                    }
                }
            }
            panel.setCurrentInstance(panel.sequences[0].children[panel.sequences[0].children.length - 1]);
        };

        $scope.removeDesignSpace = function () {
            // the caller should hint us which designspace to remove.
            // removing $scope.model.currentDesignSpace, that info is rather
            // held directly in the scope.
            //
            // this is already tracked by space.id, so we can call this with
            // space id as well.
            var designSpace = $scope.model.currentDesignSpace
              , message;
            if (designSpace.axes.length === 0) {
                $scope.model.removeDesignSpace(designSpace);
            } else {
                var n = metapolatorModel.instancePanel.countInstancesWithDesignSpace(designSpace);
                if (n === 1) {
                    message = "Delete this design space and its instance?";
                } else {
                    message = "Delete this design space and its " + n + " instances?";
                }
                metapolatorModel.display.dialog.confirm(message, function(result){
                    if (result) {
                        metapolatorModel.instancePanel.removeInstanceOnDesignSpace(designSpace);
                        $scope.model.removeDesignSpace(designSpace);
                        $scope.$apply();
                    }
                });
            }
        };
    }

    DesignSpacePanelController.$inject = ['$scope', 'metapolatorModel'];
    var _p = DesignSpacePanelController.prototype;

    return DesignSpacePanelController;
});
