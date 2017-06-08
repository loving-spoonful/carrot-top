/**
 * Created by mike on 2017-01-22.
 */
import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';

import { Suppliers } from '../../api/suppliers/suppliers.js';

import './add-supplier-overlay.html'


Template.addSupplierOverlay.onCreated(function () {
	this.state = new ReactiveDict();

    Meteor.subscribe('suppliers');
});


// From supplier, when they click on one, the ID for that entry is put into session
// fetch it on renderd.  If there is an ID - we are doing an update, so change the button and
// further below do an update rather than insert
// If it is an update, fetch info on that supplier and populate fields
Template.addSupplierOverlay.rendered = function() {
    var Id = Session.get('currentOverlayID');
    if (Id == undefined) {
        $('button[name="supplier_save_btn"]').text("Add");
    }
    else {
        var supplierObject = Suppliers.findOne({_id: new Mongo.ObjectID(Id)});
        $('input[name="supplier-name"]').val(supplierObject.name);
        $('input[name="delivery_instructions"]').val(supplierObject.delivery_instructions);
        $('input[name="primary_contact_name"]').val(supplierObject.primary_contact_name);
        $('select[name="purchasing_program"]').val(supplierObject.purchasing_program);

        $('input[name="primary_contact_email"]').val(supplierObject.primary_contact_email);
        $('input[name="primary_contact_phone"]').val(supplierObject.primary_contact_phone);

        $('input[name="street_address"]').val(supplierObject.street_address);
        $('input[name="city"]').val(supplierObject.city);
        $('input[name="google_maps_link"]').val(supplierObject.google_maps_link);


        $('button[name="supplier_save_btn"]').text("Save");

    };
}

Template.addSupplierOverlay.events({
	'submit .form-add-supplier': function (event) {
		event.preventDefault();

		// fetch all the fields from the page
		const target = event.target;
		const supplierName = target['supplier-name'].value.trim();
		// const deliverInstructions = target['delivery_instructions'].value.trim();
        const contactName = target['primary_contact_name'].value.trim();
        const contactEmail = target['primary_contact_email'].value.trim();
        const contactPhone = target['primary_contact_phone'].value.trim();
        const supplierAddress = target['street_address'].value.trim();
        const supplierCity = target['city'].value.trim();
        const supplierGoogleMapsLink = target['google_maps_link'].value.trim();
        const purchasingProgram = target['purchasing_program'].value.trim();

		if (supplierName.length > 0) {

		    // figure out if this is an update or an insert
            var supplierId = Suppliers.findOne({name: supplierName}, {fields: {_id: 1}});
            // var rc = Suppliers.findOne({name: supplierName});

            var Id = Session.get('currentOverlayID');

            // this Id is to determine if its an insert or update
            if (Id) {

                // we've searched on the new supplier name - IF there is an supplier with that name already
                // if the Id of what we're updating is NOT the same as the id of the existing supplier
                // prevent the update from happening (i.e. only allow 1 supplier with that name)
                if ((!supplierId) || ((supplierId) && (Id == supplierId._id))) {
                    // this is an update for THE existing supplier

                    Suppliers.update({_id: new Mongo.ObjectID(Id)},
                        {
                            $set: {
                                name: supplierName,
                                //delivery_instructions: deliverInstructions,
                                primary_contact_name: contactName,
                                primary_contact_email: contactEmail,
                                primary_contact_phone: contactPhone,
                                street_address: supplierAddress,
                                city: supplierCity,
                                google_maps_link: supplierGoogleMapsLink,
                                updated_at: Date.now(),
                                purchasing_program: purchasingProgram
                            }
                        });
                    sAlert.info('Saved!');

                    // clear the id from the session.
                    // also done on overlay.close, so should be pretty much cleaned out always
                    Session.set('currentOverlayID');
                    Overlay.close();
                }
                else {
                    // let them know, and keep them here to fix
                    sAlert.warning('This supplier (' + supplierName + ') already exists!');
                }
            }
            else {
                    // there aleady exists and supplier with this name
                    if (supplierId) {
                        sAlert.warning('This supplier (' + supplierName + ') already exists!');
                    }
                    else {

                        var rc = Suppliers.insert({
                            name: supplierName,
                            //delivery_instructions: deliverInstructions,
                            primary_contact_name: contactName,
                            primary_contact_email: contactEmail,
                            primary_contact_phone: contactPhone,
                            street_address: supplierAddress,
                            city: supplierCity,
                            google_maps_link: supplierGoogleMapsLink,
                            purchasing_program: purchasingProgram,
                            created_at: Date.now(),
                            updated_at: Date.now()
                        });

                        Overlay.close();
                    }
                }

		} else {
			sAlert.warning('You must fill in all relevant fields in order to create your Supplier.');
		}
	},
});

Template.addSupplierOverlay.helpers({
	suppliers() {
		return Supplier.find({}, { sort: { name: 1 } });
	}

});
