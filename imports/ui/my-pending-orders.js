import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';

import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';
import { Agencies } from '../api/agencies/agencies.js';
import './my-pending-orders.html'
import './modalWindow.js'
import './const.js'

if (Meteor.isClient) {
	FlowRouter.route('/my-pending-ordersM/', {
		name: 'my-pending-ordersM',
		action: function () {
				BlazeLayout.render('appBody', { main: 'myPendingOrders' });
		}
	});
    FlowRouter.route('/my-pending-ordersN/', {
        name: 'my-pending-ordersN',
        action: function () {
            BlazeLayout.render('appBody', { main: 'myPendingOrders' });
        }
    });
    FlowRouter.route('/my-completed-ordersM/', {
        name: 'my-completed-ordersM',
        action: function () {
            BlazeLayout.render('appBody', { main: 'myPendingOrders' });
        }
    });
    FlowRouter.route('/my-completed-ordersN/', {
        name: 'my-completed-ordersN',
        action: function () {
            BlazeLayout.render('appBody', { main: 'myPendingOrders' });
        }
    });

}

Template.myPendingOrders.onCreated(function bodyOnCreated() {
	this.state = new ReactiveDict();
	Meteor.subscribe('items');
	Meteor.subscribe('orders');
	Meteor.subscribe('order-bundles');

    Meteor.subscribe('Agencies');
    Meteor.subscribe('directory');

});


var agencySelected;
Template.myPendingOrders.events({
    'change #orderAsAgency': function (event) {
        event.preventDefault();

        var justID=event.target.value.split("\"");
        if ((agencySelected == undefined) && (justID[1] != undefined)) {
            agencySelected = justID[1];
            Blaze.renderWithData(Template.myPendingOrders, {},  $(".page")[0]);
        }
        else if (agencySelected != justID[1]) {
            agencySelected = justID[1];
            Blaze.renderWithData(Template.myPendingOrders, {},  $(".page")[0]);
        }
    },

    'click .js-cancel-order': function (event) {
        event.preventDefault();

        var $order = $(event.target).parents('.list-order').first();
        var orderId = $order.data('id');

        //
        var sdi = Meteor.commonFunctions.popupModal("Deleting Order", "Are you sure you want to delete this order? You cannot get it back afterwards.");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info("Deleting Order");

            // TODO do any data integrity checks (unless get RI into data model)
            // IF so, do not allow the delete and pop up a message.
            // Probably just do a find, and if it returns something - don't allow the remove

            $order.slideUp(150, function () {
                // When finished sliding

                var orderToDelete = Orders.findOne({_id: new Mongo.ObjectID(orderId)});

                // Loop through items to return the quantities ordered to their original amounts.
                for (var r in orderToDelete.requests) {
                    if (orderToDelete.requests.hasOwnProperty(r)) {
                        Items.update({
                            _id: new Mongo.ObjectID(orderToDelete.requests[r].item_id)
                        }, {
                            $inc: {quantity_amount: orderToDelete.requests[r].quantity},
                            $set: {updated_at: Date.now()}
                        });
                    }
                }

                Orders.remove({_id: new Mongo.ObjectID(orderId)});

                $(this).remove();

            });



            //
        });

        modalPopup.show();
    }

});

Template.myPendingOrders.helpers({
	items: function () {
		return Items.find({}, { sort: { updated_at: -1}});
	},
    getEmail: function (Id) {
        var itemObject;

        itemObject = Agencies.findOne({_id: new Mongo.ObjectID(Id) });
	    return itemObject.name;
	},
    allAgencies2: function() {
        var allagencies = Agencies.find({});

        return allagencies;
    },
	orders: function () {
        var orderStateParam = FlowRouter.getQueryParam("orderState");
        var programParam = FlowRouter.getQueryParam("program");

        if ((Roles.userIsInRole(Meteor.userId(), ['agency', 'agency'], Roles.GLOBAL_GROUP)) ) {
            // NOT an admin

            var x = Meteor.userId();
            var currentUser = Meteor.users.findOne({_id: x });

            if (orderStateParam == 'completed') {
                return Orders.find({
                    $and: [
                        {completed: true},
                        {purchasing_program: programParam},
                        //{owner_id: Meteor.userId()}
                        {agency_id: currentUser.profile.desired_agency}
                    ]
                }, {sort: {updated_at: -1}});
            }
            else {
                return Orders.find({
                    $and: [
                        {
                            $or: [
                                {completed: false},
                                {completed: null}
                            ]
                        },
                        {purchasing_program: programParam},
                        {agency_id: currentUser.profile.desired_agency}
//                        {owner_id: Meteor.userId()}
                    ]
                }, {sort: {updated_at: -1}});
            }
        }
        else {
            // an admin
            if (orderStateParam == 'completed') {
                if (agencySelected == undefined) {
                    return Orders.find({$and: [{completed: true}, {purchasing_program: programParam}]}, {sort: {updated_at: -1}});
                }
                else {
                    return Orders.find({$and: [{completed: true}, {purchasing_program: programParam}, {agency_id: agencySelected}]}, {sort: {updated_at: -1}});
                }
            }
            else {
                if (agencySelected == ALL) {
                    return Orders.find(
                        {$and:

                        [   {$or: [{completed: false},{completed: null}]}, {sort: {updated_at: -1}},
                            {purchasing_program: programParam}
                        ]
                        });
                }
                else {
                    return Orders.find(
                        {$and: [
                            {$or: [{completed: false},{completed: null}]}, {agency_id: agencySelected},  {purchasing_program: programParam}
                        ]},
                        {sort: {updated_at: -1}});
                }
            }
        }
	},
    isProduce() {
        var programParam = FlowRouter.getQueryParam("program");
        if (programParam == "N")
            return true;
        return false;
    },
    orderTitle() {
        var orderStateParam = FlowRouter.getQueryParam("orderState");
        var programParam = FlowRouter.getQueryParam("program");

        if (orderStateParam == "inprogress") {
            orderStateParam = "PENDING";
        }
        var isAdmin =Roles.userIsInRole(Meteor.userId(), ['admin', 'admin'], Roles.GLOBAL_GROUP);

        var title;
        if (programParam == "M") {
            title = orderStateParam + " Meat Orders";
        }
        else {
            title = orderStateParam + " Veggies Orders";
        }

        if (isAdmin) {
            return "All " + title;
        }
        else
            return title;
    },
    orderState: function () {
        var orderStateParam = FlowRouter.getQueryParam("orderState");

        if (orderStateParam == 'completed') {
            return true;
        }
        else {
            return false;
        }
    }
});
