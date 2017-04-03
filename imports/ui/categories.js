import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';

import { Items } from '../api/items/items.js';
import { ItemCategories } from '../api/item-categories/item-categories.js';

import './categories.html'
import './modalWindow.js'


if (Meteor.isClient) {
    FlowRouter.route('/categories/', {
        name: 'categories',
        action() {
            BlazeLayout.render('appBody', {main: 'categories'})
        }
    });

}


Template.categories.onCreated(function bodyOnCreated() {
	this.state = new ReactiveDict();
	Meteor.subscribe('items');
	Meteor.subscribe('item-categories');
});

Template.categories.events({
	'click .js-add-category': function (event) {
		event.preventDefault();

		Overlay.open('addItemCategoryOverlay', this);
	},

	'click .js-edit-item-category': function (event) {
        event.preventDefault();

        var $category = $(event.target).parents('.list-item').first();
		var Id = $category.data('id');
		var itemObject = ItemCategories.findOne({ _id: new Mongo.ObjectID(Id) });

		// set the id in the session and open overlay - pattern used everywhere for editting existing 'thing'
        Session.set('currentOverlayID',Id);
        Overlay.open('addItemCategoryOverlay', this);

	},

	'click .js-delete-item-category': function (event) {
		var $category = $(event.target).parents('.list-item').first();
		var Id = $category.data('id');


        var itemObject = ItemCategories.findOne({ _id: new Mongo.ObjectID(Id) });
        var itemName = itemObject.name;

        var sdi = Meteor.commonFunctions.popupModal("Deleting Category", "Are you sure you want to delete the category for '" + itemName + "'?");
        var modalPopup = ReactiveModal.initDialog(sdi);

        // mcp the action when clicking OK (ie confirming the delete)
        modalPopup.buttons.ok.on('click', function(button){
            // what needs to be done after click ok.
            sAlert.info ("Deleting " + itemName);

            // mcp TODO check Inventory to see if there is something there that uses this category
            // mcp IF so, do not allow the delete and pop up a message.
            // mcp Probably just do a find, and if it returns something - don't allow the remove

            // mcp and if doing copy and paste - this is what changes!
            ItemCategories.remove({ _id: new Mongo.ObjectID(Id) });

            $(this).remove();
        });

        modalPopup.show();


	}
});

Template.categories.helpers({
	items() {
		return Items.find({}, { sort: { name: 1 } });
	},
	availableItems() {
		return Items.find({ quantity_amount: { $gt: 0 } }, { sort: { name: 1 } })
	},
	itemCategories() {
		return ItemCategories.find({}, { sort: { name: 1 } });
	}
});
