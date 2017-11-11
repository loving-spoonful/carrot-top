import {Template} from 'meteor/templating';
import {Mongo} from 'meteor/mongo';

import {Agencies} from '../../api/agencies/agencies.js';

import './edit-user-overlay.html'

/*
 * mike     08nov2017   correct the code to allow the admin to reassign a role to someone
 *                      this is typically when someone doesn't select a role, or picks a role
 *                      other than what they wanted.  Previously it was setting preferred_role,
 *                      now it properly calls the meteor roles.setrole
 */

Template.editUserOverlay.onCreated(function () {
    this.state = new ReactiveDict();

    Meteor.subscribe('directory');
    Meteor.subscribe('Agencies');
});

// like all other overlays - fetch the session id, retrieve the record (if exists) and fill in fields
// if id doesn't exist, this is a new insert vs update
// And - for user - this overlay 'could' create a new user, but it is meant solely for editing.
Template.editUserOverlay.rendered = function () {
    var Id = Session.get('currentOverlayID');
    if (Id == undefined) {
        $('button[name="agency_save_btn"]').text("ERROR!!!");
    }
    else {

        var userObject = Meteor.users.findOne({_id: Id});

        $('input[name="email"]').val(userObject.emails[0].address);

        $('input[name="first_and_last_name"]').val(userObject.profile.name);

        $('input[name="phone_number"]').val(userObject.profile.phone);
        $('select[name="role"]').val(userObject.profile.desired_role);
        $('select[name="agency"]').val(userObject.profile.desired_agency);
        $('input[name="robot_id"]').val(userObject.profile.food_robot_id);

        $('button[name="user_save_btn"]').text("Save");

    };
}

Template.editUserOverlay.events({
    'submit .form-edit-user': function (event) {
        event.preventDefault();

        // fetch all the values from the window
        const target = event.target;
        const email = target['email'].value.trim();
        const first_and_last_name = target['first_and_last_name'].value.trim();
        const phone_number = target['phone_number'].value.trim();
        const role = target['role'].value.trim();
        var agency;
        const robot_id = target['robot_id'].value.trim();

        if (target['agency'] == undefined) {
            agency = undefined;
        }
        else {
            agency = target['agency'].value.trim();
        }

        if (email.length > 0) {
            // look to see if this is updating the same user
            var possibleExistingId = Meteor.users.findOne({"emails.address": email}, {fields: {_id: 1}});

            var Id = Session.get('currentOverlayID');
            var userObject = Meteor.users.findOne({_id: Id});
            if (Id) {
                if ((!possibleExistingId) || ((possibleExistingId) && (Id == possibleExistingId._id))) {
                    // this is an update for the same existing user

                    //Roles.removeUsersFromRoles(Id, userObject.desired_role);
                    Meteor.users.update({_id: Id},
                        {
                            $set: {
                                'emails.0.address': email,
                                'profile.name': first_and_last_name,
                                'profile.phone': phone_number,

                                'profile.desired_role': role,
                                'profile.desired_agency': agency,

                                'profile.food_robot_id': robot_id
                            }
                        });
                    Roles.setUserRoles(Id, [role], Roles.GLOBAL_GROUP);
                    sAlert.info('Saved!');
                    Session.set('currentOverlayID');
                    Overlay.close();
                }
                else {
                    sAlert.warning('This email address (' + email + ') already exists!');
                }
            }
            else {
                sAlert.warning('SHOULD NEVER GET HERE');
                Overlay.close();
            }

        } else {
            sAlert.warning('You must fill in all relevant fields in order to edit the user.');
        }
    },
});

Template.editUserOverlay.helpers({
    AgencyList() {
        return Agencies.find({}, {sort: {name: 1}});
    },
    isAgency() {

        var Id = Session.get('currentOverlayID');
        if (Id == undefined) {
            return false;
        }
        var userObject = Meteor.users.findOne({_id: Id});
        return (userObject.profile.desired_role == "agency");
    }

});
