'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Roles } from 'meteor/alanning:roles';

import './users.html'
import './modalWindow.js'

if (Meteor.isClient) {
	FlowRouter.route('/users/', {
		name: 'users',
		action() {
			BlazeLayout.render('appBody', { main: 'users' });
		}
	});


}

Template.users.onCreated(function bodyOnCreated() {
	// this.state = new ReactiveDict();
	Meteor.subscribe('directory');
});

Template.users.events({
	'click .js-delete-user': function (event) {
		var $user = $(event.target).parents('.list-user').first();
		var userId = $user.data('id');


        var userObject = Meteor.users.findOne({ _id: userId });

        var userName = userObject.profile.name;
        var email = userObject.emails[0].address;

        var sdi = Meteor.commonFunctions.popupModal("Deleting User",
            "Are you sure you want to delete user " + userName +" (" + email + ")?  You cannot get them back afterwards."
        );
        var modalPopup = ReactiveModal.initDialog(sdi);

        // mcp the action when clicking OK (ie confirming the delete)
        modalPopup.buttons.ok.on('click', function(button){
        	//ebugger;
            // what needs to be done after click ok.
            sAlert.info ("Deleting " + email);

            // mcp and if doing copy and paste - this is what changes!
            $user.slideUp(150, function () {
                // When finished sliding
                Meteor.users.remove({ _id: userId });
                $(this).remove();
            });
        });

        modalPopup.show();


	},

	'click .js-approve-user': function (event) {
		var $user = $(event.target).parents('.list-user').first();
		var userId = $user.data('id');
		var userObject = Meteor.users.findOne({ _id: userId });


        var sdi = Meteor.commonFunctions.popupModal("Approving User",
            "Are you sure you want to approve " + userObject.emails[0].address + "?"
        );
        var modalPopup = ReactiveModal.initDialog(sdi);

        // mcp the action when clicking OK (ie confirming the delete)
        modalPopup.buttons.ok.on('click', function(button){
            //ebugger;
            // what needs to be done after click ok.
            sAlert.info ("Approved and sent approved email to " + userObject.emails[0].address);

            //noinspection JSUnresolvedVariable
            Roles.addUsersToRoles(userId, [userObject.profile.desired_role], Roles.GLOBAL_GROUP);

            Meteor.call('sendEmail',
                userObject.emails[0].address,
                CTOP_REDIRECT_EMAIL_FOR_TESTING,
                'Approved',
                'This email is confirming you are approved for Carrottop!');

        });

        modalPopup.show();

        //
	},
	'click .js-unapprove-user': function (event) {
		var $user = $(event.target).parents('.list-user').first();
		var userId = $user.data('id');
		var userObject = Meteor.users.findOne({ _id: userId });

        var sdi = Meteor.commonFunctions.popupModal("Approving User",
            "Are you sure you want to unapprove " + userObject.emails[0].address + "?"
        );
        var modalPopup = ReactiveModal.initDialog(sdi);

        // mcp the action when clicking OK (ie confirming the delete)
        modalPopup.buttons.ok.on('click', function(button){
            //ebugger;
            // what needs to be done after click ok.
            sAlert.info ("Unapproving " + userObject.emails[0].address);

            //noinspection JSUnresolvedVariable
            Roles.removeUsersFromRoles(userId, [userObject.profile.desired_role], Roles.GLOBAL_GROUP);

        });

        modalPopup.show();

        //


	},

	'click .js-edit-user': function (event) {
    	event.preventDefault();
        var $user = $(event.target).parents('.list-user').first();
        var userId = $user.data('id');


        Session.set('currentOverlayID', userId);
		Overlay.open('editUserOverlay', this);
	},

	'click .js-connect-user-to-robot': function (event) {
		var $user = $(event.target).parents('.list-user').first();
		var userId = $user.data('id');
		var userObject = Meteor.users.findOne({ _id: userId });

		var robotId;

		if (userObject.profile) {
			//noinspection JSUnresolvedVariable
			robotId = userObject.profile.food_robot_id || "";

			//noinspection JSUnresolvedVariable
			if (userObject.profile.food_robot_id === 0) {
				robotId = "0";
			}
		} else {
			robotId = "";
		}

		robotId = 1;
		//window.prompt('What is the robot ID for this user account?', robotId);
		if (robotId !== null) {
			robotId = parseInt(robotId);
			if (!isNaN(robotId)) {
				Meteor.users.update({_id: userId}, {$set: {'profile.food_robot_id': robotId}});
				Meteor.call('updateUserRemoteData', userObject, function (err, response) {
					if (err) console.error(err);
					console.log(response);
				});
				sAlert.info('Food robot ID set successfully!');
			} else {
				sAlert.info('An invalid (non-number) input was entered.');
			}
		}
	},

	'click .js-change-user-robot-connection': function (event) {
		var $user = $(event.target).parents('.list-user').first();
		var userId = $user.data('id');
		var userObject = Meteor.users.findOne({ _id: userId });

		var robotId;

		//noinspection JSUnresolvedVariable
		robotId = userObject.profile.food_robot_id || "";

		//noinspection JSUnresolvedVariable
		if (userObject.profile.food_robot_id === 0) {
			robotId = "0";
		}

		robotId = 1;
		//window.prompt('What is the new robot ID for this user account?', robotId);

		if (robotId !== null) {
			robotId = parseInt(robotId);
			if (!isNaN(robotId)) {
				Meteor.users.update({_id: userId}, {$set: {'profile.food_robot_id': robotId}});
				Meteor.call('updateUserRemoteData', userObject, function (err, response) {
					if (err) console.error(err);
					console.log(response);
				});
				sAlert.info('Food robot ID set successfully!');
			} else {
				sAlert.info('An invalid (non-number) input was entered.');
			}
		}
	}
});

Template.users.helpers({
	users() {
		return Meteor.users.find().fetch();
	},
	matchesCurrentUser(id) {
		return id == Meteor.userId();
	}
});
