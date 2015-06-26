define([
    '../_BaseModel'
  , './InstanceModel'
], function(
    Parent,
    InstanceModel
){
    "use strict";
    function SequenceModel(name, parent) {
        this.name = name;
        this.instanceCounter = 0;
        this.children = [];
        this.colorCounter = 0;
        this.colors = ["#DC1F20", "#C95399", "#9E42F4", "#5939EC", "#5A86FE", "#A4E5FD", "#85C5A5", "#A9D323", "#F2E21D", "#D07f2C"];

        // this does not need to know parent.
        // at least, we can program that need away.for a while
        Object.defineProperty(this, 'parent', {
            value: parent,
            enumerable: false,
            writable: true,
            configurable: true
        });
    }

    var _p = SequenceModel.prototype = Object.create(Parent.prototype);

    // maybe rather call it addNewInstance
    _p.addInstance = function(axes, designSpace) {
        window.logCall("addInstance");
        // so, we give it an id, that's the perfect think to keep book about children
        // in a dictionary. (or at least about children indexes)
        var id = this.instanceCounter;
        var color = this.colors[this.colorCounter];
        this.children.push(
            new InstanceModel(id, "instance" + id, "Instance " + id, axes, designSpace, color, this)
        );

        this.instanceCounter++;
        // colorCounter. srsly?
        // How about (this.instanceCounter % this.colors.length)
        // this is representational anyways, should be done where rendering takes place
        this.colorCounter++;
        if (this.colorCounter >= this.colors.length) {
            this.colorCounter = 0;
        }
        // This is a hierarchy problem. child should never change parent.
        // Instead parrent should issue this method and then set its current
        // instance to the newly created one. This method should thus:
        // return newInstance
        // Maybe parent should not even store the reference, but a handle.
        // makes it easier in many cases.
        //set the newly created instance as current instance
        this.parent.setCurrentInstance(this.children[this.children.length - 1]);
    };


    return SequenceModel;
});
