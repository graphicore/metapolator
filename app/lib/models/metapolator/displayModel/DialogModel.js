define([
    '../_BaseModel'
  , 'jquery'
], function(
    Parent
  , $
){
    "use strict";


    // to answer this question: This is a service. Shared amongst all,
    // must be a servcice.
    // we should provide load it via the Metapolator top level module.
    // this could be a nice option: to bootstrap some dialogs
    // https://github.com/dwmkerr/angular-modal-service/blob/master/src/angular-modal-service.js
    function DialogModel() {

    }

    var _p = DialogModel.prototype = Object.create(Parent.prototype);

    _p.confirm = function(message, callback) {
        var self = this;
        self.openDialogScreen(message, false, true, false);
        $('#dialog-button-true').click(function() {
            self.closeDialogScreen();
            $('#dialog-button-true').unbind();
            callback(true);
        });
        $('#dialog-button-false').click(function() {
            self.closeDialogScreen();
            $('#dialog-button-false').unbind();
            callback(false);
        });
    };

    _p.openDialogScreen = function (message, loading, buttons, close) {
        $("#layover").fadeIn(100);
        //$("#dialog").fadeIn(300);
        $("#dialog #dialog-content").html(message);
        if (loading) {
            $("#dialog-loading").show();
        }
        if (buttons) {
            $("#dialog-confirm").show();
        }
        if (close) {
            $("#dialog-close").show();
        }
    };

    _p.closeDialogScreen = function () {
        $("#layover").fadeOut(300);
        // hide buttons
        $("#dialog-loading").hide();
        $("#dialog-close").hide();
        $("#dialog-confirm").hide();
    };

    return DialogModel;
});
