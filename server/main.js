'use strict';

import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {HTTP} from 'meteor/http'
import {Roles} from 'meteor/alanning:roles';
import '../lib/accounts.js'
import '../imports/api/item-categories/item-categories.js'
import '../imports/api/items/items.js'
import '../imports/api/orders/orders.js'
import '../imports/api/order-bundles/order-bundles.js'
import '../imports/api/agencies/agencies.js'
import '../imports/api/suppliers/suppliers.js'
import '../imports/ui/private/private-const.js'

Meteor.publish('directory', function () {
    return Meteor.users.find({}, {fields: {emails: 1, profile: 1, roles: 1}});
});



AccountsTemplates.configure({
    // localhost secretKey: "6LdnlBMUAAAAAMScf0hlWfTKHPZIBxhYQxQ3gG1A"

    reCaptcha: {
        secretKey: RECAPTCHA_SECRET_KEY

    }
});


Meteor.startup(() => {
    // code to run on server at startup
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    // set up connection info for sending email
    //    process.env.MAIL_URL = "smtp://" + CTOP_EMAIL_ACCOUNT + ":" + CTOP_EMAIL_PASSWORD + "@smtp.gmail.com:587/";
    process.env.MAIL_URL = "smtps://" + CTOP_EMAIL_ACCOUNT + ":" + CTOP_EMAIL_PASSWORD + "@" + CTOP_SMTP_SERVER + ":" + CTOP_SMTP_PORT + "/";

Meteor.methods({
    // the server side methods


    sendEmail: function (to, from, subject, text) {
        check([to, from, subject, text], [String]);

        // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();



        if (Boolean(CTOP_SEND_REAL_EMAILS)) {
            console.log("CTOP_SEND_REAL_EMAILS is true - sending real emails!");
        }
        else {
            console.log("CTOP_SEND_REAL_EMAILS is false; sending emails to " + CTOP_REDIRECT_EMAIL_FOR_TESTING + " instead.");
            subject = subject + ".  Would have sent to " + to;
            to = "ekim.retrop@gmail.com";

        }

        // at least initially, have all emails also get sent to food@lovingspoonful.org
        var toUsers = [];
        toUsers.push (to);
        toUsers.push ("food@lovingspoonful.org");


        Email.send({
            to: toUsers,
            from: from,

            subject: subject,
            text: text
        });
    },

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
})
;

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

if (Meteor.isServer) {
    Meteor.methods({
        getServerTime2: function () {
            var _time = (new Date).toTimeString();

            return _time;
        },
        getAgenciesList: function () {
            console.log(Agencies.find({}, {fields: {name: 1}}).fetch());
            return Agencies.find({}, {fields: {name: 1}}).fetch();
        }

    });
}
;
})
;
