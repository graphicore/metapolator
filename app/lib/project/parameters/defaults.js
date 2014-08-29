define([
    'metapolator/errors'
  , 'metapolator/models/CPS/parsing/Source'
  , 'metapolator/models/CPS/elements/ParameterCollection'
  , 'metapolator/models/CPS/elements/Rule'
  , 'metapolator/models/CPS/elements/ParameterDict'
  , 'metapolator/models/CPS/elements/Parameter'
  , 'metapolator/models/CPS/elements/ParameterName'
  , 'metapolator/models/CPS/elements/ParameterValue'
  , 'metapolator/models/CPS/parsing/parseSelectorList'
], function(
    errors
  , Source
  , ParameterCollection
  , Rule
  , ParameterDict
  , Parameter
  , ParameterName
  , ParameterValue
  , parseSelectorList
) {
    "use strict";

    var items = []
      , source = new Source('(generated/default parameters)')
      , rules = []
      ;


    function parameterDictFromObject(obj, source) {
        var items = []
          , k
          , name
          , value
          ;

        for(k in obj) {
            name = new ParameterName(k, [], source);
            value = new ParameterValue([obj[k]], [], source);
            items.push(new Parameter(name, value, source));
        }
        return new ParameterDict(items);
    }

    rules.push(
        new Rule(
            parseSelectorList.fromString('point>center', source.name)
          , parameterDictFromObject({
                  on: 'onIntrinsic + parent:skeleton:on'
                , in: 'inIntrinsic + on'
                , out: 'outIntrinsic + on'
              })
          , source
        )
      , new Rule(
            parseSelectorList.fromString('point>left, point>right', source.name)
          , parameterDictFromObject({
                  on: 'onIntrinsic + parent:center:on'
                , in: 'inIntrinsic + parent:center:on + parent:center:inIntrinsic + onIntrinsic'
                , out: 'outIntrinsic + parent:center:on + parent:center:outIntrinsic + onIntrinsic'
                , inDir: 'inDirIntrinsic + parent:center:inDir'
                , outDir: 'outDirIntrinsic + parent:center:outDir'
              })
          , source
        )
    );
    return new ParameterCollection(rules, source);
});
