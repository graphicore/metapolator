define([
], function(
) {
    "use strict";

    /**
     * This is made for use in directives
     *
     * I prefer to have this boilerplate interaction with the browser
     * in the directive, so the controller can be more pure application
     * logic.
     */
    function handlerDecorator(scope, fn, prevenPropagation, apply) {
        return function(event) {
            var result;
            if(prevenPropagation)
                // don't bubble upwards to parent elements
                event.stopPropagation();
            if(fn)
                // execute the callback
                result = fn.call(this, event);
            if(apply)
                scope.$apply();
            // usually undefined
            return result;
        };
    }

    function stopPropagation(event) {
        // don't let it bubble up to the RuleController/parent element
        event.stopPropagation();
    }

    function Timer(onTimeoutFunction, time) {
        var timeout = null;
        function cancel() {
            clearTimeout(timeout);
            timeout = null;
        }
        function timedOut() {
            timeout = null;
            onTimeoutFunction();
        }
        function start() {
            clearTimeout(timeout);
            timeout = setTimeout(timedOut, time);
        }
        Object.defineProperties(this, {
            cancel: {
                value: cancel
              , enumerable: true
            }
          , start: {
                value: start
              , enumerable: true
            }
        });
    }

    /**
     * This is used to adjust sizes of <textarea> elements as you type
     */
    function calculateTextBoxSize(value) {
        var lines = value.split('\n')
          , cols = 0, i, l
          , $scope = this.$scope
          ;
        for(i=0,l=lines.length;i<l;i++)
            if(lines[i].length > cols)
                cols = lines[i].length;

        return [cols, lines.length];
    };

    function hasFocus(element) {
        var document = element.ownerDocument;
        return (element === document.activeElement
                && (!document.hasFocus || document.hasFocus()));
    }

    return {
        handlerDecorator: handlerDecorator
      , stopPropagation: stopPropagation
      , Timer: Timer
      , calculateTextBoxSize: calculateTextBoxSize
      , hasFocus: hasFocus
    };
});
