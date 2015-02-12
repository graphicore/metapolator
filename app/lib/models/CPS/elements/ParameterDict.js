define([
    'metapolator/errors'
  , 'metapolator/models/emitterMixin'
  , './_Node'
  , './GenericCPSNode'
  , './Parameter'
], function(
    errors
  , emitterMixin
  , Parent
  , GenericCPSNode
  , Parameter
) {
    "use strict";

    var ValueError = errors.Value
      , KeyError = errors.Key
      , propertyChangeEmitterSetup
      ;

    // TODO:
    // Make this an ordered dict. Ordered to keep the comments where
    // they belong. Dict for access to the Parameters themselves!
    // There is the possibility to declare two parameters of the same
    // name. We merge multiply defined Parameter like so:
    // the last one wins, the other previous ones are not available via
    // keys, the index interface would work.
    // If this is not fancy enough we can still think of another approach.

    propertyChangeEmitterSetup = {
          stateProperty: '_propertyChannels'
        , onAPI: 'onPropertyChange'
        , offAPI: 'offPropertyChange'
        , triggerAPI: '_triggerPropertyChange'
    };

    /**
     * A dictionary of parameters and a list of parameters, comments and
     * GenericCPSNodes
     *
     * channels for the on/off interface:
     *
     * "add" data: key
     *      A new active property was added.
     * "change" data: key
     *      An active property was changed, there is a new value at key.
     * "delete" data: key
     *      There used to be an active property for key, but there is
     *      no active property for key anymore.
     * "erase" data:key
     *      All active, inactive and invalid properties for key have been
     *      removed. This is preceded by "delete" if there used to be
     *      an active property for key. See "delete"
     *
     * Channels named after the active key/property-names are available
     * via the onPropertyChange/offPropertyChange interface.
     * They fire on "add", "delete", "change" for the respective key.
     */

    function ParameterDict(items, source, lineNo) {
        Parent.call(this, source, lineNo);
        this._items = items.slice();
        this._dict = undefined;
        this._keys = undefined;
        this._indexes = undefined;
        emitterMixin.init(this, propertyChangeEmitterSetup);
    }

    var _p = ParameterDict.prototype = Object.create(Parent.prototype)
    _p.constructor = ParameterDict;

    emitterMixin(_p, propertyChangeEmitterSetup);

    _p.toString = function() {
        var prepared = this._items.map(function(item) {
            if(!item)
                return ''
            if(item instanceof GenericCPSNode)
                return ['    ', item, ';'].join('')
            return '    ' + item;
        });

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

    // FIXME: maybe this should be deprecated, it's expensive
    // also, this.items could be cached, maybe
    Object.defineProperty(_p, 'length', {
        get: function(){ return this.items.length; }
    });

    _p._buildIndex = function() {
        var items = this._items
          , item
          , i, key, dict, keys, indexes
          ;
        this._dict = dict = Object.create(null);
        this._keys = keys = [];
        this._indexes = indexes = Object.create(null);
        // searching backwards, because the last item with key === name has
        // the highest precedence
        for(i=items.length-1;i>=0;i--) {
            key = item.name;

            if(!indexes[key]) indexes[key] = [];
            indexes[key].push(i);

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
    // There will be probably one API for a dict like access and another
    // one for array access.

    /**
     * overide the active item or create new entry
     */
    _p.setParameter(item) = function {
        var key = item.name
          , items = this._items
          , index
          , event
          , old
          ;
        if(!_filterParameters(item))
            throw new ValueError('Trying to set an invalid property: ' + item);
        if(!this.has(key)) {
            event = 'add';
            index = items.length;
            items.push(key);
            if(!this._indexes[key])
                this._indexes[key] = [];
            this._indexes[key].push(index);
            this._keys.push(key);
        }
        else {
            event = 'change';
            index = this._dict[key];
            old = items[index]
            items[index] = parameter;
        }
        this._dict[key] = index;
        // emit events
        if(old) old.destroy();
        this._trigger(event, key);
        this._triggerPropertyChange(key, event);
    }

    // remove all items with key as name
    // return number of removed items
    _p.erase(key) {
        var count = 0, indexes, i
          , items = this._items
          , removed
          , event
          , deleteEvent = false
          ;
        if(!this._indexes)
            this._buildIndex();
        indexes = this._indexes[key];
        if(!indexes)
            return 0;
        removed = [];
        count = indexes.length;
        delete this._indexes[key];
        for(i=0;i<count;i++) {
            // returns an array with the deleted elements
            // since we delete always only one item [0].destroy(); is good
            removed.push(items[indexes[i]]);
            delete items[indexes[i]];
        }
        if(key in this._dict) {
            // if key was active, this is also a delete event.
            deleteEvent = true;
            delete this._dict[key];
            event = ['delete', 'erase'];
        }
        else
            event = 'erase';
        this._keys = Object.keys(this._dic);

        for(i=0;i<count;i++)
            removed[i].destroy();
        this._trigger(event, key)
        if(deleteEvent)
            this._triggerPropertyChange(key, 'delete');
        return count;
    }

    // delete the currently active item for key, if there is an active item
    _p.removeCurrentActiveParameter = function(key) {
        // return number of removed items
        // FIXME: maybe if there is an active key left is also interesting
        var indexes, index, i
          , items = this._items
          , old
          , keys
          , event
          ;
        if(!this.has(key))
            return 0;
        // delete the currently active item for key
        index = this._dict[key];
        old = items[index];
        delete items[index];
        delete this._dict[key];
        indexes = this._indexes[key];
        indexes.sort();
        for(i=indexes.length;i>=0;i--) {
            if(indexes[i] === index) {
                // the old active key must come first in this iteration
                // because the highest valid index is the active item
                indexes.splice(i, 1);
            }
            else if(_filterParameters(items[indexes[i]])) {
                // this changed the active value
                this._dict[key] = indexes[i];
                break;
            }
        }
        old.destroy();
        if(!(key in this._dict)) {
            // no follow up was found
            // delete event!
            event = 'delete';
            this._keys = Object.keys(this._dict);
        }
        else
            // there is a successor, change event!
            event = 'change';
        this._trigger(event, key);
        this._triggerPropertyChange(key, event);
        return 1;
    }

    _p.keys = function() {
        if(!this._keys)
            this._buildIndex();
        return this._keys;
    };

    _p.get = function(key) {
        if(!this._dict)
            this._buildIndex();
        if(!(key in this._dict))
            throw new KeyError('Key "'+key+'" not in ParameterDict.');
        return this.getItemValue(this._dict[key]);
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

    _p.getItemValue = function(index) {
        return this._items[index].value;
    };

    return ParameterDict;
});
