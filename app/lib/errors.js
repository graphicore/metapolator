define(function() {
    "use strict";
    //metapolator errors
    var errors = {};

    /**
     * save three lines of coding for each error with this factory
     *
     * and observe that extending Error is uncool
     */
    var makeError = function(name, Constructor, prototype, namespace)
    {
        if(prototype === undefined)
            prototype = new Error();

        if(Constructor === undefined) {
            Constructor = function(message, stack) {
                if(message !== undefined) {
                    this.name = name + 'Error';
                    this.message = message || "(no error message)";
                }

                if(!stack && typeof Error.captureStackTrace === 'function')
                    Error.captureStackTrace(this, Constructor);
                else {
                    stack = stack || (new Error()).stack || '(no stack available)';
                    this.stack = [this.name+': ', this.message, '\n'
                                                    , stack].join('');
                }
            };
        }
        Constructor.prototype = prototype;
        Constructor.prototype.constructor = Constructor;
        if(namespace === undefined)
            namespace = errors;
        namespace[name] = Constructor;
    };
    errors.makeError = makeError;
    /**
     * the definitions go here
     */
    makeError('Error');
    makeError('Unhandled');
    makeError('Assertion', undefined , new errors.Error());
    makeError('CommandLine', undefined , new errors.Error());
    makeError('Value', undefined , new RangeError());
    makeError('MOM', undefined , new errors.Error());
    makeError('NotImplemented', undefined , new errors.Error());
    makeError('Deprecated', undefined , new errors.Error());
    makeError('AbstractInterface', undefined , new errors.Error());
    makeError('CPS', undefined , new errors.Error());
    makeError('Key', undefined , new errors.Error());
    makeError('CPSRegistryKey', undefined , new errors.Key());
    makeError('CPSKey', undefined , new errors.Key());
    makeError('CPSRecursion', undefined , new errors.CPS());
    makeError('CPSFormula', undefined , new errors.CPS());
    // deprecated, CPSFormula superseeds this
    makeError('CPSAlgebra', undefined , new errors.CPSFormula());
    makeError('Project', undefined , new errors.CPS());
    makeError('PointPen', undefined , new errors.CPS());
    makeError('CPSParser', undefined , new errors.CPS());
    makeError('Import', undefined , new errors.CPS());
    makeError('ImportPenstroke', undefined , new errors.Import());
    makeError('ImportContour', undefined , new errors.Import());
    makeError('Event', undefined , new errors.Error());
    makeError('Emitter', undefined , new errors.Event());
    makeError('Receiver', undefined , new errors.Event());

    /**
     * if expression is false, throw an Assertion
     * pass a message to explain yourself
     **/
    errors.assert = function(exp, message) {
        if (!exp) {
            throw new errors.Assertion(message);
        }
    };
    errors.warn = function(message) {
        if(typeof console !== 'undefined' && console.warn)
            console.warn('WARNING: ' + message);
    };

    /**
     * ES6/Promises have the fundamental flaw, that, if there is no
     * Error handler attached, an unhandled error stays unnoticed and
     * just disappears.
     * Because handling all Errors always correctly is not possible at
     * any given time e.g. a program may still be under construction for
     * example, this is a default handler to mark a promise as unhandled.
     *
     * Using this error-handler at the very end of the promise chain
     * ensures that the unhandled Proxy exception is not just disappearing
     * unnoticed by the main program.
     */
    function unhandledPromise(originalError) {
        var error = new errors.Unhandled(originalError+'\n'+originalError.stack);
        error.originalError = originalError;
        // use setTimout to escape the catch all that es6/Promise applies
        // and that silences unhandled errors
        setTimeout(function unhandledError(){throw error;}, 0);
    }
    errors.unhandledPromise = unhandledPromise;

    return errors;
});
