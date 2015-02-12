define([
    '../../_BaseModel'
  , 'metapolator/models/emitterMixin'
], function(
    Parent
  , emitterMixin
) {
    "use strict";

    var _emitterSetup = {
        // make trigger private
        triggerAPI: '_trigger'
    }

    /**
     * All Elements in a ParametersCollection have this base type OR
     * should at least expose the same Interface (ducktyping).
     */
    function _Node(source, lineNo) {
        Parent.call(this)
        this._source = source;
        this._lineNo = lineNo;
        emitterMixin.init(this, _emitterSetup);
    }
    var _p = _Node.prototype = Object.create(Parent.prototype)
    _p.constructor = _Node;

    emitterMixin(_p)

    _p.toString = function() {
        throw new AbstractInterfaceError('This interface is abstract and'
            + 'needs an implementation (parameters/_Node.toString)');
    }

    /**
     * Trigger the destroy event and let the _Node clean up if needed.
     * When destroy is called, this _Node is probably alredy removed from
     * its hosting structure.
     *
     * Only the parent of this _Node may call destroy, when the node is
     * deleted. So don't use it anywhere else!
     * We will probably not have all nodes using this method, it depends
     * on the context.
     */
    _p.destroy = function(data) {
        this._trigger('destroy', data);
    }

    function _getterCreator(item) {
        var external = item[0]
          , internal = item[1]
          ;
        Object.defineProperty(this, external, {
            get: function(){ return this[internal]; }
        })
    };
    ([
        ['source', '_source']
      , ['lineNo', '_lineNo']
    ].forEach(_getterCreator, _p));

    return _Node;
})
