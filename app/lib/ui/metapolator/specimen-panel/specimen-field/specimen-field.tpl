<div mtk-specimen-rubberband="{{model.settings.selecting}}" 
     mtk-model="injections"
     class="specimen-content non-glyph-range" 
     ng-class="'specimen-field-' + model.name"
     ng-if="model.mixer.specimenSamples.currentSample.name != 'Glyph Range'">
    <ul>
        <li ng-repeat="glyphContainer in model.filteredGlyphs track by glyphContainer.glyphId"
            ng-class="'master-' + glyphContainer.glyph.masterName"><!--
            --><mtk-glyph mtk-model="glyphContainer.glyph" 
                          ng-click="glyphClick($event, glyphContainer.glyph)"
                          ng-class="{'selected' : glyphContainer.glyph.edit}" 
                          ng-style="{'height': model.sizes.fontSize + 'px'}">
                            {{glyphContainer.glyph.name}}
                          </mtk-glyph><!--
            
        --></li>
    </ul>
</div>