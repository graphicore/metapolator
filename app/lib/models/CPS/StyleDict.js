define([
    'metapolator/errors'
  , './cpsGetters'
  , 'metapolator/memoize'
], function(
    errors
  , cpsGetters
  , memoize
) {
    "use strict";

    var KeyError = errors.Key
      , CPSKeyError = errors.CPSKey
      , CPSRecursionError = errors.CPSRecursion
      , assert = errors.assert
      ;

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

        this._subscriptionUidCounter = 0;
        this._subscriptionUids = new WeakMap();
    }

    var _p = StyleDict.prototype;
    _p.constructor = StyleDict;

    _p._getSubscriptionUid = function(item, key) {
        var uid;
        if(item instanceof _MOMNode) {
            if(key instanceof SelectorList)
                return item.nodeID + 'S' + key;
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
                subscriberId = item.onSubtreeChange(key, [this, 'invalidateCacheHandler'], subscriptionUid);
            }
            else
                subscriberId = item.onPropertyChange(key, [this, 'invalidateCacheHandler'], subscriptionUid);
            dependencies = this._cacheSubscriptions[subscriptionUid]
                         = [item, key, subscriberId, Object.create(null), 0];
        }
        else if(current in dependencies[3])
            // that cache already subscribed to item.key
            return;
        dependencies[3][current] = true;//index
        dependencies[4] += 1;// counter

        if(!this._cacheDependencies[current])
            this._cacheDependencies[current] = [];
        this._cacheDependencies[current].push(subscriptionUid);
    };

    _p.invalidateCacheHandler = function(subscriptionUid) {
        assert(subscriptionUid in this._cacheSubscriptions, 'must be subscribed now');
        var dependencies = this._cacheSubscriptions[subscriptionUid][3], key;
        for(key in dependencies)
            this.invalidateCache(key);
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
            delete subscription[3][key];//index
            subscription[4] -= 1;//counter
            if(subscription[4])
                continue;
            // no deps left
            subscription[0].offPropertyChange(subscription[1], subscription[2]);
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
            keys = parameters.keys();
            for(j=0, ll=keys.length; j<ll; j++) {
                key = keys[j];
                if(!(key in this._dict))
                    this._setDictValue(parameters, key);
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
     * This doesn't include add/remove/change events of parameters/parameterDicts,
     * we'll handle that on another level.
     */
    _p.setRules = function(rules) {
        this._rules = rules;
        this._rebuildIndex();
    };

    _p._rebuildIndex = function() {
        var key, subscription;
        for(key in this._dict) {
            this._unsetDictValue(key);
            this._invalidateCache(key);
        }
        this._buildIndex();
    };

    _p._setDictValue = function(parameters, key) {
        assert(!(key in this._dictDependencies), 'there may be no dependency yet!');
        var subscription = this._dictDependencies[key] = [];
        subscription[0] = parameters;
        subscription[1] = parameters.onPropertyChange(key, [this, 'updateDictEntry'], key);
        this._dict[key] = parameters.get(key);
    };

    _p._unsetDictValue = function(key) {
        var subscription = this._dictDependencies[key];
        subscription[0].offPropertyChange(key, subscription[1]);
        delete this._dict[key];
        delete this._dictDependencies[key];
    };

    _p.updateDictEntry = function(key) {
        // remake the this._dict entry for name
        var i, l, parameters;
        this._unsetDictValue(key);
        this.invalidateCache(key);
        for(i=0,l=this._rules.length;i<l;i++) {
            parameters = this._rules[i].parameters;
            if(!parameters.has(key))
                continue;
            this._setDictValue(parameters, key);
            break;
        }
    };

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
            assert(!this._dependants[key] || !this._dependants[key].length
                , 'Because the key is not cached, there must not be any dependency or dependant');
            return;
        }
        delete this._cache[key];
        this._unsubscribeFromAll(key);
        this._triggerPropertyChange(key);
        this._invalidating = false;
    };

    _p._triggerPropertyChange = function(key) {
        var dependants = this._dependants[key]
          , callback
          , data
          ;
        if(!dependants || !dependants.length) {
            // this is rather no error!?
            console.warn(key + ' was cached but has no dependants/subscribers');
            console.trace();
            return;
        }
        for(i=dependants.length-1;i>=0;i--) {
            if(!dependants[i])
                continue;
            callback = dependants[i][0];
            data = dependants[i][1];
            // callback may be undefined because of offPropertyChange
            if(callback instanceof Function)
                callback(data);
            else if(callback instanceof Array)
                // callback = [object, 'methodName']
                // this is done to avoid to many new bound functions
                callback[0][callback[1]](data);
            // can be removed when everything works
            // this checks if the depandant does invalidate itself propperly
            assert(!(i in dependants), 'dependant should have used offPropertyChange');
        }
        delete this._dependants[key];
    };

    // a dependency on cache would subscribe to this for a key
    // TODO: find  a new name
    //            onDependencyInvalidation(key, callback)
    // the subscription will be undone after being called once
    _p.onPropertyChange = function(key, callback, data) {
        var dependants = this._dependants[key]
          , subscriberID
          ;
        if(!dependants)
            dependants = this._dependants[key] = [];
        subscriberID = dependants.length;
        dependants.push([callback, data]);
        return subscriberID;
    };

    // TODO: with a globally unique subscriberID we may get rid of key, here
    _p.offPropertyChange = function(key, subscriberID) {
        var dependants = this._dependants[key];
        if(!dependants || !dependants[subscriberID]) {
            // FIXME: isnt it an error when somone wishes to unsubscribe,
            // but there is no description???
            // seems like the  !dependants[subscriberID] case happens when
            // invalidateCache is calling the subscribers. Then it pop off
            // the callbacks from dependants and calls their callback === their invalidateCache
            // method. first thing they do is trying to unsubscribe from their caller ...
            // we could allow this to happen or think about how this could
            // be prevented (to produce a better definition of what should happen)
            throw new Error('unsubscription without subscription, this shouldn\'t happen, I think');
            //return;
        }
        // don't use splice, it would change the indexes and thus
        // invalidate the other subscriberIDs
        delete dependants[subscriberID];
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
