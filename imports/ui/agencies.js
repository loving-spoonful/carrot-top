/**
 * Created by mike on 2017-01-22.
 */
import { Template } from 'meteor/templating';
import { Agencies } from '../api/agencies/agencies.js';
import './agencies.html'
import './modalWindow.js'

if (Meteor.isClient) {
    FlowRouter.route('/agencies/', {
        name: 'agencies',
        action() {
            BlazeLayout.render('appBody', { main: 'agencies' })
        }
    });


}
Template.agencies.onCreated(function bodyOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('Agencies');
});



Template.agencies.events({
    'click .js-add-agency': function (event) {
        event.preventDefault();
        Overlay.open('addAgencyOverlay', this);
    },

    'click .js-edit-agency': function (event) {
        event.preventDefault();

        var $agency = $(event.target).parents('.list-item').first();
        var Id = $agency.data('id');

        // put the id in the session.  overlay.close will always clear it out, but
        // after an update on the respective overlay page, should clear there as well
        // So should only ever be existing while on an overlay page
        Session.set('currentOverlayID',Id);
        Overlay.open('addAgencyOverlay', this);
    },


    'click .js-delete-agency': function (event) {
        event.preventDefault();

        var $agency = $(event.target).parents('.list-item').first();
        var Id = $agency.data('id');


        var itemObject = Agencies.findOne({ _id: new Mongo.ObjectID(Id) });
        var itemName = itemObject.name;


        var sdi = Meteor.commonFunctions.popupModal("Deleting Supplier", "Are you sure you want to delete the agency for '" + itemName + "'?");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Deleting " + itemName);

            // TODO do any data integrity checks (unless get RI into data model)
            // IF so, do not allow the delete and pop up a message.
            // Probably just do a find, and if it returns something - don't allow the remove

            Agencies.remove({_id: new Mongo.ObjectID(Id)});

            $(this).remove();

        });
        modalPopup.show();

    }
});

Template.agencies.helpers({
    Agencies() {
        //ebugger;
        return Agencies.find ({}, {sort: {name: 1}});

    }
});
