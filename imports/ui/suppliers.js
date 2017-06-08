/**
 * Created by mike on 2017-01-22.
 */
import { Template } from 'meteor/templating';
import { Suppliers } from '../api/suppliers/suppliers.js';
import { Agencies } from '../api/agencies/agencies.js';
import './suppliers.html'
import './modalWindow.js'

if (Meteor.isClient) {
    FlowRouter.route('/suppliers/', {
        name: 'suppliers',
        action() {
            BlazeLayout.render('appBody', { main: 'suppliers' })
        }
    });


}
Template.suppliers.onCreated(function bodyOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('Suppliers');
});



Template.suppliers.events({
    'click .js-add-supplier': function (event) {
        event.preventDefault();
        Overlay.open('addSupplierOverlay', this);
    },

    'click .js-edit-supplier': function (event) {
        event.preventDefault();

        var $supplier = $(event.target).parents('.list-item').first();
        var Id = $supplier.data('id');

        // put the id in the session.  overlay.close will always clear it out, but
        // after an update on the respective overlay page, should clear there as well
        // So should only ever be existing while on an overlay page
        Session.set('currentOverlayID',Id);
        Overlay.open('addSupplierOverlay', this);
    },


    'click .js-delete-supplier': function (event) {
        event.preventDefault();

        var $supplier = $(event.target).parents('.list-item').first();
        var Id = $supplier.data('id');


        var itemObject = Suppliers.findOne({ _id: new Mongo.ObjectID(Id) });
        var itemName = itemObject.name;


        var sdi = Meteor.commonFunctions.popupModal("Deleting Supplier", "Are you sure you want to delete the supplier for '" + itemName + "'?");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Deleting " + itemName);

            // TODO do any data integrity checks (unless get RI into data model)
            // IF so, do not allow the delete and pop up a message.
            // Probably just do a find, and if it returns something - don't allow the remove

            Suppliers.remove({_id: new Mongo.ObjectID(Id)});

            $(this).remove();

        });
        modalPopup.show();

    }
});

Template.suppliers.helpers({
    suppliers() {
        //ebugger;

        return Suppliers.find ({}, {sort: {name: 1}});
    }
});
