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

/*
 * 23jun2019    mike    Changing system from 'Carrot Top' to the Meat Up; essentially rebranding, hiding any functionality
 *                      for the veggies side (I disabled rather than removed), removed volunteer role as it was
 *                      specific for veggies, added in terms and conditions to the registration process
*/

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
                CTOP_SMTP_SENDING_EMAIL_ACCOUNT,
                'Approved',
                'This email is confirming you are approved for the Meat Up!  \nTo sign in, visit meatup.lovingspoonful.org.'
			+ '\n\nTerms and Conditions for members of Loving Spoonful\'s Meat Up\n' +
                '\n' +
                'Becoming an agency partner in the Meat Up is open to any social service agency in Kingston and area who is helping to connect their clients with good food. Once approved as an agency partner, your organization will be granted access to the Meat Up (meatup.lovingspoonful.org), where you can purchase quality meat at an average of 50% of discount grocer prices from local suppliers: Wallace Beef, Quinn\'s Meats, and Pig & Olive Premium Meat, and occasionally other local farms. Loving Spoonful sends prices out at the end of each week, you submit you orders by 12 noon on Monday (or Tuesday in case of a statutory holiday), and deliveries are made by week\'s end. Suppliers will invoice you, and you pay them directly.\n' +
                '\n' +
                'This program is made possible by the generous commitment of local meat suppliers and Loving Spoonful to increasing access to healthy food in Kingston and area.\n' +
                '\n' +
                'On behalf of my organization, I agree that:\n' +
                '1.      I have the authority to purchase food products for my organization.\n' +
                '\n' +
                '2.      We will pay supplier invoices in a timely manner, within a maximum of 30 days of receipt.\n' +
                '\n' +
                '3.      We will ensure safe food handling practices are followed in the storage and preparation of the meat.\n' +
                '\n' +
                '4.      Our facilities where food is stored and prepared will be inspected by a local public health unit every 18 months, and we will continue to comply with all local requirements.\n' +
                '\n' +
                '5.      We will follow the rules and procedures set out in Ontario Regulation 493 (Food Premises) as well as the applicable requirements set out in the Health Protection and Promotion Act (RSO 1990, c. H.7, as amended). We acknowledge that we have read and understood O. Reg. 493 and the Health Protection and Promotion Act. A copy of O. Reg. 493 is available at https://www.ontario.ca/laws/regulation/R17493, and a copy of Ontario\'s Health Protection and Promotion Act is available at https://www.ontario.ca/laws/statute/90h07.\n' +
                '\n' +
                '6.      We will have a minimum of one staff or core volunteer certified in safe food handling physically on site during our operational hours (as set out in O. Reg. 493).\n' +
                '\n' +
                '7.      We will not sell or trade meat purchased through the Meat Up. If we ask any end-recipients for any form of payment, whether in the form of cash, goods or services, in exchange for this same purchased meat, it will be used solely for covering the cost of purchase.\n' +
                '\n' +
                '8.      We will distribute food in a fair, equitable, and dignified way and will not engage in discrimination, in offering this food, against any person because of race, colour, citizenship, religion, sex, national origin, ancestry, age, marital status, disability, sexual orientation, or gender identity.');

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
