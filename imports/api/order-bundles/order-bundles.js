import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';

import {Orders} from '../orders/orders.js'

export const OrderBundles = new Mongo.Collection('orderBundles', {idGeneration: 'MONGO'});

if (Meteor.isServer) {
    Meteor.publish('order-bundles', function () {
        return OrderBundles.find();
    });
}

OrderBundles.schema = new SimpleSchema({
    order_ids: {
        type: [String],
        minCount: 1
    },

    owner_id: {type: String},

    completed: {type: Boolean},
    purchasing_program: {type: String},
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    }
});
OrderBundles.attachSchema(OrderBundles.schema);

OrderBundles.helpers({
    owner: function () {
        return Meteor.users.findOne({_id: this.owner_id});
    },
    orderObjects: function () {
        var order_id_objects = [];
        for (var i in this.order_ids) {
            if (this.order_ids.hasOwnProperty(i)) {
                order_id_objects.push(new Mongo.ObjectID(this.order_ids[i]));
            }
        }
        return Orders.find({_id: {$in: order_id_objects}});
    },
    orderObjectsNotCompleted: function () {
        var order_id_objects = [];
        for (var i in this.order_ids) {
            if (this.order_ids.hasOwnProperty(i)) {
                order_id_objects.push(new Mongo.ObjectID(this.order_ids[i]));
            }
        }
        return Orders.find({$and: [
            {_id: {$in: order_id_objects}},
            {completed: false}
            ]});

    }
});
