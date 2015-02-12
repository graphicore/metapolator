define([
    'metapolator/errors'
  , './_Node'
  , './AtRuleName'
  , './SelectorList'
  , './Rule'
], function(
    errors
  , Parent
  , AtRuleName
  , SelectorList
  , Rule
) {
    "use strict";
    var CPSError = errors.CPS;
    /**
     * A list of Rule, ParameterCollection (also @namespace, @import) and
     * Comment Elements
     */
    function ParameterCollection(items, source, lineNo) {
        Parent.call(this, source, lineNo);
        this._items = [];
        if(items.length)
            Array.prototype.push.apply(this._items, items);

        this._name = null;
        this._rules = null;
        this._rulesCacheSubscriptions = [];
        if(!this._allowNamespace) {
            // lock this.name
            this.name = undefined;
        }
    }
    var _p = ParameterCollection.prototype = Object.create(Parent.prototype);
    _p.constructor = ParameterCollection;

    // called in RuleController._set
    _p.reset = function(/* same as constructor ! */) {
        this._unsetRulesCache();

        // FIXME: without having other listeners on these items, we'll
        // probably won't need to call the destroy method
        // but maybe this becomes interesting when the ui displays this
        // data structure
        // items = this._items;
        // this._items = null;
        // for(var i=0,l=items.length;i<l;i++)
        //     items[i].destroy();

        // reset all own, enumerable, configurable properties
        Object.keys(this).forEach(function(key) {
            if(Object.getOwnPropertyDescriptor(this, key).configurable)
                delete this[key];
        }, this);

        this.constructor.apply(this, Array.prototype.slice.call(arguments));
        // the collection changed most probably
        this._trigger('structural-change');
    };

    _p.toString = function() {
        return this._items.join('\n\n');
    };

    // FIXME/TODO: add item/ remove item functionality!
    // items that are important for cache invalidations are:
    // Rules, @namespace, @import ... the latter two can maybe be handled
    // just as ParameterCollection so enhancing is easier
    // maybe a Array.prototype.slice like interface is best, as it can do
    // inserting and removing.
    // a remove(indexes) would be nice as well, however.

    function _filterRules(item) {
        return item instanceof Rule;
    }
    Object.defineProperty(_p, 'rules', {
        get: function(){return this._items.filter(_filterRules);}
    })

    Object.defineProperty(_p, 'length', {
        get: function(){ return this._items.length }
    })

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

    /**
     *  invalidate the cache on the right occasions,
     * This are events that imply:
     *  -- That a child rule changed its SelectorList
     *  -- That this AtNamespaceCollection changed its SelectorList (right???)
     *  -- That this ParameterCollection changed its set of Rules
     *  -- That a child ParameterCollection changed its set of Rules
     *
     * We dont need invalidation of this cache if a Rule changed the contents
     * of its ParameterDict.
     */
    _p._unsetRulesCache = function() {
        var i,l, subscription;
        this._rules = null;
        this._unsubscribeAll();
    }

    _p._subscribe = function(item, channel, callback, data) {
        var subscriptionID = item.on(channel, callback, data);
        this._rulesCacheSubscriptions.push(item, subscriptionID);
    }
    _p._unsubscribeAll = function() {
        for(i=0,l=this._rulesCacheSubscriptions.length;i<l;i++) {
            subscription = this._rulesCacheSubscriptions[i];
            subscription[0].off(subscription[1]);
        }
        this._rulesCacheSubscriptions = [];
    }

    _p._structuralChangeHandler = function(data, channelName, eventData) {
        this._unsetRulesCache();
        this._trigger('structural-change');
    };

    _p._getRules = function () {
        var i, l, j, ll
          , rules = []
          , childRules
          , item, rule
          , selectorList
          , callback = [this, '_structuralChangeHandler']
          , channel = 'selector-change'
          , collectionChannel = 'structural-change'
          ;
        for(i=0, l=this._items.length;i<l;i++) {
            item = this._items[i];
            if(item instanceof Rule) {
                this._subscribe(item, ruleChannel, callback);
                selectorList = item.getSelectorList();
                if(! selectorList.selects ) continue;
                // 0: array of namespaces, initially empty
                // 1: the instance of Rule
                // thus: [selectorList, rule, [_Collections where this rule is embeded]]
                rules.push([ selectorList, item, [this] ]);
            }
            else if(item instanceof ParameterCollection) {
                childRules = item.rules;
                for(j=0,ll=childRules.length;j<ll;j++) {
                    rule = childRules.rules[j];
                    // add `this` to the third entry to produce a history
                    // of nested ParameterCollections, this is to show
                    // in the the ui where this rule comes from
                    rule[2].push(this);
                    rules.push(rule);
                }
                this._subscribe(item, collectionChannel, callback);
            }
        }
        return rules;
    };

    return ParameterCollection;
});
