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
    
    _p.removeAxis = function(master) {
        window.logCall("removeAxis");
        var self = this
          , index = findMaster(master);
        this.axes.splice(index, 1);
        // setting the new slack if needed
        if (index < this.slack) {
            self.slack--;
        } else if (index == this.slack) {
            this.slack = 0;
        }
        if (this.axes.length < 3) {
            this.slack = 0;
        }
        this.parent.nrOfAxesTrigger++;    

        function findMaster(master) {
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
