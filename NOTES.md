#NOTES

`jquery-ui` can be required, using _ as a placeholder for the not used return value

`sortable` is a problem because it has deps: ['jquery-ui', 'angular'] that are 'amd'
modules. especially jquery-ui. The require-js config says that is not working:

> Only use other "shim" modules as dependencies for shimmed scripts, or
  AMD libraries that have no dependencies and call define() after they also
  create a global (like jQuery or lodash). Otherwise, if you use an AMD module
  as a dependency for a shim config module, after a build, that AMD module may
  not be evaluated until after the shimmed code in the build executes, and an
  error will occur. The ultimate fix is to upgrade all the shimmed code to
  have optional AMD define() calls.

I read this like jquery-ui has a AMD dependency, that is jquery, thus jquery-ui
can't be used as a dependency of a shimmed module. Your build will fail

*Let's se if that's true in our case and try a build when ready.*

under the impression of master-panel-controller.js
If we use directive setup: `bindToController: true` and `controllerAs: 'controllerName'`
we can have a much better organized $scope namespace. It is a bit brutal to have all code
there for keeping the stuff oversee-able.
Also, we use the Controllers not to their full potential, which is a pity.


Todo: directives should provide high level interfaces to manipulate the DOM
controllers should use these interface.

I think the task will be to redistribute what we have everywhere, so that
the structure is used appropriately.
That means:
    what can be done in pure css should be done there
    directives do DOM<->Controller interaction
    controlers do model<->Directive interaction
    $scopes are a medium for conversation between Directive and Controller
    and between Controller and other Controllers or Directives and other
    Directives. Because $scopes are so vastly overloaed, we try to keep
    everything ordered.



TODO: take the chance and update to Angular 1.4.x




