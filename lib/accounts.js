'use strict';

import { AccountsTemplates } from 'meteor/useraccounts:core';
import { Roles } from 'meteor/alanning:roles';

AccountsTemplates.configure({
	defaultTemplate: 'authPage',
	defaultLayout: 'appBody',
	defaultContentRegion: 'main',
	defaultLayoutRegions: {},

	showForgotPasswordLink: true,
	confirmPassword: true
});

AccountsTemplates.configureRoute('signIn', {
	name: 'signin',
	path: '/signin'
});

AccountsTemplates.configureRoute('signUp', {
	name: 'join',
	path: '/join'
});

AccountsTemplates.configureRoute('forgotPwd');

AccountsTemplates.configureRoute('resetPwd', {
	name: 'resetPwd',
	path: '/reset-password'
});

AccountsTemplates.addField({
	_id: 'name',
	type: 'text',
	displayName: 'Name',
	required: true,
	trim: true,
	template: 'textInputWithHelp',
	options: {
		helpText: 'If you\'re a volunteer, enter in your own name. If you\'re an agency, enter in the name of your ' +
		'agency.'
	}
});

AccountsTemplates.addField({
	_id: 'phone',
	type: 'tel',
	displayName: 'Phone',
	required: true,
	func: function (number) {
		if (Meteor.isServer) {
			//if (isValidPhone(number))
			return false; // meaning no error!
			//return true; // Validation error!
		}
	},
	errStr: 'Invalid phone number!',
	trim: true
});

AccountsTemplates.addField({
	_id: 'desired_role',
	type: 'select',
	displayName: 'Desired Role',
	select: [
		{
			text: "Volunteer",
			value: "volunteer",
		},
		{
			text: "Agency",
			value: "agency",
		},
		{
			text: "Administrator",
			value: "administrator",
		},
	],
	template: 'wrappedSelect'
});
AccountsTemplates.addField({
	_id: 'food_robot_id',
	type: 'text',
	displayName: 'Food Robot ID',
	placeholder: 'Food Robot ID',
	template: 'numberInputWithHelp',
	options: {
		helpText: 'Enter the user ID of your food robot account. If you don\'t know this, that\'s fine! An ' +
		'administrator will enter it for you.'
	}
});
