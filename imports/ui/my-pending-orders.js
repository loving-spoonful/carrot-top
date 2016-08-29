import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';

import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';

import './my-pending-orders.html'

if (Meteor.isClient) {
	FlowRouter.route('/my-pending-orders/', {
		name: 'my-pending-orders',
		action: function () {
			Tracker.autorun(function () {
				if (Meteor.userId()) {
					BlazeLayout.render('appBody', { main: 'myPendingOrders' });
				} else {
					BlazeLayout.render('appBody', { main: 'home' });
				}
			});
		}
	});
}

Template.myPendingOrders.onCreated(function bodyOnCreated() {
	// this.state = new ReactiveDict();
	Meteor.subscribe('items');
	Meteor.subscribe('orders');
	Meteor.subscribe('order-bundles');
});

Template.myPendingOrders.events({
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
	}
});

Template.myPendingOrders.helpers({
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
				{ owner_id: Meteor.userId() }
			]
		}, { sort: { created_at: 1 } });
	}
});
