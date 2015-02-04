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

    Object.defineProperty(_p, 'name', {
        set: function(newName) {
            var oldName = this._name;
            this._name = parameterName;
            this.trigger('change-name', oldName, newName);
        }
      , get: function(){ return this._name.name; }
    })
    Object.defineProperty(_p, 'value', {
        set: function(newValue){
            var oldValue = parameterValue;
            this._value = newValue;
            this.trigger('change-value', oldValue, newValue);
        }
        get: function(){ return this._value; }
    })
    Object.defineProperty(_p, 'invalid', {
        get: function(){ return this._value.invalid; }
    })
    Object.defineProperty(_p, 'message', {
        get: function(){ return this._value.message; }
    })

    return Parameter;
})
