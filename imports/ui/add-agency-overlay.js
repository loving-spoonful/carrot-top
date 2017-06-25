/**
 * Created by mike on 2017-01-22.
 */
import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';

import { Agencies } from '../api/agencies/agencies.js';

import './add-agency-overlay.html'


Template.addAgencyOverlay.onCreated(function () {
	this.state = new ReactiveDict();

    Meteor.subscribe('Agencies');
});


// From agency, when they click on one, the ID for that entry is put into session
// fetch it on renderd.  If there is an ID - we are doing an update, so change the button and
// further below do an update rather than insert
// If it is an update, fetch info on that agency and populate fields
Template.addAgencyOverlay.rendered = function() {
    var Id = Session.get('currentOverlayID');
    if (Id == undefined) {
        $('button[name="agency_save_btn"]').text("Add");
    }
    else {
        var agencyObject = Agencies.findOne({_id: new Mongo.ObjectID(Id)});
        $('input[name="agency-name"]').val(agencyObject.name);
        $('input[name="delivery_instructions"]').val(agencyObject.delivery_instructions);
        $('input[name="primary_contact_name"]').val(agencyObject.primary_contact_name);
        $('select[name="purchasing_program"]').val(agencyObject.purchasing_program);

        $('input[name="primary_contact_email"]').val(agencyObject.primary_contact_email);
        $('input[name="primary_contact_phone"]').val(agencyObject.primary_contact_phone);

        $('input[name="street_address"]').val(agencyObject.street_address);
        $('input[name="city"]').val(agencyObject.city);
        $('input[name="google_maps_link"]').val(agencyObject.google_maps_link);


        $('button[name="agency_save_btn"]').text("Save");

    };
}

Template.addAgencyOverlay.events({
	'submit .form-add-agency': function (event) {
		event.preventDefault();

		// fetch all the fields from the page
		const target = event.target;
		const agencyName = target['agency-name'].value.trim();
		const deliverInstructions = target['delivery_instructions'].value.trim();
        const contactName = target['primary_contact_name'].value.trim();
        const contactEmail = target['primary_contact_email'].value.trim();
        const contactPhone = target['primary_contact_phone'].value.trim();
        const agencyAddress = target['street_address'].value.trim();
        const agencyCity = target['city'].value.trim();
        const agencyGoogleMapsLink = target['google_maps_link'].value.trim();
        const purchasingProgram = target['purchasing_program'].value.trim();

		if (agencyName.length > 0) {

		    // figure out if this is an update or an insert
            var agencyId = Agencies.findOne({name: agencyName}, {fields: {_id: 1}});
            // var rc = Agencies.findOne({name: agencyName});

            var Id = Session.get('currentOverlayID');

            // this Id is to determine if its an insert or update
            if (Id) {

                // we've searched on the new agency name - IF there is an agency with that name already
                // if the Id of what we're updating is NOT the same as the id of the existing agency
                // prevent the update from happening (i.e. only allow 1 agency with that name)
                if ((!agencyId) || ((agencyId) && (Id == agencyId._id))) {
                    // this is an update for THE existing agency

                    Agencies.update({_id: new Mongo.ObjectID(Id)},
                        {
                            $set: {
                                name: agencyName,
                                delivery_instructions: deliverInstructions,
                                primary_contact_name: contactName,
                                primary_contact_email: contactEmail,
                                primary_contact_phone: contactPhone,
                                street_address: agencyAddress,
                                city: agencyCity,
                                google_maps_link: agencyGoogleMapsLink,
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
                    sAlert.warning('This agency (' + agencyName + ') already exists!');
                }
            }
            else {
                    // there aleady exists and agency with this name
                    if (agencyId) {
                        sAlert.warning('This agency (' + agencyName + ') already exists!');
                    }
                    else {

                        var rc = Agencies.insert({
                            name: agencyName,
                            delivery_instructions: deliverInstructions,
                            primary_contact_name: contactName,
                            primary_contact_email: contactEmail,
                            primary_contact_phone: contactPhone,
                            street_address: agencyAddress,
                            city: agencyCity,
                            google_maps_link: agencyGoogleMapsLink,
                            purchasing_program: purchasingProgram,
                            created_at: Date.now(),
                            updated_at: Date.now()
                        });

                        Overlay.close();
                    }
                }

		} else {
			sAlert.warning('You must fill in all relevant fields in order to create your Agency.');
		}
	},
});

Template.addAgencyOverlay.helpers({
	agencies() {
		return Agency.find({}, { sort: { name: 1 } });
	}

});
