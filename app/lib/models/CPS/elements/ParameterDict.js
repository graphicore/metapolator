define([
    'metapolator/errors'
  , './_Node'
  , './GenericCPSNode'
  , './Parameter'
], function(
    errors
  , Parent
  , GenericCPSNode
  , Parameter
) {
    "use strict";

    // TODO:
    // Make this an ordered dict. Ordered to keep the comments where
    // they belong. Dict for access to the Parameters themselves!
    // There is the possibility to declare two parameters of the same
    // name. We merge multiply defined Parameter like so:
    // the last one wins, the other previous ones are not available via
    // keys, the index interface would work.
    // If this is not fancy enough we can still think of another approach.

    /**
     * A dictionary of parameters and a list of parameters, comments and
     * GenericCPSNodes
     */

    function ParameterDict(items, source, lineNo) {
        Parent.call(this, source, lineNo);
        this._items = items.slice();
        this._dict = undefined;
        this._keys = undefined;
        this._indexes = Object.create(null);
    }

    var _p = ParameterDict.prototype = Object.create(Parent.prototype)
    _p.constructor = ParameterDict;

    _p.toString = function() {
        var prepared = this._items.map(function(item) {
            if(item instanceof GenericCPSNode)
                return ['    ', item, ';'].join('')
            return '    ' + item;
        })

        prepared.unshift('{');
        prepared.push('}');
        return prepared.join('\n');
    };


    function _filterParameters(item) {
        return (item instanceof Parameter && !item.invalid);
    }

    Object.defineProperty(_p, 'items', {
        get: function() {
            var _items = this._items, items = [], i, l, item;
            for(i=0,l=this._items.length;i<l;i++)
                if(_filterParameters(item = _items[i]))
                    items.push(item);
            return items;
        }
    });

    _p._getAllItems = function() {
        return this._items.slice();
    };

    // FIXME: maybe this should be deprecated, it's expensive
    // also, this.items could be cached, maybe
    Object.defineProperty(_p, 'length', {
        get: function(){ return this.items.length; }
    });

    _p._buildIndex = function() {
        var items = this._items
          , item
          , i=items.length-1
          , key, dict, keys
          ;
        this._dict = dict = Object.create(null);
        this._keys = keys = [];
        // searching backwards, because the last item with key === name has
        // the highest precedence
        for(;i>=0;i--) {
            key = item.name;

            if(!this._indexes[key]) this._indexes[key] = [];
            this._indexes[key].push(i);

            if(!_filterParameters(item = items[i]))
                continue;
            if(!(key in dict)) {
                dict[key] = i;
                keys.push(key);
            }
        }
    };

    // FIXME: for an api it would be easier to neglegt the inner data-structure
    // and just make it possible to work with the currently active entries
    // maybe we can implement that and then another set of calls that makes
    // the items array accessible

    // overide the active item or create new entry
    // This Fails if item is invalid
    // There is no good reason for an api that sets invalid values

    // FIXME: can I do with these methods all I want to do??? how would I
    // reorder to active keys to make the shadowed key the active one?
    // do I want to do this?
    // do I want to allow this?
    // The reason for having shadowed keys is rather in reporducing input
    // CPS than in a way that I want an application to author CPS.
    _p.setParameter(item) = function {
        var name = item.name
          , items = this._items
          , index
          ;
        if(!_filterParameters(parameter))
            // FIXME return [false, message] || thow InvalidError(message)?
            return;
        if(!this.has(name)) {
            // Todo: add event
            index = items.length;
            items.push(name);
            if(!this._indexes[name])
                this._indexes[name] = [];
            this._indexes[name].push(index);
            this._keys.push(name);
        }
        else {
            // Todo: change event
            index = this._dict[name];
            items[index] = parameter;
        }
        this._dict[name] = index;
        // emit event
    }

    // remove all items with key as name
    _p.erase(key) {
        var count = 0, indexes, i
          , items = this._items
          ;
        if(!this.has(key))
            return 0;
        indexes = this._indexes[key])
        this._indexes[key] = [];
        indexes.sort();// lowest index is first.
        for(i=count=indexes.length-1;i>=0;i--)
            items.splice(i, 1);
        delete this._dict[key];
        this._keys = Object.keys();
    }

    // delete the currently active item for key, if there is a active item
    _p.removeCurrentActiveParameter = function(key) {
        // return number of removed items
        // FIXME: maybe if there is an active key left is also interesting
        var count = 0, indexes, index, i
          , items = this._items
          , keys
          ;
        if(!this.has(key))
            return;
        // delete the currently active item for key
        count = 1;
        index = this._dict[key];
        items.splice(index, 1);
        delete this._dict[key];
        indexes = this._indexes[key];
        indexes.sort();
        for(i=indexes.length;i>=0;i--) {
            if(indexes[i] === index)
                // the old active key must come first in this iteration
                // because the highest valid index is the active item
                indexes.splice(i, 1);
            else if(_filterParameters(items[indexes[i]])) {
                // this changed the active value
                this._dict[key] = indexes[i];
                break;
            }
        }
        if(!(key in this._dict)) {
            this._keys = Object.keys(this._dict);
            // delete event!
        }
        else {
             // change event!
            "";
        }
        return count;
    }


    _p.appendParameter(value) = function {}
    _p.insertParameter(index, value) = function {}
    // if there is no "name" => append
    _p.replaceParameter(name, value) = function {}
    // TODO: listen for parameter changes
    // emmit events accordingly


    _p.keys = function() {
        if(!this._keys)
            this._buildIndex();
        return this._keys;
    };

    _p.get = function(key) {
        if(!this._dict)
            this._buildIndex();
        if(!(key in this._dict))
            throw new errors.Key('Key "'+key+'" not in ParameterDict');
        return this.itemValue(this._dict[key]);
    };

    _p.has = function(key) {
        if(!this._dict)
            this._buildIndex();
        return key in this._dict;
    };

    _p.find = function(key) {
        if(!this._dict)
            this._buildIndex();
        return this._indexes[key] || [];
        //var items = this.items
        //  , i = 0
        //  , indexes = []
        //  ;
        //for(;i<items.length;i++) {
        //    if(key === items[i].name);
        //        indexes.push(i);
        //}
        //return indexes;
    };

    _p.itemValue = function(index) {
        return this._items[index].value;
    };

    return ParameterDict;
});
