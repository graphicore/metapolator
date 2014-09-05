define([
    'metapolator/errors'
], function(
    errors
) {
    "use strict";

    var CPSFormulaError = errors.CPSFormula;

    function Stack(postfixStack) {
        // raises CPSFormulaError
        this._check(postfixStack);
        this._stack = postfixStack;

    }

    var _p = Stack.prototype;
    _p.toString = function() {
        return this._stack.join('|')
    }

    Object.defineProperty(_p, 'items', {
        get: function(){ return this._stack.slice() }
    });

    _p._check = function(stack) {
        var stackLen = 0;
        for(var i=0; i<stack.length;i++) {
            stackLen -= stack[i].consumes;
            if(stackLen < 0)
                throw new CPSFormulaError('Stack underflow at ('+i+') a '
                    + stack[i] + ' in ' + stack.join('|') + '. '
                    + 'This means an operator consumes more items than '
                    + 'there are on the stack.');
            stackLen += stack[i].ejects;
        }
        if(stackLen > 1)
            throw new CPSFormulaError('Stack to crowded. A stack must '
                        +'eventually resolve to 1 item, the result. This '
                        +'stack has still ' + stackLen + ' items: '
                        + stack.join('|'));
    }

    _p.execute = function() {
        var commands = this._stack.slice()
          , stack = []
          , i = 0
          ;
        for(;i<commands.length;i++) {
            if(commands[i] instanceof Value)
                stack.push(commands[i]);
            else {
                stack.push(
                    commands[i].execute.apply(commands[i],
                                stack.splice(-commands[i].consumes))
                );
            }
        }
        return stack.pop();
    }

    return Stack;
}
