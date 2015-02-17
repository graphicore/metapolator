define([
    'metapolator/errors'
  , './ParameterCollection'
  , './SelectorList'
], function(
    errors
  , Parent
  , SelectorList
) {
    "use strict";
    var CPSError = errors.CPS
      , ValueError = errors.Value
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
            this._items.join('\n\n') ,'\n}'].join('');
    };

    Object.defineProperty(_p, 'invalid', {
        get: function() {
            return !this._selectorList || this._selectorList.invalid;
        }
    });

    Object.defineProperty(_p, 'selectorList', {
        enumerable: true
      , set: _p.setSelectorList
      , get: function() {
            return this._selectorList;
        }
    });

    /**
     * Selectorlist may be invalid when it is set initially.
     * This is that the parser can set selectorlist even if it
     * was invalid in the source file, but the API should not be allowed
     * to do so dynamically.
     * If the api creates a new AtNamespaceCollection it still
     * can set an invalid selectorlist (or none). There is however little
     * use for it because an invalid AtNamespaceCollection wont be accepted
     * by a parent ParameterCollection. If there's a problem with this
     * behavior we may change it.
     */
    _p.setSelectorList = function(selectorList) {
        if(!(selectorList instanceof SelectorList))
            throw new CPSError('selectorList has the wrong type, expected '
                + 'SelectorList but got: '
                + (selectorList.constructor.name
                    ? selectorList.constructor.name
                    : selectorList.constructor));
        else if(selectorList.invalid && this._selectorList !== null)
            throw new ValueError('trying to set an invalid selectorList: '+ selectorList);

        this._selectorList = selectorList;
        this._unsetRulesCache();
        this._trigger(['selector-change', 'structural-change']);
    };

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
        rules = Parent.prototype._getRules.call(this);
        for(i=0,l=rules.length;i<l;i++)
            rules[i][0] = namespace.multiply(rules[i][0]);
        return rules;
    };

    return AtNamespaceCollection;
});
