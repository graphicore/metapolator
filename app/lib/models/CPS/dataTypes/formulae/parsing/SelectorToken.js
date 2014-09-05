define([
    'metapolator/errors'
  , './_ValueToken'
], function(
    errors
  , Parent
) {
    "use strict";

    /**
     * Literal is a string representing a CPS selector.
     * Value is a CPS/elements/SelectorList as produced by the
     * CPS/parsing/parseSelectorList module.
     */
    function SelectorToken(literal) {
        Parent.call(this, literal, 0, 0);
    }

    var _p = SelectorToken.prototype = Object.create(Parent.prototype);
    _p.constructor = SelectorToken;

    return SelectorToken;
}
