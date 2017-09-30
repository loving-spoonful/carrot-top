'use strict';
import {Mongo} from 'meteor/mongo';

import { Template } from 'meteor/templating';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import { FlowRouter } from 'meteor/kadira:flow-router';
import { Roles } from 'meteor/alanning:roles';

import { Orders } from '../imports/api/orders/orders.js';

import { ItemCategories } from '../imports/api/item-categories/item-categories.js';
import { Items } from '../imports/api/items/items.js';
import { Agencies } from '../imports/api/agencies/agencies.js';
import { Suppliers } from '../imports/api/suppliers/suppliers.js';
import { News } from '../imports/api/news/news.js';

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
import '../imports/ui/agencies.js';
import '../imports/ui/suppliers.js';
import '../imports/ui/users.js';
import '../imports/ui/add-item-overlay.js';
import '../imports/ui/add-item-category-overlay.js';
import '../imports/ui/add-item-to-order-overlay.js';
import '../imports/ui/add-agency-overlay.js';
import '../imports/ui/user/edit-user-overlay.js';
import '../imports/ui/supplier/add-supplier-overlay.js';
import '../imports/ui/auth-page.js';
import '../imports/ui/admin.js';
import '../imports/ui/help.js';
import '../imports/ui/order/add-notes-to-order.js';


//
// 30Sep2017	Mike	 Adding in news import; adding in 'case' to the drop down for order items
//						This is to allow ordering a case of hamburgers if needed
//
Template.registerHelper('activePage', function (routeName) {
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
	return Roles.userIsInRole(id, [roles.trim().split(',')], Roles.GLOBAL_GROUP);
});
Template.registerHelper('userIsApproved', function (id) {
    return  !(Roles.getRolesForUser(id, Roles.GLOBAL_GROUP).length === 0);
});
Template.registerHelper('currentUserIsApproved', function () {

	var id = Meteor.userId();
    return  (Roles.userIsInRole(id, ['admin', 'admin'], Roles.GLOBAL_GROUP))
        || !(Roles.getRolesForUser(id, Roles.GLOBAL_GROUP).length === 0);
});

Template.registerHelper('currentUserIsAgencyInMeatProgram', function () {

    var id = Meteor.userId();
    var user = Meteor.users.findOne({_id: id});

    var isAdmin = Roles.userIsInRole(id, ['admin','admin'], Roles.GLOBAL_GROUP);
    if (isAdmin) {
    	return true;
	}

    var currentUser = Meteor.users.findOne({_id: id });

    var userAgency2 = Agencies.findOne(new Meteor.Collection.ObjectID(currentUser.profile.desired_agency));
    return (userAgency2.purchasing_program=="M");
});

Template.registerHelper('inArray', function (s, a){
	return a.indexOf(s) > -1;
});

Template.registerHelper('addressForOrder', function (orderID) {
	var orderObject = Orders.findOne({ _id: new Mongo.ObjectID(orderID) });
	var owner = Meteor.users.findOne({ _id: orderObject.owner_id });

	// may need some formatting to display nicely!
	return owner.profile.address; //.replace("\n", "<br>");
});

function distinct(collection, field) {
    return _.uniq(collection.find({}, {
            sort: {[field]: 1}, fields: {[field]: 1}
        }).map(x => x[field]), true);
};

Template.registerHelper('itemUnits', function () {
	return [
		{
			name: 'Mass and Weight',
			units: [
				{
					name: 'Pounds',
					symbol: 'lb',
					options: {
						selected: 'selected'
					}
				},
				{
					name: 'Ounces',
					symbol: 'oz',
					options: {}
				},
				{
					name: 'Kilograms',
					symbol: 'kg',
					options: {}
				},
				{
					name: 'Grams',
					symbol: 'g',
					options: {}
				}
			]
		},
		{
			name: 'Volume',
			units: [
				{
					name: 'Litres',
					symbol: 'L',
					options: {}
				},
				{
					name: 'Millilitres',
					symbol: 'mL',
					options: {}
				}
			]
		},
		{
			name: 'Other',
			units: [
				{
					name: 'Count',
					symbol: 'items',
					options: {}
				},
                {
                    name: 'Case',
                    symbol: 'case',
                    options: {}
                }
			]
		}
	];
});
