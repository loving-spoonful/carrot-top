import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';

import { Items } from '../api/items/items.js';
import { ItemCategories } from '../api/item-categories/item-categories.js';

import './add-item-category-overlay.html'

Template.addItemCategoryOverlay.onCreated(function () {
	this.state = new ReactiveDict();
	Meteor.subscribe('items');
	Meteor.subscribe('item-categories');
});

Template.addItemCategoryOverlay.events({
	'submit .form-add-item-category': function (event) {
		event.preventDefault();

		const target = event.target;
		const itemCategoryName = target['item-category-name'].value.trim();

		if (itemCategoryName.length > 0) {
			ItemCategories.insert({
				name: itemCategoryName,

				created_at: Date.now(),
				updated_at: Date.now()
			});

			Overlay.close();
		} else {
			alert('You must fill in all relevant fields in order to create your item category.');
		}
	},
});

Template.addItemCategoryOverlay.helpers({
	items() {
		return Items.find({}, { sort: { name: 1 } });
	},
	itemCategories() {
		return ItemCategories.find({}, { sort: { name: 1 } });
	}
});
