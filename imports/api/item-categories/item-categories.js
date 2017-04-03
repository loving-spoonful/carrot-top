import {Mongo} from 'meteor/mongo';


export const ItemCategories = new Mongo.Collection('itemCategories', {idGeneration: 'MONGO'});

if (Meteor.isServer) {
    Meteor.publish('item-categories', function itemsPublication() {
        return ItemCategories.find();
    });
}

ItemCategories.schema = new SimpleSchema({
    name: {type: String, unique: true},
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    }
});

ItemCategories.attachSchema(ItemCategories.schema);

