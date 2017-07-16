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
    'requests.$.priceAtTime': {type: Number, min: 0, decimal: true, optional: true},
    'requests.$.instructions': {type: String, optional: true},

    owner_id: {type: String},
    agency_id: {type: String},

    // really really lazy - should look it up from agency, but first go around
    // just pull it in
    purchasing_program: {
        type: String
    },
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
        // fixed by mike - code previously built up a list of ids
        // then queried doing $in
        // unfortunately, doing an in does not guarantee the order of insert
        // which is assumed by the html page - in some cases (noticed with an order of 3 items)
        // the instructions for the 1st and 3rd items were reversed; it could have been potentially
        // any ordering
        var listOfItems=[];

        for (var item in this.requests) {
            if (this.requests.hasOwnProperty(item)) {
                listOfItems.push (Items.findOne({_id: new Mongo.ObjectID(this.requests[item].item_id)}));
            }
        }

        // this does not guarantee the order of which the requests were inserted
        //        return Items.find({_id: {$in: item_ids}});
        return listOfItems;
    },

    orderQuantityForItem: function (index) {
        return (Math.round(this.requests[index].quantity * 100) / 100).toString();
    },
    orderTotalForItem: function (index) {
        var times100 = (Math.round(this.requests[index].quantity * this.requests[index].priceAtTime*100)).toString();

        return times100.substr(0, times100.length-2) + '.' + times100.substr(times100.length-2);
    },

    orderPriceForItem: function (index) {
        if (this.purchasing_program == 'M') {
            return (this.requests[index].priceAtTime).toString();
        }

    },

    orderInstructionsForItem: function (index) {
        return this.requests[index].instructions;
    }
});
