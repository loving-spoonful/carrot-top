import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker'

import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';
import { Agencies } from '../api/agencies/agencies.js';
import { OrderBundles } from '../api/order-bundles/order-bundles.js';

import './pending-delivery.html'
import './modalWindow.js'

if (Meteor.isClient) {
	FlowRouter.route('/pending-delivery/', {
		name: 'pending-delivery',
        action: function () {
				BlazeLayout.render('appBody', { main: 'pendingDelivery' });
		}
	});
}

Template.pendingDelivery.onCreated(function bodyOnCreated() {
	// this.state = new ReactiveDict();
	Meteor.subscribe('directory');
	Meteor.subscribe('items');
	Meteor.subscribe('orders');
	Meteor.subscribe('order-bundles');
	Meteor.subscribe('Agencies');
});

var assignedVolunteer;
Template.pendingDelivery.events({
    'change #assignVolunteer': function (event) {
        event.preventDefault();
        // capture the volunteer that's selected from the drop down list
        var justID=event.target.value.split("\"");
        assignedVolunteer = justID[0];
    },

	'click .js-cancel-order': function (event) {
        event.preventDefault();
		var $order = $(event.target).parents('.list-order').first();
		var orderId = $order.data('id');

		// modal
        var sdi = Meteor.commonFunctions.popupModal("Deleting Order", "Are you sure you want to delete this order? You cannot get it back afterwards.");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Deleting order");

            // TODO do any data integrity checks (unless get RI into data model)
            // IF so, do not allow the delete and pop up a message.
            // Probably just do a find, and if it returns something - don't allow the remove

            $order.slideUp(150, function () {
                // When finished sliding

                var orderToDelete = Orders.findOne({ _id: new Mongo.ObjectID(orderId) });

                // Loop through items to return the quantities ordered to their original amounts.
                for (var r in orderToDelete.requests) {
                    if (orderToDelete.requests.hasOwnProperty(r)) {
                        Items.update({
                            _id: new Mongo.ObjectID(orderToDelete.requests[r].item_id)
                        }, {
                            $inc: { quantity_amount: orderToDelete.requests[r].quantity },
                            $set: { updated_at: Date.now()  }
                        });
                    }
                }

                Orders.remove({ _id: new Mongo.ObjectID(orderId) });

                $(this).remove();
            });


        });
        modalPopup.show();

		// modal
	},

    'click .js-assign-order': function (event) {
        event.preventDefault();

        // modal
        var sdi = Meteor.commonFunctions.popupModal("Assigning Order", "Are you sure you want to assign this order?");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Assigning order");
            // apologize for c&p programming - do it once, great.  second time copy is 'ok'
            // 3rd time refactor.  Need to get this done, 11:30 at night before trying to get this
            // live in march 2017.  Fix this mike sometime!  TODO refactor!
            var $order = $(event.target).parents('.list-order').first();
            var orderId = $order.data('id');

            var existingBundle = OrderBundles.findOne({ owner_id: assignedVolunteer, completed: false });

            if (existingBundle) {
                // Bundle already exists, order should be added to it.

                if (existingBundle.order_ids.indexOf(orderId) === -1) {
                    OrderBundles.update({
                        _id: new Mongo.ObjectID(existingBundle._id._str)
                    }, {
                        $push: { order_ids: orderId },
                        $set: { updated_at: Date.now() }
                    });
                } else {
                    // TODO: Handle order already being in a order.
                }
            } else {
                OrderBundles.insert({
                    order_ids: [ orderId ],
                    owner_id: assignedVolunteer,
                    completed: false,

                    created_at: Date.now(),
                    updated_at: Date.now()
                });
            }

            $order.slideUp(150, function () {
                // When finished sliding

            Orders.update({ _id: new Mongo.ObjectID(orderId) }, { $set: { bundled: true, updated_at: Date.now() } });
            $(this).remove();
            });

        });


        modalPopup.show();
        // modal

    },

    'click .js-add-notes-to-order': function (event) {
        event.preventDefault();

        var $order = $(event.target).parents('.list-order').first();
        var Id = $order.data('id');

        Session.set('currentOverlayID',Id);
        Overlay.open('addNotesToOrderOverlay', this);

    },

	'click .js-take-responsibility': function (event) {
        event.preventDefault();

        // modal
        var sdi = Meteor.commonFunctions.popupModal("Take Responsibility For This Order", "Are you sure you want to take responsibility for this order?");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Assigning order to you!");
            var $order = $(event.target).parents('.list-order').first();
            var orderId = $order.data('id');

            var existingBundle = OrderBundles.findOne({ owner_id: Meteor.userId(), completed: false });

            if (existingBundle) {
                // Bundle already exists, order should be added to it.

                if (existingBundle.order_ids.indexOf(orderId) === -1) {
                    OrderBundles.update({
                        _id: new Mongo.ObjectID(existingBundle._id._str)
                    }, {
                        $push: { order_ids: orderId },
                        $set: { updated_at: Date.now() }
                    });
                } else {
                    // TODO: Handle order already being in a order.
                }
            } else {
                OrderBundles.insert({
                    order_ids: [ orderId ],
                    owner_id: Meteor.userId(),
                    completed: false,

                    created_at: Date.now(),
                    updated_at: Date.now()
                });
            }

            $order.slideUp(150, function () {
                // When finished sliding

                Orders.update({ _id: new Mongo.ObjectID(orderId) }, { $set: { bundled: true,  updated_at: Date.now() } });
                $(this).remove();
            });
        });
        modalPopup.show();

        // modal

	},

	'click .js-complete-order': function (event) {
        event.preventDefault();

        var $order = $(event.target).parents('.list-order').first();
		var orderId = $order.data('id');


		//modal
        var sdi = Meteor.commonFunctions.popupModal("Delivering Order", "Are you sure you want to mark this order as delivered?");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Delivering!");

            // TODO do any data integrity checks (unless get RI into data model)
            // IF so, do not allow the delete and pop up a message.
            // Probably just do a find, and if it returns something - don't allow the remove

            $order.slideUp(150, function () {
                // When finished sliding

                Orders.update({ _id: new Mongo.ObjectID(orderId) }, {
                    $set: {
                        completed: true,
                        completed_by_id: Meteor.userId(),
                        updated_at: Date.now()
                    }
                });

                $(this).remove();
            });


        });
        modalPopup.show();
		//modal


	}
});

Template.pendingDelivery.helpers({
	items: function () {
		return Items.find({}, { sort: { name: 1 } });
	},
    getEmail: function (Id) {
        var itemObject;
        itemObject = Agencies.findOne({_id: new Mongo.ObjectID(Id) });
        return itemObject.name;
    },

    // TODO: seemed to need to name this different than the other allVolunteers function.  revisit
    allVolunteers2: function() {

        var allv = Meteor.users.find(
            {
                $or: [
                    {'profile.desired_role': 'volunteer'},
                    {'profile.desired_role': 'administrator'}
                ]
            }
        );



        return allv;
    },
    // get the first letter of a string - prob should be in a common spot, but needed it here
    firstLetter: function (someString) {
        var fooText = someString.substring(0,1);
        return new Spacebars.SafeString(fooText)
    },
	orders: function () {

            return Orders.find({
                $and: [
                    {
                        $or: [
                            { completed: false },
                            { completed: null }
                        ]
                    },
                    {
                        $or: [
                            { bundled: false },
                            { bundled: null }
                        ]
                    }
                    //{ packed: true }
                ]
            }, { sort: { updated_at: -1 } });


	}

});
