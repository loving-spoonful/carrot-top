import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';
import './inventory.html'
import './modalWindow.js'

if (Meteor.isClient) {
	FlowRouter.route('/inventoryN/', {
		name: 'inventoryN',
		action() {
			BlazeLayout.render('appBody', { main: 'inventory' });
		}
	});
    FlowRouter.route('/inventoryM/', {
        name: 'inventoryM',
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
        var typeParam = FlowRouter.getQueryParam("type");
		Overlay.open('addItemOverlay', typeParam);
	},
	'click .js-edit-item': function (event) {

        event.preventDefault();

        var $inventory = $(event.target).parents('.list-item').first();
        var Id = $inventory.data('id');
        var itemObject = Items.findOne({ _id: new Mongo.ObjectID(Id) });

        Session.set('currentOverlayID',Id);

        var typeParam = FlowRouter.getQueryParam("type");
        Overlay.open('addItemOverlay', typeParam);

	},

	'click .js-delete-item': function (event) {
        event.preventDefault();

        var $item = $(event.target).parents('.list-item').first();
		var itemId = $item.data('id');

        var itemObject = Items.findOne({ _id: new Mongo.ObjectID(itemId) });
        var itemName = itemObject.name;

        var sdi = Meteor.commonFunctions.popupModal("Deleting Inventory",
            "Are you sure you want to delete inventory for '" + itemName + "'? "
            + "If it is currently not in stock, set the quantity to 0. Any orders referring to this item will"
            + " be broken."
		);
        var modalPopup = ReactiveModal.initDialog(sdi);


        // the action when clicking OK (ie confirming the delete)
        modalPopup.buttons.ok.on('click', function(button){
            // what needs to be done after click ok.
            sAlert.info ("Deleting " + itemName);

            // TODO check ORDERS to see if there is something there that uses this inventory
            // IF so, do not allow the delete and pop up a message.
            // Probably just do a find, and if it returns something - don't allow the remove

            // mcp and if doing copy and paste - this is what changes!
            Items.remove({ _id: new Mongo.ObjectID(itemId) });

            $(this).remove();
        });

        modalPopup.show();

	}
});

Template.inventory.helpers({
	items() {
        var typeParam = FlowRouter.getQueryParam("type");
		return Items.find({purchasing_program: typeParam}, { sort: { purchasing_program: -1, name: 1 } });
	},
    isVeggies() {
        var typeParam = FlowRouter.getQueryParam("type");
        if (typeParam == "M") {
            return false;
        }
        return true;
    },
	availableItems() {
        var typeParam = FlowRouter.getQueryParam("type");
		return Items.find({ $and:[{quantity_amount: { $gt: 0 }}, {purchasing_program: typeParam}] }, { sort: { name: 1 } })
	},
	orders() {
		return Orders.find({}, { sort: { createdAt: 1 }})
	}
});
