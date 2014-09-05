define([
    'metapolator/errors'
  , './_Token'
], function(
    errors
  , Parent
) {
    "use strict";

    function _ValueToken(literal) {
        Parent.call(this, literal, 0, 0);
    }
    var _p = _ValueToken.prototype = Object.create(Parent.prototype);
    _p.constructor = _ValueToken;

    return _ValueToken;
}
