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


A general feeling that I have with the models is that they are too concretely
tied to actual user interface elements. There should be some abstraction to it.
I think concrete user interface state (if we really want that) could even
be stored using a very generic key-value model, with simple validations and
all ui-users of this would gracefully fallback to a default state, if there
is no applciable state for them.


TODO: take the chance and update to Angular 1.4.x

I notice that all the code is now niceley spread over many files. But the
state is not encapsulated at all. It is like spaghetti code but it doesn't
look like that.

The way out of this is a) to structure the model the way the data needs to be
structured b) adopt the interface widgets to display well interfaces for the
model states. There should be no tightly coupled model for an interface widget.
Rather the other way around. Names like "DesignSpaceModel" or "PanelModel"\
are strong indicators for developing it the wrong way: first the interface
then the model, but that brings us in hells kitchen.

next step: model the data
then: see if we can reuse something of the current stuff
and: make a transitioning plan

"Model first" should always be the approach to development of complex software.

"configuration source" could be a good pattern for a lot of ui-needs. The aim
is that a user could use a custom "configuration source" for setting up the app.
Essentially everything that is not project-state or application state could be
fed controlled by a config-source. The app-state would need to fallback gracefully
if a state is no longer in the configuration (when starting fresh or when
the config changes, the latter is not so important for the beginning, imho)


project state:
  - MOM+CPS+Skeletons,cps-masters
  - UI-Master/UI-Instance-Setup/UI-Interpolation Setup
application state:
  - specimen panel state (which sample text is displayed, line height etc.)
  - maybe custom configuration entered during runtime (and stored longer)?
application configuration:
  - which are the available specimen sample texts
  - which are the settings for line-height (tight/loose)





