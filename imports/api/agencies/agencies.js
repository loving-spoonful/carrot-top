/**
 * Created by mike on 2017-01-22.
 *
 * 19Sep2019 With MeatUp, there is only the 1 program (no longer supporting produce), so change default for
 * purchasing program to "M" as the option to select either program is now removed from add-agency-overlay.html
 *
 */

import {Mongo} from 'meteor/mongo';


export const Agencies = new Mongo.Collection('Agencies', {idGeneration: 'MONGO'});

if (Meteor.isServer) {

    Meteor.publish('Agencies', function () {
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

    purchasing_program: {
        type: String,
        defaultValue: 'M'
    },



});
Agencies.attachSchema(Agencies.schema);

