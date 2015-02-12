define([
    'metapolator/errors'
  , './ParameterCollection'
], function(
    errors
  , Parent
) {
    "use strict";
    var CPSError = errors.CPS
      ;
    /**
     * A list of Rule, AtRuleCollection, ParameterCollection, and
     * Comment Elements
     */
    function AtNamespaceCollection(name, selectorList, items, source, lineNo) {
        // The _allowNamespace property of this prototype tells the Parent
        // constructor to not look up this.name
        Parent.call(this, items, source, lineNo);
        this._selectorList = null;
        if(name)
            this.name = name;

        if(selectorList)
            this.selectorList = selectorList;
    }

    var _p = AtNamespaceCollection.prototype = Object.create(Parent.prototype);
    _p.constructor = AtNamespaceCollection;

    _p._allowNamespace = true;

    _p.toString = function() {
        return ['@',this.name, '(', this.selectorList,')', ' {\n',
            this._items.join('\n\n') ,'\n}'].join('')
    }

    Object.defineProperty(_p, 'selectorList', {
        enumerable: true
      , set: _p.setSelectorList
      , get: function() {
            return this._selectorList;
        }
    })

    // FIXME what about the setter interface from above???
    _p.setSelectorList = function(selectorList) {
        if(!(selectorList instanceof SelectorList))
            throw new CPSError('selectorList has the wrong type, expected '
                + 'SelectorList but got: '
                + (selectorList.constructor.name
                    ? selectorList.constructor.name
                    : selectorList.constructor));
        else if(selectorList.invalid && this._selectorList !== null)
            // FIXME return [false, message] || throw InvalidError(selectorList.message)?
            return;
        // selectorlist may be invalid when it is set initially
        // this is, so that the parser can set selectorlist even if it
        // was invalid, but the API should not be allowed to do so
        // dynamically.
        // TODO: if the api creates a new AtNamespaceCollection it still
        // can set an invalid selectorlist, so maybe this should be checked
        // somewhere else!

        this._selectorList = selectorList;
        this._unsetRulesCache();
        this._trigger(['selector-change', 'structural-change']);
    }

    /**
     * Wrapper to add the namespace to the rules returned by
     * Parant.prototype._getRules
     */
    _p._getRules = function() {
        var rules, i, l
          , namespace = this.selectorList
          ;
        if(namespace.invalid)
            return [];
        rules = Parant.prototype._getRules.call(this);
        for(i=0;l=rules.length;i<l;i++)
            rules[i][0] = namespace.multiply(rules[i][0]);
        return rules;
    }

    return AtNamespaceCollection;
})
