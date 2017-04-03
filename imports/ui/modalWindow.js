/**
 * Created by mike on 2017-02-21.
 */

Meteor.commonFunctions = {


    // call like this
    //  var sdi = Meteor.commonFunctions.popupModal("Deleting Agency", "Are you sure you want to delete the agency for '" + itemName + "'?");
    //  var modalPopup = ReactiveModal.initDialog(sdi);
    //  modalPopup.buttons.ok.on('click', function (button) {
    //      add functionality in here for when the user clicks OK
    //  }
    //  modalPopup.show();

    // popup modal window with both ok and cancel buttons
    popupModal: function (title, message) {
        var shareDialogInfo = {
            template: Template.appShareDialog,
            title: title,
            modalDialogClass: "share-modal-dialog", //optional
            modalBodyClass: "share-modal-body", //optional
            modalFooterClass: "share-modal-footer",//optional
            removeOnHide: true, //optional. If this is true, modal will be removed from DOM upon hiding

            buttons: {
                "cancel": {
                    class: 'btn-danger',
                    label: 'Cancel'
                },
                "ok": {
                    closeModalOnClick: true, // if this is false, dialog doesnt close automatically on click
                    class: 'btn-info',
                    label: 'Ok'
                }

            },
            doc: {  // Provide data context for Template.appShareDialog
                app: message
            }
        }
        return shareDialogInfo;
    },

    // popup with just an OK button
    popupOKModal: function (title, message) {
        var shareDialogInfo = {
            template: Template.appShareDialog,
            title: title,
            modalDialogClass: "share-modal-dialog", //optional
            modalBodyClass: "share-modal-body", //optional
            modalFooterClass: "share-modal-footer",//optional
            removeOnHide: true, //optional. If this is true, modal will be removed from DOM upon hiding

            buttons: {
                "ok": {
                    closeModalOnClick: true, // if this is false, dialog doesnt close automatically on click
                    class: 'btn-info',
                    label: 'Ok'
                }

            },
            doc: {  // Provide data context for Template.appShareDialog
                app: message
            }
        }
        return shareDialogInfo;
    }

}
