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
        this.getAPI = function(name){ return self.get(name);};
        Object.define(this, 'element', {
            value: element
          , enumerable: true
        });
        this._controller = controller;
        this._getting = {};

        this._rules = rules;
        this._dict = null;
        this._cache = Object.create(null);
    }

    var _p = StyleDict.prototype;
    _p.constructor = StyleDict;

    _p._buildIndex = function() {
        var i, l, j, ll, keys, key, parameters;
        this._dict = Object.create(null);
        for(i=0,l=this._rules.length;i<l;i++) {
            parameters = this._rules[i].parameters;
            keys = parameters.keys();
            for(j=0, ll=keys.length; j<ll; j++) {
                key = keys[j];
                if(!(key in this._dict)) {
                    this._dict[key] = parameters.get(key);
                    // NOTE: uncommon subscription signature!
                    // maybe "on" is a missleading interface name
                    // also, the last [key] should mabe rather be
                    // automatically transported by the event?
                    // the subscription will be undone after beeing called
                    // once
                    // ¿should this return a subscriberID as well?
                    // == in updateDictEntry we'd probably unsubscribe
                    // from the key, but there should be only one
                    // subscription for a _dict key at any time ...
                    // we could count the subscriptions made +
                    // and updateDictEntry called with -
                    // at any time the number should be 0 or 1
                    // probably this will behave fine
                    parameters.onPropertyChange(key, [this, 'updateDictEntry']);
                }
            }
        }
    };

    _p.updateDictEntry = function(key) {
        // remake the this._dict entry for name
        var i, l, parameters, found = false;
        for(i=0,l=this._rules.length;i<l;i++) {
            parameters = this._rules[i].parameters;
            if(!parameters.has(key))
                continue;
            this._dict[key] = this._rules[i].parameters.get(key);
            parameters.onPropertyChange(key, [this, 'updateDictEntry']);
            found = true;
            break;
        }
        if(!found)
            delete this._dict[key];

        this.invalidateCache(key);
    };

    /**
     *  if name is in cache, invalidate the cache and inform all subscribers/dependants
     */
    _p.invalidateCache = function(key) {
        // FIXME: _p.get should not be called while this is running!
        // remove this check if everything behaves right.
        this._invalidating = true;

        var subscribers, callback;
        if(!(key in this._cache)){
            // Because the key is not cached, ther must not be any dependenciy or dependant
            // assert !this._cacheDependencies[key] || !this._cacheDependencies[key].length
            // assert !this._dependants[key] || !this._dependants[key].length
            return;
        }
        delete this._cache[key];


        // function: => unsubscribe from dependencies
        // we have probably collected dependencies for this cache, since
        // the cache is now invalidated, the dependencies can be unsubscribed
        var cacheDependencies = this._cacheDependencies[key], cacheDependeny;
        if(cacheDependencies)
            while(dependeny = cacheDependencies.pop())
                dependeny[0].unsubscribePropertyChange(dependeny[1]);


        dependants = this._dependants[key];
         // we could also not reset the array, since we do:
         // delete this._dependants[key][i]
         // the the subscriberID may overflow at some point in time ...
         // but we would allocate new arrays all th time
         // alternativeley a while(array.length) array.pop() could empty the array
        this._dependants[key] = [];
        if(!dependants || !dependants.length) {
            // maybe this is no error?
            console.warn(key + ' is cached but has no dependants/subscribers');
            console.trace();
            return;
        }
        // some dependants may have multiple subscriptions on this and
        // thus may _p.unsubscribe themselves while this is running ...
        //           HOW?
        // TODO: implement that other part ... subscribin *sweat*
        // NOTE!!! the depandant, in this current implementation unsubscribes
        // itself by calling: unsubscribePropertyChange // see above
        // this A) kills the subscriberID === Index idea with using
        // pop in here OR with using splice(subscriberID, 1) in there...
        // what to do?
        // maybe, if we don't pop, we could test after each call
        // to callback if the dependant did unsubscribe itself???
        // if, after the callback (i in dependants)
        // then something went wrong
        for(i=dependants.length-1;i>=0;i--) {
            callback = dependants[i];
            // callback may be null // from unsubscribePropertyChange
            if(callback instanceof Function)
                callback(key);
            else if(callback instanceof Array)
                // callback = [object, 'methodName']
                // this is done to avoid to many new bound functions
                callback[0][callback[1]](key);
            // can be removed when everything works
            // this checks rather if the depandant does invalidate itself propperly
            assert(!(i in dependants), 'dependant should have used unsubscribePropertyChange');
            // I'd prefer emptying over replacing => less garbage collection needed
            // dependants.pop();
        }
        // can be removed when everything works
        assert(this._dependants[key].length === 0; 'we did just clear it, check who subscribed in the meantime.')
        this._invalidating = false;
    };

    // a dependency on cache would subscribe to this for a key
    // TODO: find  a new name
    //            onDependencyInvalidation(key, callback)
    // the subscription will be undone after being called once
    _p.onPropertyChange = function(key, callback) {
        var dependants = this._dependants[key]
          , subscriberID// <== make this globally unique for the runtime? would be harder to unsubscribe accidentially
          ;
        if(!dependants)
            dependants = this._dependants[key] = [];
        subscriberID = dependants.length;
        dependants.push(callback);
        return subscriberID;
    };

    // TODO: with a globally unique subscriberID we may get rid of key, here
    _p.unsubscribePropertyChange = function(key, subscriberID) {
        var dependants = this._dependants[key];
        if(!dependants || !dependants[subscriberID]){
            // FIXME: isnt it an error when somine wishes to unsubscribe,
            // but there is no description???
            // seems like the  !dependants[subscriberID] case happens when
            // invalidateCache is calling the subscribers. Then it pop off
            // the callbacks from dependants and calls their callback === their invalidateCache
            // method. first thing they do is trying to unsubscribe from their caller ...
            // we could allow this to happen or think about how this could
            // be prevented (to produce a better definition of what should happen)
            throw new Error('unsubscription without subscription, this shouldn\'t happen, I think');
            return;
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
        var param = this._getParameter(name);
        if(param)
           return param.getValue();
        errors.push(name + ' not found for ' + this.element.particulars);

        // TODO: subscribe to this.element
        // FIXME: just sketching ...
        var result = cpsGetters.whitelist(this.element, name);
        // so something like the following must happen in the formulae
        // language??? (or maybe in the cpsGetters module...)
        // FIXME: note the onPropertyChange api is the same as implemented here in StyleDict
        if( the combination of (this.element  name) is not yet in this._cacheDependencies[name] ) {
            var subscriberID = this.element.onPropertyChange(name, [this, 'invalidateCache']);
            if(!this._cacheDependencies[name]) this._dependencies[name] = [];
            this._cacheDependencies[name].push([this.element, subscriberID]);
        }
        // END: just sketching ...

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
        if(name in this._getting)
            throw new CPSRecursionError('Looking up "' + name
                            + '" is causing recursion in the element: '
                            + this.element.particulars);
        this._getting[name] = true;
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
            delete this._getting[name];
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
        console.log('Styledict.setRules of ', this.element.particulars, 'needs moar implementation');
        this._rules = rules;
        // => unsubscribe all _dict dependencies => parameters/parameter dicts or so!
        if(this._dict)
            Object.keys(this._dict).map(this._unsubscribe, this);
        // => unsubscribe all _cache dependencies => other styledicts or MOM elements etc.
        Object.keys(this._cache).map(this._unsubscribe, this);
        this._dict = null;
        this._cache = Object.create(null);
    };

    return StyleDict;
});
