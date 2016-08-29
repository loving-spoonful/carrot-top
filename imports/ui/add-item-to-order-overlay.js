const CURRENT_ORDER_KEY = 'currentOrder';
const ITEM_INTERVALS_KEY = 'intervalsForItem';

import { Template } from 'meteor/templating';
import { Items } from '../api/items/items.js';

import './add-item-to-order-overlay.html'

var getIntervalsForItem = function (id) {
	var item = Items.findOne({ _id: new Meteor.Collection.ObjectID(id) });
	var intervals = [];
	var upper_threshold = item.quantity_amount;
	if (item.ordering_maximum < item.quantity_amount) {
		upper_threshold = item.ordering_maximum;
	}

	for (var x = item.ordering_minimum; x <= upper_threshold; x += item.ordering_increment) {
		intervals.push({
			numerical: x,
			text: (Math.round(x * 100) / 100).toString() + ' ' + item.quantity_units
		});
	}
	return intervals;
};

Template.addItemToOrderOverlay.onCreated(function () {
	// this.autorun(function() {
	// 	if (Meteor.userId() && Overlay.template() === 'addItemOverlay')
	// 		Overlay.close();
	// });
	this.state = new ReactiveDict();
	this.state.set(ITEM_INTERVALS_KEY, []);
	Meteor.subscribe('items');
});

Template.addItemToOrderOverlay.events({
	'click .js-add-item': function () {

	},
	'submit .form-add-to-order': function (event) {
		event.preventDefault();

		const target = event.target;
		const item = target['item-type'].value;

		var currentSessionData = Session.get(CURRENT_ORDER_KEY);

		if (parseFloat(target['item-quantity'].value) > 0) {
			var newItem = Items.findOne({_id: new Meteor.Collection.ObjectID(item)});
			newItem.quantity = target['item-quantity'].value;
			newItem.instructions = target['instructions'].value;
			currentSessionData.push(newItem);

			Session.set(CURRENT_ORDER_KEY, currentSessionData);

			Overlay.close();
		} else {
			alert('You must order more than 0 of an item!');
		}
	},
	'change #item-type': function (event) {
		Template.instance().state.set(ITEM_INTERVALS_KEY, getIntervalsForItem(event.target.value));
	}
});

Template.addItemToOrderOverlay.helpers({
	items() {
		return Items.find({}, { sort: { name: 1 } });
	},
	availableItems() {
		var existingOrderItemIds = [];
		var currentSessionData = Session.get(CURRENT_ORDER_KEY);

		for (var item in currentSessionData) {
			if (currentSessionData.hasOwnProperty(item)) {
				existingOrderItemIds.push(new Mongo.ObjectID(currentSessionData[item]._id._str));
			}
		}

		console.log(existingOrderItemIds);

		return Items.find({
			_id: { $nin: existingOrderItemIds },
			quantity_amount: { $gt: 0 }
		}, { sort: { name: 1 } });
	},
	intervals() {
		return Template.instance().state.get(ITEM_INTERVALS_KEY);
	}
});
