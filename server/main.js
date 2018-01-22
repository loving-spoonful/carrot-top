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
import '../imports/api/news/news.js'
import '../imports/ui/private/private-const.js'

/*
 * 21Jan2018    mike    Adding in field for additional emails.  For some meat suppliers, the deliveries are
 *                      done by third parties rather than by the supplier.  For any suppliers like this
 *                      email both the supplier and these 3rd parties
 *                      For these suppliers, the field delivery_contact_email_list will be defined as a
 *                      semicolon separated list of emails (done via the supplier screen)
 *                      Adding in new method for sending emails (with a string of ; separated email addresses)
 *
 *  Mike    07Oct2017   added changeUserRole on server side.  Will need when fix issue where user registers as
 *                      one role, but picked the wrong one (or left it as select)
 *                      Added in methods to overload sending email - BCC emails, CC emails, etc
 *
 *  Mike    30sep2017   added changeUserRole on server side.  Will need when fix issue where user registers as a
 *                      volunteer, for example, but really wanted to be part of an agency.  Users window doesn't
 *                      properly allow the admin to fix this issue currently
 */
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
    changeUserRole: function (Id, newRole) {
        Roles.setUserRoles (Id, [newRole]);
    },
    sendBCCEmail: function (bcc, from, subject, text) {
      Meteor.call('sendFullEmail', undefined, from, undefined, bcc, subject, text, undefined);
    },
    sendEmail: function (to, from, subject, text) {
        Meteor.call('sendFullEmail', to, from, undefined, undefined, subject,text, undefined);
    },
    sendCCEmail: function (to, cc, from, subject, text) {
        Meteor.call('sendFullEmail', to, from, cc, undefined, subject,text, undefined);
    },
    sendEmailWithCCList: function (to, ccList, from, subject, text) {
        Meteor.call('sendFullEmail', to, from, undefined, undefined, subject,text, ccList);
    },
    sendFullEmail: function (to, from, cc, bcc, subject, text, ccList) {
        //check([to, from, subject, text], [String]);

        // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();


        // if there is a ccList, add cc to it and then set cc as ccList for the email
        if (ccList != undefined) {
            if (cc != undefined) {
                ccList.push(cc);
            }
            cc = ccList;
        }

        if (Boolean(CTOP_SEND_REAL_EMAILS)) {
            console.log("CTOP_SEND_REAL_EMAILS is true - sending real emails!");
        }
        else {
            console.log("CTOP_SEND_REAL_EMAILS is false; sending emails to " + CTOP_REDIRECT_EMAIL_FOR_TESTING + " instead.");
            if (to != undefined) {
                subject = subject + ".  Would have sent to " + to;
            }
            if (cc != undefined) {
                subject = subject + ".  CC of " + cc;
            }
            if (bcc != undefined) {
                subject = subject + ".  BCC of " + bcc;
            }

            to = CTOP_REDIRECT_EMAIL_FOR_TESTING;

        }


        var toBCCUsers = [];
        if (toBCCUsers != undefined) {
            toBCCUsers.push (bcc);
        }

        // always send all emails to food@lovingspoonful.org as a bcc
        toBCCUsers.push ("food@lovingspoonful.org");

        Email.send({
            to: to,
            cc: cc,
            bcc: toBCCUsers,
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
