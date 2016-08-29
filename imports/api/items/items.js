import { Mongo } from 'meteor/mongo';

import { ItemCategories } from '../item-categories/item-categories.js';

export const Items = new Mongo.Collection('items', { idGeneration: 'MONGO' });

if (Meteor.isServer) {
	// This code only runs on the server
	Meteor.publish('items', function () {
		return Items.find();
	});
}

Items.schema = new SimpleSchema({
	name: { type: String },

	quantity_amount: { type: Number, min: 0, decimal: true },
	quantity_units: { type: String },

	ordering_minimum: { type: Number, min: 0, decimal: true },
	ordering_maximum: { type: Number, min: 0.001, decimal: true },
	ordering_increment: { type: Number, min: 0, decimal: true },

	category_id: { type: String },

	created_at: { type: Date },
	updated_at: { type: Date }
});
Items.attachSchema(Items.schema);

Items.helpers({
	category() {
		return ItemCategories.find({ _id: this.category_id });
	}
});
