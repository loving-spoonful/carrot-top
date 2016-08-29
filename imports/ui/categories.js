import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';

import { Items } from '../api/items/items.js';
import { ItemCategories } from '../api/item-categories/item-categories.js';

import './categories.html'

if (Meteor.isClient) {
	FlowRouter.route('/categories/', {
		name: 'categories',
		action() {
			BlazeLayout.render('appBody', { main: 'categories' })
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
		var $item = $(event.target).parents('.list-item').first();
		var itemId = $item.data('id');
		var itemObject = ItemCategories.findOne({ _id: new Mongo.ObjectID(itemId) });

		var newName = window.prompt('What would you like this item category to be called?', itemObject.name);

		if (newName) {
			ItemCategories.update({ _id: new Mongo.ObjectID(itemId) }, { $set: { name: newName }});
		}
	},

	'click .js-delete-item-category': function (event) {
		var $item = $(event.target).parents('.list-item').first();
		var itemId = $item.data('id');

		if (window.confirm("Are you sure you want to delete this category? You cannot get it back afterwards. " +
				"Any items referring to this category will be broken.")) {
			$item.slideUp(150, function () {
				// When finished sliding

				ItemCategories.remove({ _id: new Mongo.ObjectID(itemId) });

				$(this).remove();
			});
		}
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
