<!-- so the localmenu module has has no own template, because we
reproduce it all the time. not good.
-->
<mtk-local-menu class="localmenu">
    <div class="lm-head" ng-mousedown="localMenuCtrl.toggleMenu('masters')">
        Masters
    </div>
    <!-- a menu like this should be generated (data driven)
    the data is provided by the controller

    I think the divider thing is funny with ng-repeat, however.

    what is "display.localMenu == 'masters'" utterly strange ...


    oh and all menus have the identical model object, with that `display.localMenu == 'masters'`
    property. They are all the same, but live in different scopes.

    which apparently works, granted. Can something like this work without being
    spaghetti code?
    Like a menu-service (shared resources, that's what a service is good for
    after all. And we don't need a model to communicate this. Even if we
    need a model for persistance, it should be the model of the service.

    i.e. a shared LocalMenuService
         data driven menu building
         the local-menu get's its own template, so it can generate the menus
         from the data.
         -> I suspect the class="lm-divider" can be replaces by css:after
         -> there are better html elements for this, what is with html 5 menu and menuitem?
            That's a natural fit, I'd say.
    -->
    <div class="lm-body" ng-if="display.localMenu == 'masters'">
        <div class="lm-button" ng-mouseup="importUfo()">Import ufo…</div>
        <div class="lm-divider"></div>
        <!-- The !model.areChildrenSelected() is not only incredible verbose, it also does not prevent the action
        from being executed.
        That being said, we need the `inactive` functionality in the local-menu-module (note)
        brobably, as it looks we would set certain groups//tags inactive
        the duplicateMasters() entry is used twice in here and inactive on the same occasion


        seems like these methods are inherited from a higher scope.
        that's a job for $scope.emit() I'd say

        note: Funky, duplicateMasters is not defined anywhere else, also, not teh
        deleteMasters callback.

        -->
        <div class="lm-button" ng-mouseup="duplicateMasters()" ng-class="{'inactive': !model.areChildrenSelected()}">Duplicate</div>
        <div class="lm-divider"></div>
        <div class="lm-button" ng-mouseup="deleteMasters()" ng-class="{'inactive': !model.areChildrenSelected()}">Delete…</div>
    </div>
</mtk-local-menu>

<div class="list-container" mtk-view-rubberband="masters">
    <ul class="ul-sequence"><!-- so these sequences are everywhere, but not really used right now AFAIK-->
        <li class="li-sequence" ng-repeat="sequence in model.sequences">
            <ul class="ul-master" ui-sortable="sortableOptions" ng-model="sequence.children">
                <li class="li-master"
                    ng-repeat="master in sequence.children"
                    ng-mouseover="mouseoverMaster(master)"
                    ng-mouseleave="mouseleaveMaster()">
                    <mtk-master class="mtk-master"
                                mtk-model="master"
                                ng-class="{'selected': master.edit[0]}"></mtk-master>
                </li>
            </ul>
        </li>
    </ul>
    <!-- the next menu that should be generated
        it also shares one action: duplicateMasters

        maybe the controller offers all possible options and the generating
        code can pick whichever it wants to have (whitelisting) or not wants
        to have (blacklisting). That way the representation stuff can stay
        in the templates and we can be DRY
    -->
    <div class="list-buttons">
        <div title="Import UFO" ng-click="importUfo();" class="list-button">
            <img src="../ui/metapolator/assets/img/importUfo.png">
        </div>
        <div title="Duplicate Master(s)" ng-click="duplicateMasters();" class="list-button">
            <img src="../ui/metapolator/assets/img/duplicateMaster.png" ng-class="{'inactive': !model.areChildrenSelected()}">
        </div>
    </div>
</div>
