require([
    'webAPI/document'
  , 'require/domReady'
  , 'angular'
  , 'ui/metapolator/app'
  , 'Metapolator'
  , 'models/metapolator/AppModel'
], function (
    document
  , domReady
  , angular
  , angularApp
  , Metapolator
  , AppModel
) {
    "use strict";
    var lasttime = null;

    // ah here is it
    window.logCall = function(name) {
        var thistime = Date.now();
        console.log(name + " " + (thistime - lasttime));
        lasttime = thistime;
    };

    var model = new AppModel();
    // set initial model data
    model.masterPanel.addSequence("Sequence 1");
    model.instancePanel.addSequence("Family 1");
    // creation of inital masters
    var masters = ["Regular", "Bold", "Light", "Condensed", "Extended", "Italic"];
    //FIXME: this lidt is also in models/metapolator/AppModel
    var glyphs = ["A", "B", "C", "D", "E", "F", "G", "H", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "space"];

    //TODO: hint jeroen to native Array.prototype.forEach, it has less
    // dependencies than this
    // I also wonder why we don't do this kind of bootstrapping here?
    // isn't there a more appropriate place somewhere?
    // i.e. MasterPanelController, SequenceController, InstanceController etc. ???
    angular.forEach(masters, function(master) {
        model.masterPanel.sequences[0].addMaster(master);
        angular.forEach(glyphs, function(glyph){
            model.masterPanel.sequences[0].children[model.masterPanel.sequences[0].children.length - 1].addGlyph(glyph);
        });
    });


    // DesignSpaceController?
    model.designSpacePanel.addDesignSpace();
    // to deep this shit. more than one dot is often a bad sign, especially
    // if the first name is not this (then more than three dots is a bad sign)
    // model.designSpacePanel should default by itself to .designSpaces[0]
    model.designSpacePanel.currentDesignSpace = model.designSpacePanel.designSpaces[0];



    // The metapolator interface is made global here for development
    // this should change again!
    // FIXME: Metapolator should import angularApp (RedPill does it like
    // it is done here) and we run angular.bootstrap from here. this is
    // probably OK
    window.metapolator = new Metapolator(model, angularApp);

    // this should be the last thing here, because domReady will execute
    // immediately if dom is already ready.
    domReady(function() {
        angular.bootstrap(document, [angularApp.name]);
    });
});
