/**
 * Created by mike on 2017-01-22.
 *
 * 21Jan2018    mike    Adding in field for additional emails.  For some meat suppliers, the deliveries are
 *                      done by third parties rather than by the supplier.  For any suppliers like this
 *                      email both the supplier and these 3rd parties
 *                      For these suppliers, the field delivery_contact_email_list will be defined as a
 *                      semicolon separated list of emails (done via the supplier screen)
 *
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

    notes: {
        type: String,
        optional: true
    },

    delivery_contact_email_list: {
        type: String,
        optional: true
    },
});
Suppliers.attachSchema(Suppliers.schema);

