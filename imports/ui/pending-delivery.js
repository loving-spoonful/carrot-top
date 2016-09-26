import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker'

import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';
import { OrderBundles } from '../api/order-bundles/order-bundles.js';

import './pending-delivery.html'

if (Meteor.isClient) {
	FlowRouter.route('/pending-delivery/', {
		name: 'pending-delivery',
		action: function () {
			Tracker.autorun(function () {
				BlazeLayout.render('appBody', { main: 'pendingDelivery' });
			});
		}
	});
}

Template.pendingDelivery.onCreated(function bodyOnCreated() {
	// this.state = new ReactiveDict();
	Meteor.subscribe('directory');
	Meteor.subscribe('items');
	Meteor.subscribe('orders');
	Meteor.subscribe('order-bundles');
});

Template.pendingDelivery.events({
	'click .js-cancel-order': function (event) {
		var $order = $(event.target).parents('.list-order').first();
		var orderId = $order.data('id');

		if (window.confirm("Are you sure you want to delete this order? You cannot get it back afterwards.")) {
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
		}
	},

	'click .js-take-responsibility': function (event) {
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
				// TODO: Handle order already being in a bundle.
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

			Orders.update({ _id: new Mongo.ObjectID(orderId) }, { $set: { bundled: true } });
			$(this).remove();
		});
	},

	'click .js-complete-order': function (event) {
		var $order = $(event.target).parents('.list-order').first();
		var orderId = $order.data('id');

		if (window.confirm("Are you sure you want to mark this order as delivered?")) {
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
		}
	}
});

Template.pendingDelivery.helpers({
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
						{ bundled: false },
						{ bundled: null }
					]
				},
				{ packed: true }
			]
		}, { sort: { created_at: 1 } });
	}
	/*addressForOrder: function (orderID) {
		var orderObject = Orders.findOne({ _id: new Mongo.ObjectID(orderID) });
		var owner = Meteor.users.findOne({ _id: orderObject.owner_id });

		return owner.profile.address;
	}*/
});
