/**
 * Created by mike on 2017-01-22.
 */

import {Mongo} from 'meteor/mongo';


export const Suppliers = new Mongo.Collection('Suppliers', {idGeneration: 'MONGO'});

if (Meteor.isServer) {

    Meteor.publish('Suppliers', function getAllSuppliers() {
        return Suppliers.find();
    });
}


Suppliers.schema = new SimpleSchema({
    name: {type: String, unique: true},
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    },
    primary_contact_name: {
        type: String
    },
    primary_contact_email: {
        type: String
    },
    primary_contact_phone: {
        type: 'tel'
    },
    street_address: {
        type: String
    },
    city: {
        type: String
    },

    google_maps_link: {
        type: String
    },

    purchasing_program: {
        type: String,
        defaultValue: 'M'
    },

});
Suppliers.attachSchema(Suppliers.schema);

