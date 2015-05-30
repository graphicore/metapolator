define([
    'angular'
  , './propertyDict-controller'
  , './propertyDict-directive'
  , 'metapolator/ui/redPill/cpsPanel/elements/property/property'
  , 'metapolator/ui/redPill/cpsPanel/elements/comment/comment'
  , 'metapolator/ui/redPill/cpsPanel/dragAndDrop/dragAndDrop'
], function(
    angular
  , Controller
  , directive
  , property
  , comment
  , dragAndDrop // contains the mtk-drag directive
) {
    "use strict";
    return angular.module('cps.propertyDict', [property.name, comment.name, dragAndDrop.name])
      .controller('PropertyDictController', Controller)
      .directive('mtkCpsPropertyDict', directive)
      ;
});
