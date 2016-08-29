'use strict';

const CURRENT_ORDER_KEY = 'currentOrder';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';

import './order.html'

if (Meteor.isClient) {
	FlowRouter.route('/order/', {
		name: 'order',
		action() {
			Tracker.autorun(function () {
				if (Meteor.userId()) {
					BlazeLayout.render('appBody', { main: 'order' });
				} else {
					BlazeLayout.render('appBody', { main: 'home' });
				}
			});
		}
	});
}

Template.order.onCreated(function bodyOnCreated() {
	Meteor.subscribe('directory');
	Meteor.subscribe('items');
	Meteor.subscribe('orders');

	if (!Session.get(CURRENT_ORDER_KEY)) { Session.set(CURRENT_ORDER_KEY, []); }

	const currentDate = new Date();
	const currentDay = currentDate.getDate();
	const currentHours = currentDate.getHours();
	const currentMinutes = currentDate.getMinutes();
	const currentTime = currentHours * 100 + currentMinutes; // Quick hack; make a number out of the time.

	if (!((currentDay == 1 || currentDay == 5) && (currentTime <= 1200 && currentTime >= 700))) {
		alert('Only orders made between 7 am and noon EST will be fulfilled!');
	}
});

Template.order.events({
	'click .js-add-item': function (event) {
		event.preventDefault();

		Overlay.open('addItemToOrderOverlay', this);
	},
	'click .js-place-order': function (event) {
		event.preventDefault();

		// TODO: Additional verification around roles.
		if (Meteor.user()) {
			var currentOrder = Session.get(CURRENT_ORDER_KEY);
			if (currentOrder.length > 0) {
				var requests = [];
				var old_quantities = []; // TODO: Do some error handling to make sure item quantities don't get offset.

				for (var i in currentOrder) {
					if (currentOrder.hasOwnProperty(i)) {
						var item = Items.findOne({ _id: new Mongo.ObjectID(currentOrder[i]._id._str) });
						old_quantities.push({
							id: currentOrder[i]._id._str,
							quantity: item.quantity_amount
						});

						// Subtract off ordered amount from inventory amount.
						// TODO: Somehow make sure this doesn't result in errors if 2 simultaneous updates happen.
						Items.update({
							_id: new Mongo.ObjectID(currentOrder[i]._id._str)
						}, {
							$inc: { quantity_amount: -currentOrder[i].quantity }
						});

						requests.push({
							item_id: currentOrder[i]._id._str,
							quantity: currentOrder[i].quantity,
							instructions: currentOrder[i].instructions
						});
					}
				}

				// TODO: Catch errors if the insert fails and return items to their original quantities.

				Orders.insert({
					requests: requests,
					owner_id: Meteor.user()._id,

					packed: false,
					packed_by_id: "",

					completed: false,
					completed_by_id: "",

					bundled: false,

					created_at: Date.now(),
					updated_at: Date.now()
				});

				Session.set(CURRENT_ORDER_KEY, []);
				alert('Order placed!');
			} else {
				alert('You must have at least one item in your order.');
			}
		} else {
			alert('You must be logged in to place an order.');
		}
	},
	'click .js-delete-order-item': function (event) {
		var currentOrder = Session.get(CURRENT_ORDER_KEY);

		var $orderItem = $(event.target).parents('.list-item').first();
		var orderItemIndex = parseInt($orderItem.data('index'));

		$orderItem.slideUp(150, function () {
			// When finished sliding

			if (currentOrder[orderItemIndex] !== undefined) {
				currentOrder.splice(orderItemIndex, 1);
				Session.set(CURRENT_ORDER_KEY, currentOrder);
			}

			$(this).remove();
		});
	}
});

Template.order.helpers({
	items() {
		return Items.find({}, { sort: { name: 1 } });
	},
	currentOrder() {
		return Session.get(CURRENT_ORDER_KEY);
	}
});

