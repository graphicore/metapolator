define([
    './_Node'
], function(
    Parent
) {
    "use strict";
    /**
     * A Parameter: name and value
     */
    function Parameter(parameterName, parameterValue, source, lineNo) {
        Parent.call(this, source, lineNo);
        this._name = parameterName;
        this._value = parameterValue;
    }
    var _p = Parameter.prototype = Object.create(Parent.prototype)
    _p.constructor = Parameter;

    _p.toString = function() {
        return [this._name, ': ', this._value,';'].join('');
    }

    // FIXME: when changing name or value, this parmeter may become
    // valid or invalid! Where does this happen?

    // FIXME: maybe we cant just set name or value, we could just
    // replace it via ParameterDict


    // this should cause caches associates with this item to be invalidated/pruned
    // it has nothing to do with the "invalid" flag
    _p.invalidateCaches = function() {
        throw new Error("not implemented");
        for(subscriber in subscribers)
            subscribers[subscriber]('invalidate-cache', this);
    }

    Object.defineProperty(_p, 'name', {
        get: function(){ return this._name.name; }
//      , set: function(newName) {
//            var oldName = this._name;
//            this._name = parameterName;
//            this.trigger('change-name', oldName, newName);
//        }
    })
    Object.defineProperty(_p, 'value', {
        get: function(){ return this._value; }
//      , set: function(newValue){
//            var oldValue = parameterValue;
//            this._value = newValue;
//            this.trigger('change-value', oldValue, newValue);
//        }
    })
    Object.defineProperty(_p, 'invalid', {
        get: function(){ return this._value.invalid; }
    })
    Object.defineProperty(_p, 'message', {
        get: function(){ return this._value.message; }
    })

    return Parameter;
})
