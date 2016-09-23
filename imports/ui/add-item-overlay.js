import { Template } from 'meteor/templating';

import { Items } from '../api/items/items.js';
import { ItemCategories } from '../api/item-categories/item-categories.js';

import './add-item-overlay.html'

Template.addItemOverlay.onCreated(function () {
	this.state = new ReactiveDict();
	Meteor.subscribe('items');
	Meteor.subscribe('item-categories');
});

Template.addItemOverlay.events({
	'keyup #item-quantity': function (event) {
		const target = event.target;
		const $itemOrderMinimumInput = $('#item-order-minimum');
		const $quantityUnits = $('#quantity-units');

		if (target.value) {
			const possibleMinimum = Math.round(parseFloat(target.value) / 5);
			const minimumToSet = possibleMinimum < 1 ? 1 : possibleMinimum;

			if ($itemOrderMinimumInput.data('user-set') != true) {
				// TODO: If value was not manually set

				if ($quantityUnits.val() == 'lb') {
					$itemOrderMinimumInput.val(minimumToSet);
					window.setTimeout(function () {
						$(this).data('user-set', false);
					}.bind($itemOrderMinimumInput[0]), 10);
				}
			}
		} else {
			if ($itemOrderMinimumInput.data('user-set') != true) {
				$itemOrderMinimumInput.val('');
			}
		}
	},
	'change #item-order-minimum': function (event) {
		if (event.target.value.length > 0) {
			$(event.target).data('user-set', true);
		} else {
			$(event.target).data('user-set', false);
		}
	},
	'change #quantity-units': function (event) {
		const $itemOrderMinimumInput = $('#item-order-minimum');

		if (event.target.value == 'lb' && $itemOrderMinimumInput.data('user-set') != true) {
			const possibleMinimum = Math.round(parseFloat(target.value) / 5);
			const minimumToSet = possibleMinimum < 1 ? 1 : possibleMinimum;

			$itemOrderMinimumInput.val(minimumToSet);
			window.setTimeout(function () {
				$(this).data('user-set', false);
			}.bind($itemOrderMinimumInput[0]), 10);
		}
	},
	'submit .form-add-item': function (event) {
		event.preventDefault();

		const target = event.target;
		const itemName = target['item-name'].value.trim();
		const itemQuantity = parseFloat(target['item-quantity'].value.trim());
		const itemQuantityUnits = target['quantity-units'].value.trim();
		const itemOrderMinimum = parseFloat(target['item-order-minimum'].value.trim());
		const itemOrderMaximum = parseFloat(target['item-order-maximum'].value.trim());
		const itemOrderIncrement = parseFloat(target['item-order-increment'].value.trim());
		const itemCategory = target['item-category'].value.trim();

		if (itemName.length > 0 && !isNaN(itemQuantity) && itemQuantityUnits.length > 0
			&& !isNaN(itemOrderMinimum) && !isNaN(itemOrderMaximum) && !isNaN(itemOrderIncrement)
			&& itemCategory.length > 0) {
			Items.insert({
				name: itemName,

				quantity_amount: itemQuantity,
				quantity_units: itemQuantityUnits,
				ordering_minimum: itemOrderMinimum,
				ordering_maximum: itemOrderMaximum,
				ordering_increment: itemOrderIncrement,

				category_id: itemCategory,

				created_at: Date.now(),
				updated_at: Date.now()
			});

			Overlay.close();
		} else {
			alert('You must fill in all relevant fields in order to create your item.');
		}
	},
});

Template.addItemOverlay.helpers({
	items() {
		return Items.find({}, { sort: { name: 1 } });
	},
	itemCategories() {
		return ItemCategories.find({}, { sort: { name: 1 } });
	}
});
