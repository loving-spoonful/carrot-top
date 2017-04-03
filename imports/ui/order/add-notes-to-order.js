import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { Orders } from '../../api/orders/orders.js';
import './add-notes-to-order.html'


Template.addNotesToOrderOverlay.onCreated(function () {
    this.state = new ReactiveDict();

    Meteor.subscribe('orders');
});


Template.addNotesToOrderOverlay.rendered = function() {
    // get the id from the session, find the order and then fill in the notes field on the window
    var Id = Session.get('currentOverlayID');
    var orderObject = Orders.findOne({_id: new Mongo.ObjectID(Id)});
    $('textarea[name="order-notes"]').val(orderObject.loaded_notes);
};

Template.addNotesToOrderOverlay.events({
    'submit .form-addNotesToOrderOverlay': function (event) {
        event.preventDefault();

        const target = event.target;

        var loadedNotes = target['order-notes'].value.trim();
        var Id = Session.get('currentOverlayID');

        Orders.update(
            {_id: new Mongo.ObjectID(Id)},
            {$set: {loaded_notes: loadedNotes}});

        sAlert.info('Saved notes for order');
        Session.set('currentOverlayID');
        Overlay.close();
    },
});

Template.addNotesToOrderOverlay.helpers({
});
