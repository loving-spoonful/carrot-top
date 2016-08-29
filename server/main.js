'use strict';

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { HTTP } from 'meteor/http'
import { Roles } from 'meteor/alanning:roles';

import '../lib/accounts.js'

import '../imports/api/item-categories/item-categories.js'
import '../imports/api/items/items.js'
import '../imports/api/orders/orders.js'
import '../imports/api/order-bundles/order-bundles.js'

Meteor.publish('directory', function () {
	return Meteor.users.find({}, {fields: {emails: 1, profile: 1, roles: 1}});
});

Meteor.startup(() => {
	// code to run on server at startup

	Meteor.methods({
		updateUserRemoteData: function (user) {
			//noinspection JSUnresolvedVariable
			if (user.profile.food_robot_id) {
				//noinspection JSUnresolvedVariable
				const authEmail = process.env.ROBOT_AUTH_EMAIL;
				//noinspection JSUnresolvedVariable
				const authPassword = process.env.ROBOT_AUTH_PASSWORD;

				var robotAuthentication = HTTP.call(
					"POST",
					"https://robot.boulderfoodrescue.org/volunteers/sign_in.json",
					{
						params: {
							email: authEmail,
							password: authPassword
						}
					}
				);

				if (Roles.userIsInRole(user._id, ['agency'], Roles.GLOBAL_GROUP)) {
					//noinspection JSUnresolvedVariable
					var robotUserData = HTTP.call(
						"GET",
						"https://robot.boulderfoodrescue.org/locations/" + user.profile.food_robot_id.toString() + ".json",
						{
							params: {
								volunteer_email: authEmail,
								volunteer_token: robotAuthentication.data['authentication_token']
							}
						}
					);
					if (robotUserData) {
						Meteor.users.update({_id: user._id}, {$set: {"profile.address": robotUserData.data.address}});
					}
				}

				return true;
			}

			return false;
		}
	});

	if (Meteor.users.find().count() == 1) {
		var firstUser = Meteor.users.findOne();
		if (!Roles.userIsInRole(firstUser._id, ['admin'], Roles.GLOBAL_GROUP)) {
			Roles.addUsersToRoles(firstUser._id, ['admin'], Roles.GLOBAL_GROUP);
		}
	}

	Accounts.onCreateUser((options, user) => {
		// Make sure profile exists at the very least as a blank object.
		user.profile = options.profile ? options.profile : {};
		return user;
	});

	Accounts.validateNewUser(function (user) {
		if (user.profile) {
			//noinspection JSUnresolvedVariable
			if (user.profile.food_robot_id) {
				//noinspection JSUnresolvedVariable
				const authEmail = process.env.ROBOT_AUTH_EMAIL;
				//noinspection JSUnresolvedVariable
				const authPassword = process.env.ROBOT_AUTH_PASSWORD;

				var robotAuthentication = HTTP.call(
					"POST",
					"https://robot.boulderfoodrescue.org/volunteers/sign_in.json",
					{
						params: {
							email: authEmail,
							password: authPassword
						}
					}
				);

				if (user.profile.desired_role == 'agency') {
					//noinspection JSUnresolvedVariable
					var robotUserData = HTTP.call(
						"GET",
						"https://robot.boulderfoodrescue.org/locations/" + user.profile.food_robot_id.toString() + ".json",
						{
							params: {
								volunteer_email: authEmail,
								volunteer_token: robotAuthentication.data['authentication_token']
							}
						}
					);
					if (robotUserData) {
						Meteor.users.update({_id: user._id}, {$set: {"profile.address": robotUserData.data.address}});
					}
				}
			}
		} else {
			return false;
		}

		return true;
	});

	// Allow deleting users from the client side if they're not trying to delete themselves and they are an admin.
	Meteor.users.allow({
		remove: function (userId, doc) {
			return !!(Roles.userIsInRole(userId, ['admin'], Roles.GLOBAL_GROUP) && userId !== doc._id);
		},
		update: function (userId, doc) {
			return !!(Roles.userIsInRole(userId, ['admin'], Roles.GLOBAL_GROUP));
		}
	});
});
