import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';

import {Items} from '../items/items.js';

export const Orders = new Mongo.Collection('orders', {idGeneration: 'MONGO'});

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
    'requests.$.item_id': {type: String},
    'requests.$.quantity': {type: Number, min: 0, decimal: true},
    'requests.$.instructions': {type: String, optional: true},

    owner_id: {type: String},
    agency_id: {type: String},

    // no longer have a separate concept of 'packed' Mike March 2017
    //	packed: { type: Boolean },
    //	packed_by_id: { type: String, optional: true },

    bundled: {type: Boolean},

    loaded_notes: {type: String, optional: true},


    completed: {type: Boolean},
    completed_by_id: {type: String, optional: true},

    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    }
});
Orders.attachSchema(Orders.schema);

Orders.helpers({
    owner: function () {
        return Meteor.users.findOne({_id: this.owner_id});
    },

    orderItems: function () {
        var item_ids = [];

        for (var item in this.requests) {
            if (this.requests.hasOwnProperty(item)) {
                item_ids.push(new Mongo.ObjectID(this.requests[item].item_id));
            }
        }

        return Items.find({_id: {$in: item_ids}});
    },

    orderQuantityForItem: function (index) {
        return (Math.round(this.requests[index].quantity * 100) / 100).toString();
    },

    orderInstructionsForItem: function (index) {
        return this.requests[index].instructions;
    }
});
