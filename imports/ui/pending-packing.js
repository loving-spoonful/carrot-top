import { Template } from 'meteor/templating';
import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';

import './pending-packing.html'

if (Meteor.isClient) {
	FlowRouter.route('/pending-packing/', {
		name: 'pending-packing',
		action: function () {
			Tracker.autorun(function () {
				if (Meteor.userId()) {
					BlazeLayout.render('appBody', { main: 'pendingPacking' });
				} else {
					BlazeLayout.render('appBody', { main: 'home' });
				}
			});
		}
	});
}

Template.pendingPacking.onCreated(function bodyOnCreated() {
	this.state = new ReactiveDict();
	Meteor.subscribe('directory');
	Meteor.subscribe('items');
	Meteor.subscribe('orders');
	console.log(Meteor.users.find().fetch());
});

Template.pendingPacking.events({
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
							$set: { updated_at: Date.now() }
						});
					}
				}

				Orders.remove({ _id: new Mongo.ObjectID(orderId) });

				$(this).remove();
			});
		}
	},

	'click .js-pack-order': function (event) {
		var $order = $(event.target).parents('.list-order').first();
		var orderId = $order.data('id');

		if (window.confirm("Are you sure you want to mark this order as packed?")) {
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
		}s
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
