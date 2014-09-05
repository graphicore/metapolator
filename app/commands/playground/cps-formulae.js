define([
    'metapolator/errors'
  , 'gonzales/gonzales'
  , 'metapolator/cli/ArgumentParser'
  , 'metapolator/models/CPS/dataTypes/formulae/formulaEngine'
], function (
    errors
  , gonzales
  , ArgumentParser
  , engine
) {
    "use strict";
    var CommandLineError = errors.CommandLine
      , argumentParser = new ArgumentParser('cps-algebra')
      , module
      ;
    argumentParser.addArgument(
        'formula'
      , 'insert a formula, best use single quote quotation marks for '
        + 'shell escaping, double quores are used within formulae.'
      , function(args) {
            var path = args.pop();
            if(path === undefined)
                throw new CommandLineError('formula not found');
            return path;
        }
      );

    function main(commandName, argv) {
            // arguments are mandatory and at the end of the argv array
            // readArguments MUST run before readOptions
        var args = argumentParser.readArguments(argv)
            // options are after the command name and berfore the arguments
            // readOptions MUST run after readArguments
          , options = argumentParser.readOptions(argv)
          ;

        console.log('processed arguments', args)
        console.log('processed options', options)

        function __get__(key){
            console.log('__get__ called with:', key);
        }

        var stack = engine.parse(args.formula);
        console.log('stack: ' + stack);
        console.log('execute ...');
        var result = stack.execute(__get__);
        console.log('>>> result >>>', result);
    }


    module = {main: main};
    Object.defineProperty(module, 'help', {
        get: argumentParser.toString.bind(argumentParser)
    });
    return module;
})
