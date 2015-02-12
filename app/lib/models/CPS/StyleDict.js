define([
    'metapolator/errors'
  , './cpsGetters'
  , 'metapolator/memoize'
  , 'metapolator/models/emitterMixin'
], function(
    errors
  , cpsGetters
  , memoize
  , emitterMixin
) {
    "use strict";

    var KeyError = errors.Key
      , ReceiverError = errors.Receiver
      , AssertionError = errors.Assertion
      , CPSKeyError = errors.CPSKey
      , CPSRecursionError = errors.CPSRecursion
      , assert = errors.assert
      , propertyChangeEmitterSetup
      ;

    propertyChangeEmitterSetup = {
          stateProperty: '_dependants'
        , onAPI: 'onPropertyChange'
        // TODO: Not deleting the channel will take a bit more memory but in turn
        // needs less garbadge collection
        // we could delete this when the key is removed from this._dict
        // and not added again, supposedly in _rebuildIndex and _paramerChangeHandler
        // delete this._dependants[key];
        // however, _rebuildIndex and updateDictEntry are not part of
        // the concept of emitter/channel thus the emitter should
        // provide a method: removeProperty(channel) which in turn can be called by
        // _rebuildIndex and updateDictEntry. Also, that would throw an error
        // if there are any subscriptions left. (we may add a on-delete event)
        // for that case!?
        , offAPI: 'offPropertyChange'
        , triggerAPI: '_triggerPropertyChange'
    };

    /**
     * StyleDict is an interface to a List of CPS.Rule elements.
     */
    function StyleDict(controller, rules, element) {
        // I prefer: this.get.bind(this);
        // But this method is called a lot and thus the closure is faster.
        // see: http://jsperf.com/bind-vs-native-bind-run
        // that may change in the future
        var self = this;


        // new GetAPI(this); => would make a cleaner definition, but maybe slows things down???
        this.getAPI = {
            get: function(key) {
                var result = self.get(key);
                self._subscribeTo(self, key);
                return result;
            }
          , query: function(node, selector){
                var result = node.query(selector);
                self._subscribeTo(self, key);
            }
          , genericGetter: function(item, key){
                return self._genericGetter(item, key);
            }
        };


        Object.define(this, 'element', {
            value: element
          , enumerable: true
        });
        this._controller = controller;
        this._getting = {
            recursionDetection: Object.create(null)
          , stack: []
          , current: null
        };

        this._rules = rules;
        this._dict = null;
        this._cache = Object.create(null);

        // subscriptions to the "add" channel of each parameterDict in this._rules
        this._dictSubscriptions = [];

        // subscriptions to the active key in a parameterDict
        //
        // triggered on "change" and "delete" (also on "add" but we subscribe later)
        //
        // cache_key refers to the same name here and in the parameterDict
        // {
        //    cache_key: [parameterDict, subscriptionUid] /* information needed to unsubscribe */
        // }
        this._propertySubscriptions = Object.create(null);

        // All current subscriptions to dependencies of the cache.
        // One subscription can be used by many _cache entries.
        // {
        //    subscriptionUid: [
        //        /* information needed to unsubscribe */
        //          item // the item/element/object subscribed to
        //        , subscriberId // needed to unsubscribe, returned when subscribing
        //
        //        /* information to control subscribing and unsubscribing */
        //        , object // set of _cache keys subscribed to this
        //        , 0 // counter, number of dependencies, same as previous Object.keys(object).length
        //    ];
        //}
        this._cacheSubscriptions = Object.create(null);

        // the subscriptionUids for each key in cache
        // {
        //    cache_key: [subscriptionUid, ...]
        // }
        this._cacheDependencies = Object.create(null);

        // emitter: PropertyChange
        // Adds this[propertyChangeEmitterSetup.stateProperty]
        // which is this._dependencies
        emitterMixin.init(this, propertyChangeEmitterSetup);

        this._subscriptionUidCounter = 0;
        this._subscriptionUids = new WeakMap();
    }

    var _p = StyleDict.prototype;
    _p.constructor = StyleDict;

    /**
     * adds the methods:
     *    onPropertyChange(propertyName, subscriberData) // returns subscriptionId
     *    offPropertyChange(subscriptionId)
     *    _triggerPropertyChange(propertyName, eventData)
     */
    emitterMixin(_p, propertyChangeEmitterSetup);

    _p._getSubscriptionUid = function(item, key) {
        var uid;
        if(item instanceof _MOMNode) {
            if(key instanceof SelectorList)
                // TODO: currently all subtree changes are handled as one.
                // I think we may become finer grained here. Like for example
                // only fire if a change in a subtree affects the result
                // of item.query(key); then, the SubscriptionUid must be
                // different for different selectors. Until then all selectors
                // for a _MOMNode have the same SubscriptionUid:
                return item.nodeID + 'S:$'// + key
            else
                return item.nodeID + ':' + key;
        }
        else if(item instanceof StyleDict)
            return '!' + item.element.nodeID + ':' + key;
        // fallback, rare cases
        uid = this._subscriptionUids.get(item);
        if(!uid) {
            uid = '?' + (this._uidCounter++) + ':' + key;
            this._subscriptionUids.set(item, uid);
        }
        return uid;
    };

    _p._subscribeTo = function(item, key) {
        var subscriberID
          , subscriptionUid = this._getSubscriptionUID(item, key)
          , current = this._getting.current
          , dependencies = this._cacheSubscriptions[subscriptionUid]
          ;
        // add dependency current to subscriptionUid
        if(!dependencies) {
            if(key instanceof SelectorList) {
                // TODO: this can be controlled finer. But at the moment
                // we don't do MOM tree changes anyways.
                assert(item instanceof _MOMNode, 'When "key" is a Selector "item" must be a MOM Element.');
                subscriberId = item.onSubtreeChange(key, [this, '_invalidateCacheHandler'], subscriptionUid);
            }
            else {
                subscriberId = item.onPropertyChange(key, [this, '_invalidateCacheHandler'], subscriptionUid);
            }
            dependencies = this._cacheSubscriptions[subscriptionUid]
                         = [item, subscriberId, Object.create(null), 0];
        }
        else if(current in dependencies[2])
            // that cache already subscribed to item.key
            return;
        dependencies[2][current] = true;//index
        dependencies[3 += 1;// counter

        if(!this._cacheDependencies[current])
            this._cacheDependencies[current] = [];
        this._cacheDependencies[current].push(subscriptionUid);
    };

    _p._invalidateCacheHandler = function(subscriptionUid) {
        assert(subscriptionUid in this._cacheSubscriptions, 'must be subscribed now');
        var dependencies = Object.keys(this._cacheSubscriptions[subscriptionUid][2])
          , i, l
          ;
        for(i=0,l=dependencies.length;i<l;i++)
            this._invalidateCache(dependencies[i]);
        assert(!(subscriptionUid in this._cacheSubscriptions), 'must NOT be subscribed anymore');
    };

    _p._unsubscribeFromAll = function(key) {
        // we have probably collected dependencies for this cache, since
        // the cache is now invalidated, the dependencies can be unsubscribed
        var dependencies = this._cacheDependencies[key]
          , subscriptionUid
          , subscriptions
          , i, l
          ;
        if(!dependencies)
            return;
        for(i=0,l=dependencies.length-1;i<l;i++) {
            subscriptionUid = dependencies[i];
            subscription = this._cacheSubscriptions[subscriptionUid];
            // remove dependency key from subscription
            delete subscription[2][key];//index
            subscription[3] -= 1;//counter
            if(subscription[3])
                continue;
            // no deps left
            subscription[0].offPropertyChange(subscription[1]);
            delete this._cacheSubscriptions[subscriptionUid];
        }
        delete this._cacheDependencies[key];
    };

    _p._genericGetter = function (item, key) {
        var result;
        if(item === undefined) {
            // used to be a
            // pass
            // is this happening at ALL?
            // in which case?
            // is that case legit?
            throw new Error('trying to read "'+key+'" from an undefined item');
            // also see cpsGetters.whitelist for a similar case
        }
        else if(item instanceof _MOMNode) {
            var cs = item.getComputedStyle();
            result = cs.get(key);
            this._subscribeTo(cs, key);
        }
        else if(item.cps_proxy) {
            // FIXME:
            // do we need this case at all? probably when item is a
            // PenStrokePoint.skeleton and key is on/in/out
            // I don't know if there's another case
            // This means, however that everything that has a cps_proxy
            // will have to provide a `onPropertyChange` API (which makes totally sense)
            // arrays are obviously exceptions...
            // so, the do we need this subscription at all question arises again
            //
            // FIXME: can't we just not subscribe to this and do the same as with array
            // that is the original source of this item must be subscribed and =
            // fire if item changes...
            // it is probably happening in __get anyways, like this
            // cpsGetters.whitelist(this.element, name);
            // and then a this._subscribeTo(this.element, name)
            // REMEMBER: this code was extracted from a merge of
            // cpsGetters.generic plus cpsGetters.whitelist
            // so, in the best case, we wouldn't use this condition at all,
            // I think
            result = item.cps_proxy[key];
            this._subscribeTo(item, key);
        }
        else if(item instanceof Array)
            result = whitelistProxies.array(item)[key];
            // no subscription! the source of the Array should be subscribed
            // to and fire when the array changes
        else
            throw new KeyError('Item "'+item+'" doesn\'t specify a whitelist for cps, trying to read '+key);
        return result;
    };


    _p._buildIndex = function() {
        var i, l, j, ll, keys, key, parameters, subscriberID;
        this._dict = Object.create(null);
        for(i=0,l=this._rules.length;i<l;i++) {
            parameters = this._rules[i].parameters;
            subscriberID = parameters.on('add', [this, '_parameterAddHandler'], i);
            this._dictSubscriptions.push([parameters, subscriberID]);

            keys = parameters.keys();
            for(j=0, ll=keys.length; j<ll; j++) {
                key = keys[j];
                if(!(key in this._dict))
                    this._setDictValue(parameters, key, i);
            }
        }
    };

   /**
     * This method is called when the ParameterCollection of this styleDict
     * changed so much that the this._items (rules) list needs to be rebuild
     *
     * Changes in the ParameterCollection that are of this kind are:
     * added or removed Rules
     * SelectorList changes (it's always replacement) of Rules OR AtNamespaceCollections
     * A reset of the ParameterCollection (which does all of the above)
     *
     * The value of this StyleDict may not change in the end but we don't
     * know that before)
     *
     * This doesn't include add/remove events of parameters/parameterDicts,
     * we'll handle that on another level.
     */
    _p.setRules = function(rules) {
        var i, l, subscription;
        this._rules = rules;

        for(i=0;l=this._dictSubscriptions.length;i<l;i++) {
            subscription = this._dictSubscriptions[i];
            subscription[0].off(subscriptionp[1]);
        }
        this._rebuildIndex();
    };

    _p._rebuildIndex = function() {
        var key;
        for(key in this._dict) {
            this._unsetDictValue(key);
            this._invalidateCache(key);
        }
        this._buildIndex();
    };

    /**
     * parameters.onPropertyChange wont trigger on "add", because we won't
     * have subscribed to it by then.
     */
    _p._parameterAddHandler = function(data, channelKey, key) {
        var index = data
          , parametersIndexForKey = this._propertySubscriptions[key]
                    ? this._propertySubscriptions[key][2]
                    : false
          ;
        if(parametersIndexForKey > index)
            // the higher index overrides the lower index
            return;
        else if(parametersIndexForKey < index) {
            this._unsetDictValue(key);
            this._invalidateCache(key);
        }
        else if(parametersIndexForKey === index)
            // When both are identical this means we don't have an "add"
            // event by definition! Something in the programming logic went
            // terribly wrong.
            throw new AssertionError('The old index must not be identical '
                        + 'to the new one, but it is.\n index: ' + index
                        + ' key: ' + key
                        + ' channel: ' + channelKey);
        this._setDictValue(this._rules[index], key, index);
    }

    _p._setDictValue = function(parameters, key, parametersIndex) {
        assert(!(key in this._propertySubscriptions), 'there may be no dependency yet!');
        var subscription = this._propertySubscriptions[key] = [];
        this._dict[key] = parameters.get(key);
        subscription[0] = parameters;
        subscription[1] = parameters.onPropertyChange(key, [this, '_paramerChangeHandler'], parameters);
        subscription[2] = parametersIndex;
    };

    _p._unsetDictValue = function(key) {
        var subscription = this._propertySubscriptions[key];
        subscription[0].offPropertyChange(subscription[1]);
        delete this._dict[key];
        delete this._propertySubscriptions[key];
    };

    /**
     *  remake the this._dict entry for name
     */
    _p._updateDictEntry = function(key) {
        var i, l, parameters;
        this._unsetDictValue(key);
        this._invalidateCache(key);
        for(i=0,l=this._rules.length;i<l;i++) {
            parameters = this._rules[i].parameters;
            if(!parameters.has(key))
                continue;
            this._setDictValue(parameters, key, i);
            break;
        }
    };


    _p._paramerChangeHandler = function(parameters, key, eventData) {
        switch(eventData) {
            case('change'):
                // The value is still active and available, but its definition changed
                this._dict[key] = parameters.get(key);
                this._invalidateCache(key);
                break;
            case('delete'):
                // the key of parameters was removed without replacement
                // remove the entry and look for a new one
                this._updateDictEntry(key);
                break;
            default:
                throw new ReceiverError('Expected an event of "change" or '
                                       + '"delete" but got "'+eventData+'"');
        }
    }

    /**
     *  if name is in cache, invalidate the cache and inform all subscribers/dependants
     */
    _p._invalidateCache = function(key) {
        // FIXME: _p.get should not be called while this is running!
        // remove this check if everything behaves right.
        this._invalidating = true;

        if(!(key in this._cache)) {
            // Because the key is not cached, there must not be any dependency or dependant
            assert(!this._cacheDependencies[key] || !this._cacheDependencies[key].length
                , 'Because the key is not cached, there must not be any dependency or dependant');
            // FIXME: this should be the concern of the channel: PropertyChange
            // it certainly is wrong in here... remove without replacement when everything works
            // fine.
            assert(!this._dependants[key] || !this._dependants[key].length
                , 'Because the key is not cached, there must not be any dependency or dependant');
            return;
        }
        delete this._cache[key];
        this._unsubscribeFromAll(key);
        this._triggerPropertyChange(key);
        this._invalidating = false;
    };

    /**
     * Get a cps ParameterValue from the _rules
     * This is needed to construct the instance of the Parameter Type.
     * Returns Null if the name is not defined.
     */
    _p._getCPSParameterValue = function(name) {
        if(!this._dict) this._buildIndex();
        return (name in this._dict) ? this._dict[name] : null;
    };

    /**
     * Return a new instance of ParameterValue or null if the name is not defined.
     */
    _p._getParameter = function(name) {
        var cpsParameterValue = this._getCPSParameterValue(name);
        if(cpsParameterValue === null)
            return null;
        return cpsParameterValue.factory(name, this.element, this.getAPI);
    };

    _p.__get = function(name, errors) {
        var param = this._getParameter(name)
          , result
          ;
        if(param)
           return param.getValue();
        errors.push(name + ' not found for ' + this.element.particulars);
        // FIXME: prefer the following, then the cpsGetters module can be removed!
        // if that is not possible, it's certainly interesting why
        result = this.element.cps_proxy[key];
        // old:
        // result = cpsGetters.whitelist(this.element, key);
        this._subscribeTo(this.element, key);
        return result;
    };
    /**
     * Look up a parameter in this.element according to the following
     * rules:
     *
     * 1. If `name' is "this", return the MOM Element of this StyleDict
     * (this.element). We check "this" first so it can't be overridden by
     * a @dictionary rule.
     *
     * 2. If `name' is defiened in CPS its value is returned.
     *
     * 3. If name is available/whitelisted at this.element, return that value.
     *
     * 4. throw KeyError.
     *
     * If `name' is a registered parameter type, the return value's type is
     * the parameter type or an error will be thrown;
     * Otherwise, the return value may be anything that is accessible
     * or constructable from CPS formulae, or a white-listed value on
     * any reachable element.
     */
    _p._get = function(name) {
        var errors = [];
        if(name === 'this')
            return this.element;

        // Detect recursion on this.element
        if(name in this._getting.recursionDetection)
            throw new CPSRecursionError('Looking up "' + name
                            + '" is causing recursion in the element: '
                            + this.element.particulars);
        this._getting.recursionDetection[name] = true;
        this._getting.stack.push(this._getting.current);
        this._getting.current = name;
        try {
            return this.__get(name, errors);
        }
        catch(error) {
            if(!(error instanceof KeyError))
                throw error;
            errors.push(error.message);
            throw new KeyError(errors.join('\n----\n'));
        }
        finally {
            delete this._getting.recursionDetection[name];
            this._getting.current = this._gettingStack.pop();
        }
    };
    // FIXME: memoize seems to be slower, can we fix it?
    //_p.get = memoize('get', _p._get);
    _p.get = function(name) {
        // FIXME: remove this if everything behaves right
        // this error should never occur...
        if(this._invalidating)
            throw new Error('this is invalidating, so get is illegal');

        var val = this._cache[name];
        if(val === undefined)
            this._cache[name] = val = this._get(name);
        return val;
    };

    return StyleDict;
});
