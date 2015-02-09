define([
    'metapolator/errors'
  , 'ufojs/main'
  , 'metapolator/models/MOM/_Node'
  , './whitelistProxies'
], function(
    errors
  , ufoJSUtils
  , _MOMNode
  , whitelistProxies
) {
    "use strict";

    var CPSError = errors.CPS
      , KeyError = errors.Key
      , isInt = ufoJSUtils.isInt
      , isIntString = ufoJSUtils.isIntString;

    /**
    * This is method is used by CPS Operators or the stack, to read
    * a key from *anything*
    *
    * Throws a KeyError when it fails.
    * The difference to whitelistGetter is that this method will look in
    * the styleDict of MOM-Nodes if item is a MOM-Node. Otherwise it uses
    * whitewlistGetter itself.
    */
    function genericGetter(item, name) {
        if(item instanceof _MOMNode){
            var cs = item.getComputedStyle(),
              , result = cs.get(name)
              // NOTE the this!!!
              ,
              ;
            if( the combination of (cs  name) is not yet in this._cacheDependencies[name] ) {
                var subscriberID = cs.onPropertyChange(name, [this, 'invalidateCache'])
                if(!this._cacheDependencies[name]) this._cacheDependencies[name] = [];
                this._cacheDependencies[name].push([cs, subscriberID]);
            }
            // END: just sketching ...
            return item.getComputedStyle().get(name);

        }
        return whitelistGetter(item, name);
    }

    /**
     *
     */
    function whitelistGetter(item, name) {
        var result;
        if(item === undefined){
            //pass
            throw new Error('trying to read "'+key+'" from an undefined item');
            // analogue to StyleDict.getAPI.genericGetter
            // used to be a
            // pass
            // is this happening at ALL?
            // in which case?
            // is that case legit?

        }
        else if(item.cps_proxy)
            result = item.cps_proxy[name]
        else if(item instanceof Array)
            result = whitelistProxies.array(item)[name];
        else
            throw new KeyError('Item "'+item+'" doesn\'t specify a whitelist for cps, trying to read '+name);

        // NOTE the this!!!
        // ALSO: this can only happen if item has the subscribe API
        if( the combination of (item  name) is not yet in this._cacheDependencies[name] ) {
            var subscriberID = item.onPropertyChange(name, [this, 'invalidateCache'])
            if(!this._cacheDependencies[name]) this._cacheDependencies[name] = [];
            this._cacheDependencies[name].push([item, subscriberID]);
        }
        return result

    }

    return {
        generic: genericGetter
      , whitelist: whitelistGetter
    };
});
