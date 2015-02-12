define([
    'metapolator/errors'
  , 'metapolator/models/CPS/SelectorEngine'
  , 'metapolator/models/MOM/Multivers'
  , 'metapolator/models/MOM/Univers'
  , 'metapolator/models/CPS/elements/Rule'
  , 'metapolator/models/CPS/StyleDict'
  , 'metapolator/models/CPS/parsing/parseRules'
  , 'obtain/obtain'
], function(
    errors
  , SelectorEngine
  , Multivers
  , Univers
  , Rule
  , StyleDict
  , parseRules
  , obtain
) {
    "use strict";
    var CPSError = errors.CPS
      , KeyError = errors.Key
      ;

    function Controller(ruleController) {
        this._ruleController = ruleController;
        this.parameterRegistry = ruleController.parameterRegistry;
        // rule names of the masters
        this._masters = {};

        this._selectorEngine = new SelectorEngine();
        this._MOM = new Multivers(this);
        this._univers = new Univers();
        this._MOM.add(this._univers);

        this._styleDicts = Object.create(null);// element.nodeID: styleDict
        this._elementsForRule = Object.create(null); // {ruleName:[element.nodeIDs, ...];
    }

    var _p = Controller.prototype;

    /**
     * StyleDict constructor, can be changed by inheritance or
     * monkey patched on instances
     */
    _p.StyleDict = StyleDict;

    _p.updateChangedRule = function(async, sourceName) {
        return this._ruleController.reloadRule(async, sourceName);
    };

    _p.addMaster = function(master, sourceName) {
        this._masters[master.id] = sourceName;
        this._univers.add(master);
    }

    _p.hasMaster = function (master) {
        return master in this._masters;
    }

    _p._getMasterRule = function (master) {
        if(!(master in this._masters))
            throw new KeyError('Master "'+ master +'" not found in '
                                + Object.keys(this._masters).join(', '));
        return this._masters[master];
    }

    /**
     * returns a single StyleDict to read the final cascaded, computed
     * style for that element.
     */
    _p._getComputedStyle = function(element) {
        // FIXME: hard coding global.css is not good here, can this
        // be done configurable?
        var ruleName = element.master
                    ? this._getMasterRule(element.master.id)
                    : 'global.css'
          , parameterCollection = this._ruleController.getRule(false, ruleName)
          , rules = this._selectorEngine.getMatchingRules(
                                        parameterCollection.rules, element)
          ;
        if(!this._elementsForRule[ruleName]) {
            // subscribe only once, this saves calling us a lot of handlers
            // for each styledict
            // we are currently not unsubscribing...
            var subscriptionID = parameterCollection.on('structural-change', [this, 'updateRule'], ruleName);
            this._elementsForRule[ruleName] = [subscriptionID, []];
        }
        styleDict = new this.StyleDict(this, rules, element)
        this._styleDicts[element.nodeID] = styleDict;
        this._elementsForRule[ruleName][1].push(element.nodeID);
        return styleDict;
    }

    _p.getComputedStyle = function(element) {
        if(element.multivers !== this._MOM)
            throw new CPSError('getComputedStyle with an element that is not '
                + 'part of the multivers is not supported' + element);
        // this._styleDicts cache set in _getComputedStyle
        return this._styleDicts[element.nodeID] || this._getComputedStyle(element);
    }


    /**
     * Update each styleDict that uses the rule called `ruleName`
     */
    _p.updateRule(ruleName) {
        var ids = this._elementsForRule[ruleName][1]
          , parameterCollection, allRules, styleDict, rules
          ;
        if(!ids) return;
        parameterCollection = this._ruleController.getRule(false, ruleName);
        allRules = parameterCollection.rules;
        for(i=0,l=ids.length;i<l;i++) {
            styleDict = this._styleDicts[ ids[i] ];
            rules = this._selectorEngine.getMatchingRules(allRules, styleDict.element);
            styleDict.setRules(rules);
        }
    }

    _p._checkScope = function(_scope) {
        var i, scope;
        if(!_scope)
            return [this._MOM];
        scope = _scope instanceof Array
            ? _scope
            : [_scope]
            ;
        for(i=0;i<scope.length;i++)
            if(scope[i].multivers !== this._MOM)
                throw new CPSError('Query with a scope that is not '
                    +'part of the multivers is not supported '
                    + scope[i].particulars);
        return scope;
    }

    _p.queryAll = function(selector, scope) {
        var result = this._selectorEngine.queryAll(this._checkScope(scope), selector);
        // monkey patching the returned array.
        // it may become useful to invent an analogue to Web API NodeList
        result.query = this._selectorEngine.queryAll.bind(this._selectorEngine, result);
        return result;
    }

    _p.query = function(selector, scope) {
        return this._selectorEngine.query(this._checkScope(scope), selector);
    }

    return Controller;
})
