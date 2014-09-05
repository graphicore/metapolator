define([
    'metapolator/errors'
  , './_Token'
], function(
    errors
  , Parent
) {
    "use strict";

    var CPSFormulaError = errors.CPSFormula;

    function OperatorToken(literal, precedence, preConsumes, postConsumes, routine) {
        Parent.call(this, literal, preConsumes, postConsumes);
        if(typeof precedence !== 'number')
            throw new CPSFormulaError('Precedence must be a number, but is "'
                                + precedence +'" typeof: '+ typeof precedence);
        this._precedence = precedence;
        this._routine = routine;
    }

    var _p = OperatorToken.prototype = Object.create(Parent.prototype);
    _p.constructor = OperatorToken;


    Object.defineProperty(_p, 'precedence', {
        get: function(){ return this._precedence; }
    })

    _p.execute = function(/* arguments */) {
        // this could be overidden by an inheriting Class, to do common
        // pre/post execution tasks, like checking or transforming values
        // for example.
        return this._routine.apply(this, Array.prototype.slice.call(arguments));
    }

    return OperatorToken;
}
