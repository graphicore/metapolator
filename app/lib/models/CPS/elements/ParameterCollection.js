define([
    'metapolator/errors'
  , './_Collection'
  , './AtRuleCollection'
  , './AtRuleName'
  , './SelectorList'
  , './Rule'
], function(
    errors
  , Parent
  , AtRuleCollection
  , AtRuleName
  , SelectorList
  , Rule
) {
    "use strict";
    var CPSError = errors.CPS;
    /**
     * A list of Rule, AtRuleCollection, ParameterCollection, and
     * Comment Elements
     */
    function ParameterCollection(items, source, lineNo) {
        Parent.call(this, items, source, lineNo);
        this._name = null;
        this._rules = null;

        if(!this._allowNamespace) {
            // lock this.name
            this.name = undefined;
        }
    }
    var _p = ParameterCollection.prototype = Object.create(Parent.prototype);
    _p.constructor = ParameterCollection;

    //FIXME: emit changes
    // called in RuleController._set
    _p.reset = function(/* same as constructor ! */) {
        // reset all 'own' properties
        Object.keys(this).forEach(function(key){ delete this[key];}, this);
        this.constructor.apply(this, Array.prototype.slice.call(arguments));
        // the collection changed potentially
        this._trigger('reset|change');
    };

    _p.toString = function() {
        var result;
        if(!this._name)
            return this._items.join('\n\n');

        return ['@',this._name, ' {\n',
            this._items.join('\n\n') ,'\n}'].join('');
    };

    Object.defineProperty(_p, 'name', {
        enumerable: true
      , get: function() {
            return (this._name ? this._name.name : null);
        }
      , set: function(name) {
            if(this._name !== null)
                throw new CPSError('Name is already set');
            if(name === undefined) {
                this._name = undefined;
                return;
            }
            else if(!(name instanceof AtRuleName))
                throw new CPSError('Name has the wrong type, expected '
                    + 'AtRuleName but got: '
                    + (name.constructor.name
                        ? name.constructor.name
                        : name.constructor));
            this._name = name;
        }
    });

    // TODO: cache
    // invalidate the cache on the right occasions,
    // This are events that imply:
    //  -- That a child rule changed its SelectorList
    //  -- That this AtNamespaceCollection changed its SelectorList (right???)
    //  -- That this ParameterCollection changed its set of Rules
    //  -- That a child ParameterCollection changed its set of Rules
    //
    // We dont need invalidation of this cache if a Rule changed the contents
    // of its ParameterDict!
    /**
     * this returns all rules that are direct children of this collection
     * AND all rules of ParameterCollection instances that are
     * direct children of this collection
     */
    Object.defineProperty(_p, 'rules', {
        get: function() {
            if(!this._rules)
                this._rules = this._getRules();
            return this._rules;
        }
    });

    // FIXME: - this needs caching
    //        - cache invalidation should be done via the yet to come internal mechanisms
    //        - the _getRules method and the "rules" getter are outdated, rename this into them
    //
    _p._getRules = function () {
        var i, l, j, ll
          , rules = []
          , childRules
          , item, rule
          , selectorList
          ;
        for(i=0, l=this._items.length;i<l;i++) {
            item = this._items[i];
            if(item instanceof Rule) {
                selectorList = item.getSelectorList();
                if(! selectorList.selects ) continue;
                // 0: array of namespaces, initially empty
                // 1: the instance of Rule
                // thus: [selectorList, rule, [_Collections where this rule is embeded]]
                rules.push([ selectorList, item, [this] ]);
            }
            else if(item instanceof ParameterCollection) {
                childRules = item.rules;
                for(j=0, ll=childRules.length;j<ll;j++) {
                    rule = childRules.rules[j];
                    // add `this` to the third entry to produce a history
                    // of nested ParameterCollections, this is to show
                    // in the the ui where this rule comes from
                    rule[2].push(this);
                    rules.push(rule);
                }
            }
        }
        return rules;
    };

    return ParameterCollection;
});
