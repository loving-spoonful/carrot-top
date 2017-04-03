import { Template } from 'meteor/templating';
import { Items } from '../api/items/items.js';
import { ItemCategories } from '../api/item-categories/item-categories.js';
import './add-item-overlay.html'

Template.addItemOverlay.onCreated(function () {
	this.state = new ReactiveDict();
	Meteor.subscribe('items');
	Meteor.subscribe('item-categories');
});


Template.addItemOverlay.rendered = function() {
    var Id = Session.get('currentOverlayID');
    if (Id == undefined) {
        $('button[name="inventory_save_btn"]').text("Add");
    }
    else {

        var inventoryObject = Items.findOne({_id: new Mongo.ObjectID(Id)});
        $('input[name="item-name"]').val(inventoryObject.name);
        $('input[name="item-quantity"]').val(inventoryObject.quantity_amount);
        $('select[name="quantity-units"]').val(inventoryObject.quantity_units);
        $('input[name="item-order-minimum"]').val(inventoryObject.ordering_minimum);
        $('input[name="item-order-maximum"]').val(inventoryObject.ordering_maximum);
        $('input[name="item-order-increment"]').val(inventoryObject.ordering_increment);
        $('select[name="item-category"]').val(inventoryObject.category_id);
        $('input[name="item-order-increment"]').val(inventoryObject.ordering_increment);

        $('button[name="inventory_save_btn"]').text("Save");

    };
}

Template.addItemOverlay.events({

	'change #item-order-minimum': function (event) {
        event.preventDefault();

        if (event.target.value.length > 0) {
			$(event.target).data('user-set', true);
		} else {
			$(event.target).data('user-set', false);
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

		if (itemOrderMinimum > itemOrderMaximum) {
            sAlert.warning('The maximum must be greater than the minimum. Correct and save again.');
			return;
        }
		if (itemName.length > 0 && !isNaN(itemQuantity) && itemQuantityUnits.length > 0
			&& !isNaN(itemOrderMinimum) && !isNaN(itemOrderMaximum) && !isNaN(itemOrderIncrement)
			&& itemCategory.length > 0) {

            var Id = Session.get('currentOverlayID');

            // look to see if this is updating the same inventory item!
            var inventoryId = Items.findOne({name: itemName}, {fields: {_id: 1}});
            var inventoryName = Items.findOne({name: itemName});
			if (Id) {
				if (Id == inventoryId._id) {
					Items.update ({ _id: new Mongo.ObjectID(Id) },
						{ $set:
							{
								name: itemName,

								quantity_amount: itemQuantity,
								quantity_units: itemQuantityUnits,
								ordering_minimum: itemOrderMinimum,
								ordering_maximum: itemOrderMaximum,
								ordering_increment: itemOrderIncrement,

								category_id: itemCategory,

								updated_at: Date.now()
							}
						});
                    sAlert.info('Saved!');
                    Session.set('currentOverlayID');
					Overlay.close();
				}
				else {
					sAlert.warning('This inventory item (' + itemName + ') already exists!');
				}
			}
			else {
            	if (inventoryName) {
                    sAlert.warning('This inventory item (' + inventoryName + ') already exists!');
                }
				else {
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
				}

			}
		} else {
			sAlert.warning('You must fill in all relevant fields in order to create your item.');
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
