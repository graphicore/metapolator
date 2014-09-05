define([
    'metapolator/errors'
  , './parsing/Parser'
  , './parsing/OperatorToken'
], function(
    errors
  , Parser
  , Operator
) {
    "use strict";

    var ValueError = errors.Value
      , CPSFormulaError = errors.CPSFormula
      ;

    var _i_=0;
    function stub(getAPI) {
        /*jshint validthis:true */
        // 'this' is the OperatorToken instance
        var joiner = '\n  -';
        console.log('stub of '
            + this
            + ' args:'
            + joiner + Array.prototype.slice.call(arguments, 1).join(joiner)
        );
        return '__result ' + ( _i_++ ) + '__';
    }

    var engine = new Parser(
        // /**
        //  * Returns the host MOM Element, should be executed before
        //  * beeing consumed => highest precedence
        //  * could also be just a name, StyldeDict would have to know what
        //  * to do.
        //  */
        // new Operator('this', false, Infinity, 0, 0, stub)
        /**
         *  returns an Array
         */
        new Operator('list', false, -Infinity, 0, Infinity, stub)
        /**
         * Returns a generic Value, could be virtually anything
         *
         * used in a context like this
         * item['key']
         * which is translated to
         * item __get__ 'key'
         *
         * which should translate roughly to the javascript:
         * item['key'] or item.get('key'), depending of the nature
         * of item and the details of the implementation
         */
      , new Operator('__get__', false, Infinity, 1, 1, stub)
        /**
         * Returns a generic Value, could be virtually anything
         * similar to __get__
         *
         * used like this:
         * item.name
         *
         * name must be a name token, its value is used to get a propety
         * of item.
         * in javascript it does roughly the following:
         * var key = name.getValue()
         * return item[key]
         */
      , new Operator('.', true, Infinity, 1, 1, stub)
        /**
         * When a value is negated using the minus sign, this operator is
         * inserted instead of the minus sign. It can also be used directly.
         *
         * The parser should detect cases where the minus sign is not a
         * subtraction, but a negation:
         *
         * -5 => negate 5
         * -(5 + name) => negate (5 + name)
         * 5 + -name => 5 + negate name
         * 5 + - name => 5 + negate name
         * name * - 5 => name * negate name
         *
         */
      , new Operator('negate', false, 6, 0, 1, stub)
        /**
         * add
         */
      , new Operator('+', true, 1, 1, 1, stub)
        /**
         * subtract
         */
      , new Operator('-', true, 1, 1, 1, stub)
        /**
         * multiply
         */
      , new Operator('*', true, 2, 1, 1, stub)
        /**
         * divide
         */
      , new Operator('/', true, 2, 1, 1, stub)
        /**
         * pow
         */
      , new Operator('^', true, 3, 1, 1, stub)
        /**
         * vector constructor operator
         * Creates a vector from cartesian coordinates
         * Consumes two numbers returns a Vector
         */
      , new Operator('vector', false, 4, 0, 2, stub)
        /**
         * vector constructor operator
         * Creates a vector from polar coordinates => magnitude angle in radians
         * Consumes two numbers returns a Vector
         */
      , new Operator('polar', false, 4, 0, 2, stub)
        /**
         * Convert a number from degree to radians
         * This has higher precedence than "polar" because it makes writing:
         * "polar 100 deg 45" possible.
         */
      , new Operator('deg', false, 5, 0, 1, stub)
        /**
         * Print information about the input value to console.log
         * and return the value again.
         * This doesn't change the result of the calculation.
         */
      , new Operator('_print', false, Infinity, 0, 1, stub)
        /**
         * Specify and apply an affine transformation scaling on a vector
         * Returns a new vector.
         * usage: scale xval yval <vector>
         * where xval and yval are numbers
         *
         * TODO: affine transformations could be values similar to vectors,
         * at least the + operator would make totally sense. Keep this in
         * mind if applying the same transformations over and over becomes
         * cumbersome. This would make it possible to store a transformation
         * itself in an @dictionary for example
         */
      , new Operator('scale', false, 0, 0, 3, stub)
    );

    engine.setBracketOperator('[', '__get__');


    // usage: engine.parse(CPSParameterValueString)
    return engine;
});
