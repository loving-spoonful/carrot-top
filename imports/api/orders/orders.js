import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import { Items } from '../items/items.js';

export const Orders = new Mongo.Collection('orders', { idGeneration: 'MONGO' });

if (Meteor.isServer) {
	Meteor.publish('orders', function () {
		return Orders.find();
	});
}

Orders.schema = new SimpleSchema({
	requests: {
		type: [Object],
		minCount: 1
	},
	'requests.$.item_id': { type: String },
	'requests.$.quantity': { type: Number, min: 0, decimal: true },
	'requests.$.instructions': { type: String, optional: true },

	owner_id: { type: String },

	packed: { type: Boolean },
	packed_by_id: { type: String, optional: true },

	bundled: { type: Boolean },

	completed: { type: Boolean },
	completed_by_id: { type: String, optional: true },

	created_at: { type: Date },
	updated_at: { type: Date }
});
Orders.attachSchema(Orders.schema);

Orders.helpers({
	owner: function () {
		console.log(this.owner_id);
		console.log(Meteor.users.findOne({ _id: this.owner_id }));
		return Meteor.users.findOne({ _id: this.owner_id });
	},

	orderItems: function () {
		var item_ids = [];

		for (var item in this.requests) {
			if (this.requests.hasOwnProperty(item)) {
				item_ids.push(new Mongo.ObjectID(this.requests[item].item_id));
			}
		}

		return Items.find({ _id: { $in: item_ids } });
	},
	orderQuantityForItem: function (index) {
		return this.requests[index].quantity.toString();
	},
	orderInstructionsForItem: function (index) {
		return this.requests[index].instructions;
	}
});
