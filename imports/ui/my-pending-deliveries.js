import { Template } from 'meteor/templating';
import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';
import { OrderBundles } from '../api/order-bundles/order-bundles.js';

import './my-pending-deliveries.html'

if (Meteor.isClient) {
	FlowRouter.route('/my-pending-deliveries/', {
		name: 'my-pending-deliveries',
		action: function () {
			Tracker.autorun(function () {
				if (Meteor.userId()) {
					BlazeLayout.render('appBody', { main: 'myPendingDeliveries' });
				} else {
					BlazeLayout.render('appBody', { main: 'home' });
				}
			});
		}
	});
}

Template.myPendingDeliveries.onCreated(function bodyOnCreated() {
	this.state = new ReactiveDict();
	Meteor.subscribe('directory');
	Meteor.subscribe('items');
	Meteor.subscribe('orders');
	Meteor.subscribe('order-bundles');
});

Template.myPendingDeliveries.events({
	'click .js-cancel-order': function (event) {
		var $order = $(event.target).parents('.list-order').first();
		var orderId = $order.data('id');

		if (window.confirm("Are you sure you want to release this order? It will remain in the unowned orders for delivery section.")) {
			$order.slideUp(150, function () {
				// When finished sliding
				// TODO: Remove order from order bundle, delete bundle if no orders are left
			});
		}
	},

	'click .js-mark-complete': function (event) {
		// Should only ever be one order bundle.
		var $orderBundle = $('.order-bundle').first();
		var orderBundleId = $orderBundle.data('id');

		if (window.confirm('Are you sure you want to mark all your pending deliveries as complete?')) {
			$orderBundle.slideUp(150, function () {
				// When finished sliding
				OrderBundles.update({ _id: new Mongo.ObjectID(orderBundleId) }, { $set: { completed: true }});
				var completedOrderBundle = OrderBundles.findOne({ _id: new Mongo.ObjectID(orderBundleId) });

				for (var o in completedOrderBundle.order_ids) {
					if (completedOrderBundle.order_ids.hasOwnProperty(o)) {
						Orders.update({ _id: new Mongo.ObjectID(completedOrderBundle.order_ids[o]) }, {
							$set: { completed: true, completed_by_id: Meteor.userId() }
						});
					}
				}

				// TODO: File pickup report

				$(this).remove();
			});
		}
	}
});

Template.myPendingDeliveries.helpers({
	items: function () {
		return Items.find({}, { sort: { name: 1 } });
	},
	orderBundles: function () {
		return OrderBundles.find({ owner_id: Meteor.userId(), completed: false });
	},
	orderBundlesExist: function () {
		return OrderBundles.find({ owner_id: Meteor.userId(), completed: false }).count() > 0;
	}
});
