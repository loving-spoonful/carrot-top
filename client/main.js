'use strict';

import { Template } from 'meteor/templating';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import { FlowRouter } from 'meteor/kadira:flow-router';
import { Roles } from 'meteor/alanning:roles';

import { Orders } from '../imports/api/orders/orders.js';

import '../lib/accounts.js'

import '../imports/ui/overlay.js';
import '../imports/ui/nav.js';
import '../imports/ui/app-body.js';

import '../imports/ui/home.js';
import '../imports/ui/order.js';
import '../imports/ui/pending-packing.js';
import '../imports/ui/pending-delivery.js';
import '../imports/ui/my-pending-orders.js';
import '../imports/ui/my-pending-deliveries.js';
import '../imports/ui/inventory.js';
import '../imports/ui/categories.js';
import '../imports/ui/users.js';

import '../imports/ui/add-item-overlay.js';
import '../imports/ui/add-item-category-overlay.js';
import '../imports/ui/add-item-to-order-overlay.js';

import '../imports/ui/auth-page.js';
import '../imports/ui/admin.js';

Template.registerHelper('activePage', function (routeName) {
	// includes Spacebars.kw but that's OK because the route name ain't that.
	return _.include(arguments, FlowRouter.getRouteName()) && 'active';
});

Template.registerHelper('formattedDate', function (date) {
	if (date) {
		var monthNames = [
			"January", "February", "March",
			"April", "May", "June", "July",
			"August", "September", "October",
			"November", "December"
		];
		return date.getHours() + ":" + ("0" + date.getMinutes()).slice(-2) + " " + monthNames[date.getMonth()] + " "
			+ date.getDate() + ", " + date.getFullYear();
	}
});

Template.registerHelper('dumpObject', function (object) {
	if (typeof object == 'object') {
		console.log(object);
		return JSON.stringify(object);
	}
});

Template.registerHelper('fixFloat', function (n) {
	return (Math.round(n * 100) / 100).toString();
});

Template.registerHelper('userInRole', function (role) {
	// admin role always gets permissions to everything
	if (Roles.userIsInRole(Meteor.userId(), [role, 'admin'], Roles.GLOBAL_GROUP)) {
		return true;
	}
});
Template.registerHelper('userIdInRole', function (id, roles) {
	return !!Roles.userIsInRole(id, [roles.trim().split(',')], Roles.GLOBAL_GROUP);
});
Template.registerHelper('userIsApproved', function (id) {
	return !(Roles.getRolesForUser(id, Roles.GLOBAL_GROUP).length === 0);
});

Template.registerHelper('inArray', function (s, a){
	return a.indexOf(s) > -1;
});

Template.registerHelper('addressForOrder', function (orderID) {
	var orderObject = Orders.findOne({ _id: new Mongo.ObjectID(orderID) });
	var owner = Meteor.users.findOne({ _id: orderObject.owner_id });

	return owner.profile.address.replace("\n", "<br>");
});
