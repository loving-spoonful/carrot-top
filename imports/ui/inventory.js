import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';

import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';

import './inventory.html'

if (Meteor.isClient) {
	FlowRouter.route('/inventory/', {
		name: 'inventory',
		action() {
			BlazeLayout.render('appBody', { main: 'inventory' });
		}
	});
}

Template.inventory.onCreated(function bodyOnCreated() {
	// this.state = new ReactiveDict();
	Meteor.subscribe('items');
	Meteor.subscribe('item-categories');
});

Template.inventory.events({
	'click .js-add-item': function (event) {
		event.preventDefault();

		Overlay.open('addItemOverlay', this);
	},
	'click .js-edit-item': function (event) {
		var $item = $(event.target).parents('.list-item').first();
		var $itemAmount = $item.find('.item-quantity-amount').first();
		var itemAmountValue = parseFloat($itemAmount.html());

		// TODO: This should really be in reactive Meteor form not jQuery and data attributes...

		if ($item.data('editing') == false) {
			$item.data('editing', true);

			// Update HTML to include an editable text box...
			$itemAmount.replaceWith('<input type="text" class="item-quantity-amount" value="' + itemAmountValue + '">');
			$itemAmount = $item.find('.item-quantity-amount').first();

			$itemAmount.focus();

			// ... and a save changes button.
			$(event.target).parent().html('<span class="icon-check"></span>');

			// Need to encompass in a setTimeout for the Blink rendering engine.
			window.setTimeout(function () {
				// Set cursor to be at end of value.
				if ($itemAmount.setSelectionRange) {
					$itemAmount.setSelectionRange($itemAmount.val().length * 2, $itemAmount.val().length * 2);
				} else {
					// Fallback.
					$itemAmount.val($itemAmount.val());
				}
			});
		} else if($item.data('editing') == true) {
			var newItemAmountValue = parseFloat($itemAmount.val());

			if (newItemAmountValue > 0) {
				$item.data('editing', false);

				Items.update({ _id: new Mongo.ObjectID($item.data('id')) }, {
					$set: {
						quantity_amount: newItemAmountValue,
						updated_at: Date.now()
					}
				});

				// Update HTML to be read-only.
				$($itemAmount).replaceWith('<span class="item-quantity-amount">' + newItemAmountValue + '</span>');
				$(event.target).parent().html('<span class="icon-mode_edit"></span>');
			} else {
				alert('Inventory item cannot have a quantity of below zero.');
			}
		} else {
			console.error('Invalid value for editing data attribute.');
		}
	},

	'click .js-delete-item': function (event) {
		var $item = $(event.target).parents('.list-item').first();
		var itemId = $item.data('id');

		if (window.confirm("Are you sure you want to delete this item? You cannot get it back afterwards. " +
				"If it is currently not in stock, just set the quantity to 0. Any orders referring to this item will" +
				" be broken.")) {
			$item.slideUp(150, function () {
				// When finished sliding

				Items.remove({ _id: new Mongo.ObjectID(itemId) });

				$(this).remove();
			});
		}
	}
});

Template.inventory.helpers({
	items() {
		return Items.find({}, { sort: { name: 1 } });
	},
	availableItems() {
		return Items.find({ quantity_amount: { $gt: 0 } }, { sort: { name: 1 } })
	},
	orders() {
		return Orders.find({}, { sort: { createdAt: 1 }})
	}
});
