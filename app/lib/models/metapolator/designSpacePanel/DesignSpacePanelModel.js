define([
    '../_BaseModel'
  , './DesignSpaceModel'
], function(
    Parent
  , DesignSpaceModel
){
    "use strict";
    function DesignSpacePanelModel() {
        this.designSpaceCounter = 0;
        this.designSpaces = [];
        this.currentDesignSpace = null;
        this.currentDesignSpaceTrigger = 0;
        this.nrOfAxesTrigger = 0;
    }

    var _p = DesignSpacePanelModel.prototype = Object.create(Parent.prototype);

    _p.setCurrentDesignSpace = function(designSpace) {
        this.currentDesignSpace = designSpace;
        // what is that doing?
        this.currentDesignSpaceTrigger++;
    };

    _p.addDesignSpace = function() {
        window.logCall("addDesignSpace");
        var id = this.designSpaceCounter;
        var name = "Space " + id;
        var type = "Control";
        var axes = [];
        var slack = 0;
        this.designSpaces.push(
            new DesignSpaceModel(id, name, type, axes, slack, this)
        );
        this.designSpaceCounter++;
        this.setCurrentDesignSpace(this.designSpaces[this.designSpaces.length - 1]);
    };

    _p.removeDesignSpace = function(designSpace) {
        window.logCall("removeDesignSpace");
        var self = this
          , index = findDesignSpace(designSpace) ;
        this.designSpaces.splice(index, 1);
        this.findNewCurrentDesignSpace(index);

        function findDesignSpace(designSpace) {
            // all of these thing should be done with an object.
            // we can easily create unique keys for design spaces, etc
            // no need for linear searches.
            for (var i = self.designSpaces.length - 1; i >= 0; i--) {
                var thisDesignSpace = self.designSpaces[i];
                if (thisDesignSpace == designSpace) {
                    return i;
                }
            }
        }
    };

    _p.duplicateDesignSpace = function() {
        window.logCall("duplicateDesignSpace");
        var copy = this.currentDesignSpace;// this is not a copy
        var id = this.designSpaceCounter;
        var name = "Space " + id;
        var type = "Control";
        var axes = [];
        for (var i = 0, l = copy.axes.length; i < l; i++) {
            // whatever datatype copy.axes[i] is this may be a reference
            // i think the axis item was created in
            // DesignSpacePanelController.duplicateDesignSpace
            // or in ??? (where are new axes created?)
            // there is also an AxesModel, what is that good for?
            axes.push(copy.axes[i]);
        }
        var slack = copy.slack;
        this.designSpaces.push(
            new DesignSpaceModel(id, name, type, axes, slack, this)
        );
        this.designSpaceCounter++;
        this.setCurrentDesignSpace(this.designSpaces[this.designSpaces.length - 1]);
    };

    // wrong name, should be setCurrentDesignSpace
    // uh that exists already ... so what do we need this for?
    // Also, I wonder why index can be out of range. This should rather
    // throw an exception than try to recover. The caller either knows
    // which designspace to got for ot it should not call, eh?
    // we could allow negative indexes, though. -1 would be the last index
    // also, should return the index if the current design space.
    _p.findNewCurrentDesignSpace = function (index) {
        window.logCall("findNewCurrentDesignSpace");
        var l = this.designSpaces.length;
        if (l > index) {
            this.setCurrentDesignSpace(this.designSpaces[index]);
        } else if (l == 0) {
            this.setCurrentDesignSpace(null);
        } else {
            this.setCurrentDesignSpace(this.designSpaces[l - 1]);
        }
    };

    return DesignSpacePanelModel;
});
