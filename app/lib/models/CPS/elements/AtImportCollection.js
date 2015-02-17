define([
    'metapolator/errors'
  , './ParameterCollection'
  , 'es6/Proxy'
  , 'obtain/obtain'
], function(
    errors
  , Parent
  , Proxy
  , obtain
) {
    "use strict";
    var CPSError = errors.CPS;
    /**
     * Essentially a proxy for the parameterCollection argument. But
     * we can define new properties or override existing ones. And we have
     * a new type.
     *
     * Even though the Constructor returns not it's own `this` value,
     * instead a Proxy of it, we can still test its type:
     *         instanceof ParameterCollection === true
     *         instanceof AtImportCollection === true
     *
     * The serialization results in an @import Rule, not in the actual
     * cps that the parameterCollection would produce, but we can still
     * use it as if it was the parameterCollection directly.
     *
     * ResourceName: the resource name of the @import rule
     * in `@import "bold.cps";` "bold.cps" is the resourceName
     *
     * parameterCollection: the instance of the ParameterCollection that
     * is loaded for resourceName.
     */
    function AtImportCollection(ruleController) {
        this._resourceName = null;
        this._ruleController = ruleController;
        // no no parameter collection yet!
        this._proxy = new Proxy(this, new ProxyHandler(undefined));
        return this._proxy;
    }
    var _p = AtImportCollection.prototype = Object.create(Parent.prototype);
    AtImportCollection.prototype.constructor = AtImportCollection;

    function ProxyHandler(reference) {
        this._reference = reference;
        this.get = _get;
    }

    function _get(target, name, receiver) {
        /*jshint validthis:true*/
        if(_p.hasOwnProperty(name) || target.hasOwnProperty(name))
            return target[name];
        return this._reference[name];
    }

    _p._setResource = function(resourceName, parameterCollection) {
        // assert(!parameterCollection.invalid); <= should be valid, it's from ruleController
        if(this._proxy._reference === parameterCollection)
            return;
        // assert(this._resourceName !== resourceName) <= that would be a flaw in the logic somewhere
        this._resourceName = resourceName;
        this._proxy._reference = parameterCollection;
        // FIXME! this needs testing I have no idea if it works with all
        // that Proxy stuff.
        // FIXME: does this AtImportCollection have to subscribe to the
        // this._proxy._reference collection to proxy these or will the
        // events be propagated properly????
        this._trigger('resource-change', 'structural-change');
    };

    _p._getRule = function(async, resourceName) {
        return this._ruleController.getRule(async, resourceName);
    };
    /**
     * A lot of errors can happen here but we won't handle them!
     * As a last resort we can present the user what actually happened
     * but that is not happening here.
     */
    _p.setResource = obtain.factory(
        {
            parameterCollection:[false, 'resourceName', _p._getRule]
        }
      , {
            parameterCollection:[true, 'resourceName', _p._getRule]
        }
      , ['resourceName']
      , function(obtain, resourceName) {
            var parameterCollection = obtain('parameterCollection');
            this._setResource(resourceName, parameterCollection);
            return true;
        }
    );

    _p.toString = function() {
        return '@import "' + this.resourceName + '";';
    };

    Object.defineProperty(_p, 'invalid', {
        get: function() {
            return (!this._proxy._reference || this._proxy._reference.invalid);
        }
    });

    Object.defineProperty(_p, 'resourceName', {
        get: function(){ return this._resourceName; }
      , enumerable: true
    });

    return AtImportCollection;
});
