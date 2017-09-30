import {Mongo} from 'meteor/mongo';

import {ItemCategories} from '../item-categories/item-categories.js';

/*
 *  porterm 30sep2017   add in quantity comments - which gets appended to email blast
 *                      useful for text like '40 per case'
 */
export const Items = new Mongo.Collection('items', {idGeneration: 'MONGO'});

if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('items', function () {
        return Items.find();
    });

}

Items.schema = new SimpleSchema({
    name: {type: String},

    quantity_amount: {type: Number, min: 0, decimal: true},
    quantity_units: {type: String},

    ordering_minimum: {type: Number, min: 0, decimal: true},
    ordering_maximum: {type: Number, min: 0.001, decimal: true},
    ordering_increment: {type: Number, min: 0, decimal: true},

    category_id: {type: String},

    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    },
    purchasing_program: {
        type: String,
        defaultValue: 'N'
    },
    supplier_id: {type: String, optional: true},
    price: {type: Number, decimal:true, optional: true},
    quantity_units_comments: {type: String, optional: true}

});
Items.attachSchema(Items.schema);

Items.helpers({
    category() {
        return ItemCategories.find({_id: this.category_id});
    }
});


Meteor.methods({

    // this method is an attempt to check for 'concurrent' orders where the inventory level goes below
    // being able to satisfy the second order coming in (this is essentially when there are 10 pounds of apples
    // and one agency orders 7 lbs, one orders 8 lbs - and between creating the order and submitting it
    // one of the two agencies gets their order, and there isn't enough left for the other.
    // updates based on anything other than the id has to be trusted and on the server side - so this will do
    // and update based on the original amount that was in the inventory
    updateItem: function (id, amount, purchasingProgram, i) {

        // for meat program, the amount of inventory is unlimited, so leave the value
        // unchanged
        if (purchasingProgram == "M") {
            amount = 0;
        }
        var itemToUpdate = Items.findOne({_id: new Mongo.ObjectID(id)});

        var updatedCount = Items.update(
            {$and: [{_id: new Mongo.ObjectID(id)}, {quantity_amount: {$gte: Number(amount)}}]},
            {
                $inc: {quantity_amount: -Number(amount)},
                $set: {purchasing_program: purchasingProgram},
                $set: {updated_at: new Date}
            },
        );

        // not the greatest but if the update isn't successful, return a negative value of the currentorder index (i)
        var castToInt;
        if (updatedCount == 0) {
            castToInt = -1 * Number(i) -1;
            console.log("returning " + castToInt);
            return castToInt;
        }
        castToInt = Number(i) + 1;
        console.log("returning " + castToInt);
        return castToInt;
    }
});
