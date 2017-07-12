'use strict';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { AccountsTemplates } from 'meteor/useraccounts:core';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';
import { Agencies } from '../imports/api/agencies/agencies.js';
import '../imports/ui/modalWindow.js'
import { ItemCategories } from '../imports/api/item-categories/item-categories.js';
import '../imports/ui/private/private-const.js'


var myPreSubmitFunc = function(password, info) {
};



var mySubmitFunc = function(error, state){
    if (!error) {
        if (state === "signIn") {
            // Successfully logged in
            // ...
        }
        if (state === "signUp") {
            // Successfully registered
            // ...

            var sdi = Meteor.commonFunctions.popupOKModal("New Registered User!",
                "Thank you for registering " + Meteor.user().emails[0].address + ".  Your account must be approved prior to gaining access to the system."
                + "  The system administrator will attempt to approve your request within 24 hours."
            );
            var modalPopup = ReactiveModal.initDialog(sdi);

            modalPopup.show();

        }
    } else {
    	console.log(error);
	}
};


AccountsTemplates.configure({
	defaultTemplate: 'authPage',
	defaultLayout: 'appBody',
	defaultContentRegion: 'main',
	defaultLayoutRegions: {},
    onSubmitHook: mySubmitFunc,
    preSignUpHook: myPreSubmitFunc,
	showForgotPasswordLink: true,
	confirmPassword: true,

    reCaptcha: {
        siteKey: RECAPTCHA_SITE_KEY,

        theme: "light",
        data_type: "image"
    },

    showReCaptcha: true
});

if (Meteor.isServer) {
    var myPostLogout = function (userId, info) {
        //example redirect after logout

        var key = '_id';
        var value = userId;

        var selector = {};
        selector[key] = value;

        // send an smtp email to the administrator that a new user was requested.
        Meteor.call('sendEmail',
            CTOP_REDIRECT_EMAIL_FOR_TESTING,
            CTOP_SMTP_SENDING_EMAIL_ACCOUNT,
            'New User Registered',
            'You have received a new user request from ' + Meteor.users.findOne(selector).emails[0].address + '.\nVisit the Carrot TOP to review it at carrot.lovingspoonful.org'
            );


    };

    // so after the user has requested a new account, when they log out, call this method
    // this will fire off an email to the admin to approve the account
    AccountsTemplates.configure({
            postSignUpHook: myPostLogout
	});
};

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
	displayName: 'Your first and last name',
    placeholder: 'Your first and last name',
	required: true,
	trim: true,
    template: 'textInputWithHelp',
	options: {
		helpText: 'Enter in your first and last name.'
	}
});

AccountsTemplates.addField({
	_id: 'phone',
	type: 'tel',
	displayName: 'Phone number',
    placeholder: 'Phone number',
	required: true,
    template: 'textInputWithHelp',
	trim: true,
    options: {
        helpText: 'Enter the phone number you can be reached at most regularly.'
    }

});


AccountsTemplates.addField({
	_id: 'desired_role',
	type: 'select',
	displayName: 'Desired Role',
	select:
		[

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
			value: "admin",
		},
	],
	template: 'wrappedSelect',
    options: {
        helpText: 'Enter the role you which to enroll in CarrotTop.'
    }

});


AccountsTemplates.addField({
    _id: 'desired_agency',
    type: 'select',
    displayName: 'Agency',
    select: [
        {
            text: "--- Please Select An Agency ---",
            value: "SELECT",
        }
    ],

    required: true,

    template: 'wrappedSelect2',
    options: {
        helpText: 'If you are registering as an agency user, you must supply the agency you work for.'
    }
});





AccountsTemplates.addField({
	_id: 'food_robot_id',
	type: 'text',
	displayName: 'Food Robot ID',
	placeholder: 'Food Robot ID',
	template: 'textInputWithHelp',
	options: {
		helpText: 'Enter the user ID of your food robot account. If you don\'t know this, that\'s fine! An ' +
		'administrator will enter it for you.'
	}
});

