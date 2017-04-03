import { Template } from 'meteor/templating';
import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';

import './pending-packing.html'
import './modalWindow.js'

if (Meteor.isClient) {
	FlowRouter.route('/pending-packing/', {
		name: 'pending-packing',
		action: function () {
					BlazeLayout.render('appBody', { main: 'pendingPacking' });
		}
	});
}

Template.pendingPacking.onCreated(function bodyOnCreated() {
	this.state = new ReactiveDict();
	Meteor.subscribe('directory');
	Meteor.subscribe('items');
	Meteor.subscribe('orders');
});

Template.pendingPacking.events({
	'click .js-cancel-order': function (event) {
        event.preventDefault();

        var $order = $(event.target).parents('.list-order').first();
		var orderId = $order.data('id');


		//modal
        var sdi = Meteor.commonFunctions.popupModal("Deleting Order", "Are you sure you want to delete this order? You cannot get it back afterwards.");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Deleting " + itemName);

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
                            $set: { updated_at: Date.now() }
                        });
                    }
                }

                Orders.remove({ _id: new Mongo.ObjectID(orderId) });

                $(this).remove();
            });


        });
        modalPopup.show();

		//modal


	},

	'click .js-pack-order': function (event) {
        event.preventDefault();

        var $order = $(event.target).parents('.list-order').first();
		var orderId = $order.data('id');


		//modal
        var sdi = Meteor.commonFunctions.popupModal("Packing Order", "Are you sure you want to mark this order as packed?");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Packing!");

            // TODO do any data integrity checks (unless get RI into data model)
            // IF so, do not allow the delete and pop up a message.
            // Probably just do a find, and if it returns something - don't allow the remove

            $order.slideUp(150, function () {
                // When finished sliding

                Orders.update({ _id: new Mongo.ObjectID(orderId) }, {
                    $set: {
                        packed: true,
                        packed_by_id: Meteor.userId(),
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

Template.pendingPacking.helpers({
	items: function () {
		return Items.find({}, { sort: { name: 1 } });
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
						{ packed: false },
						{ packed: null }
					]
				}
			]
		}, { sort: { created_at: 1 } });
	}
});
