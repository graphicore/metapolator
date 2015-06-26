define([
    '../_BaseModel'
], function(
    Parent
){
    "use strict";
    function DesignSpaceModel(id, name, type, axes, slack, parent) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.axes = axes;
        this.slack = slack;
        this.lastInstance = null;


        // so this was added because angular.equals was evaluating recursive
        // otherwise. It would be preferable to not need angular.equals at all
        // possible?
        Object.defineProperty(this, 'parent', {
            value: parent,
            enumerable: false,
            writable: true,
            configurable: true
        });
    }

    var _p = DesignSpaceModel.prototype = Object.create(Parent.prototype);

    _p.addAxis = function(master) {
        window.logCall("addAxis");
        this.axes.push(master);
        this.parent.nrOfAxesTrigger++;
    };

    // maybe the right thing to do here is
    // _p.removeAxis = function(index)
    // why pass the master?
    _p.removeAxis = function(master) {
        window.logCall("removeAxis");
        var self = this// no self. do this._findMaster(); even better this._getMaster(master)
          , index = findMaster(master);
        this.axes.splice(index, 1);
        // setting the new slack if needed
        if (index < this.slack) {
            self.slack--;
        } else if (index == this.slack) {
            this.slack = 0;
        }
        // what if there is no master?
        // no else clause here?

        if (this.axes.length < 3) {
            this.slack = 0;
        }
        this.parent.nrOfAxesTrigger++;

        function findMaster(master) {
            //TODO: use an object for fast access.
            // or use the index and don't search at all.
            for (var i = self.axes.length - 1; i >= 0; i--) {
                var thisMaster = self.axes[i];
                if (thisMaster == master) {
                    return i;
                }
            }
        }
    };

    _p.setLastInstance = function(instance) {
        this.lastInstance = instance;
    };

    return DesignSpaceModel;
});
