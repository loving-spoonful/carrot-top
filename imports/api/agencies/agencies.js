/**
 * Created by mike on 2017-01-22.
 */

import {Mongo} from 'meteor/mongo';


export const Agencies = new Mongo.Collection('Agencies', {idGeneration: 'MONGO'});

if (Meteor.isServer) {

    Meteor.publish('agencies', function getAllAgencies() {
        return Agencies.find();
    });
}


Agencies.schema = new SimpleSchema({
    name: {type: String, unique: true},
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    },
    delivery_instructions: {
        type: String
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

});
Agencies.attachSchema(Agencies.schema);

