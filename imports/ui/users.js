'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Roles } from 'meteor/alanning:roles';

import './users.html'

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

		if (window.confirm("Are you sure you want to delete this user? You cannot get them back afterwards.")) {
			$user.slideUp(150, function () {
				// When finished sliding
				Meteor.users.remove({ _id: userId });
				$(this).remove();
			});
		}
	},

	'click .js-approve-user': function (event) {
		var $user = $(event.target).parents('.list-user').first();
		var userId = $user.data('id');
		var userObject = Meteor.users.findOne({ _id: userId });

		if (window.confirm('Are you sure you want to approve this user?')) {
			//noinspection JSUnresolvedVariable
			Roles.addUsersToRoles(userId, [userObject.profile.desired_role], Roles.GLOBAL_GROUP);
		}
	},
	'click .js-unapprove-user': function (event) {
		var $user = $(event.target).parents('.list-user').first();
		var userId = $user.data('id');
		var userObject = Meteor.users.findOne({ _id: userId });

		if (window.confirm('Are you sure you want to unapprove this user?')) {
			//noinspection JSUnresolvedVariable
			Roles.removeUsersFromRoles(userId, [userObject.profile.desired_role], Roles.GLOBAL_GROUP);
		}
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

		robotId = window.prompt('What is the robot ID for this user account?', robotId);

		if (robotId !== null) {
			robotId = parseInt(robotId);
			if (!isNaN(robotId)) {
				Meteor.users.update({_id: userId}, {$set: {'profile.food_robot_id': robotId}});
				Meteor.call('updateUserRemoteData', userObject, function (err, response) {
					if (err) console.error(err);
					console.log(response);
				});
				alert('Food robot ID set successfully!');
			} else {
				alert('An invalid (non-number) input was entered.');
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

		robotId = window.prompt('What is the new robot ID for this user account?', robotId);

		if (robotId !== null) {
			robotId = parseInt(robotId);
			if (!isNaN(robotId)) {
				Meteor.users.update({_id: userId}, {$set: {'profile.food_robot_id': robotId}});
				Meteor.call('updateUserRemoteData', userObject, function (err, response) {
					if (err) console.error(err);
					console.log(response);
				});
				alert('Food robot ID set successfully!');
			} else {
				alert('An invalid (non-number) input was entered.');
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
