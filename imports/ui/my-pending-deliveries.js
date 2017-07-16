import { Template } from 'meteor/templating';
import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';
import { OrderBundles } from '../api/order-bundles/order-bundles.js';
import { Agencies } from '../api/agencies/agencies.js';
import './my-pending-deliveries.html'
import './modalWindow.js'

if (Meteor.isClient) {
	FlowRouter.route('/my-pending-deliveries/', {
		name: 'my-pending-deliveries',
		action: function () {
					BlazeLayout.render('appBody', { main: 'myPendingDeliveries' });
		}
	});
    FlowRouter.route('/my-completed-deliveries/', {
        name: 'my-completed-deliveries',
        action: function () {
            BlazeLayout.render('appBody', { main: 'myPendingDeliveries' });
        }
    });
}

Template.myPendingDeliveries.onCreated(function bodyOnCreated() {
	this.state = new ReactiveDict();
	Meteor.subscribe('directory');
	Meteor.subscribe('items');
	Meteor.subscribe('orders');
	Meteor.subscribe('order-bundles');
    Meteor.subscribe('Agencies');


});

var volunteerSelected;
Template.myPendingDeliveries.events({
    'change #deliveriesVolunteer': function (event) {
        event.preventDefault();

        var justID=event.target.value.split("\"");


        if ((volunteerSelected == undefined) && (justID[0] != undefined)) {
            volunteerSelected = justID[0];
            Blaze.renderWithData(Template.myPendingDeliveries, {},  $(".page")[0]);
        }
        else if (volunteerSelected != justID[0]) {
            volunteerSelected = justID[0];
            Blaze.renderWithData(Template.myPendingDeliveries, {},  $(".page")[0]);
        }
    },

	'click .js-cancel-order': function (event) {
        event.preventDefault();

        var $order = $(event.target).parents('.list-order').first();
		const orderId = $order.data('id');


		//modal
        var sdiCO = Meteor.commonFunctions.popupModal("Releasing Order", "Are you sure you want to release this order? It will remain in the unowned orders for " +
            "delivery section.");
        var modalPopupCO = ReactiveModal.initDialog(sdiCO);

        modalPopupCO.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Released Order!");

            // TODO do any data integrity checks (unless get RI into data model)
            // IF so, do not allow the delete and pop up a message.
            // Probably just do a find, and if it returns something - don't allow the remove
            $order.slideUp(150, function () {
                // When finished sliding

                var bundle = OrderBundles.findOne({ order_ids: orderId });
                const orderObject = Orders.findOne({ _id: new Mongo.ObjectID(orderId) });

                const orderIndex = bundle.order_ids.indexOf(orderId);

                if (orderIndex !== -1) {
                    bundle.order_ids.splice(orderIndex, 1);

                    if (bundle.order_ids.length === 0) {
                        OrderBundles.remove({ _id: bundle._id });
                    } else {
                        OrderBundles.update({ _id: bundle._id }, { $set: { order_ids: bundle.order_ids,  updated_at: Date.now() } });
                    }

                    Orders.update({ _id: orderObject._id }, { $set: {
                        bundled: false, updated_at: Date.now()
                    } });
                }
            });


        });
        modalPopupCO.show();

		//modal
	},

    'click .js-mark-one-complete': function (event) {
        event.preventDefault();


        var $order = $(event.target).parents('.list-order').first();
        var orderId = $order.data('id');


        //modal
        var sdi2 = Meteor.commonFunctions.popupModal("Completing this orders", "Are you sure you want to mark this delivery as complete?");
        var modalPopup2 = ReactiveModal.initDialog(sdi2);

        modalPopup2.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Completing!");

            $order.slideUp(150, function () {
                // When finished sliding
                Orders.update({ _id: new Mongo.ObjectID(orderId) }, {
                        $set: { completed: true, completed_by_id: Meteor.userId(),  updated_at: Date.now() }
                });
                var orderBundle = OrderBundles.findOne({ order_ids: orderId });

                var completedCount=0;
                var allOrdersCount=0;
                for (var o in orderBundle.order_ids) {
                    if (orderBundle.order_ids.hasOwnProperty(o)) {
                        var count = Orders.find({$and: [
                            {_id: new Mongo.ObjectID(orderBundle.order_ids[o])}, {completed:true}
                            ]}).count();

                        // count will be zero or one
                        completedCount=completedCount + count;

                        allOrdersCount = allOrdersCount + 1 ;

                    }
                }
                if (allOrdersCount == completedCount) {
                    // all orders are completed, complete the bundle
                    OrderBundles.update({ _id: orderBundle._id }, { $set: { completed: true,  updated_at: Date.now() }});

                }


                // let's send an email to the agency to let them know the order is coming!
                var thisOrder = Orders.findOne({ _id: new Mongo.ObjectID(orderId) });
                console.log("thisOrder " + thisOrder);
                var orderAgency = Agencies.findOne({_id: new Mongo.ObjectID(thisOrder.agency_id) });
                console.log("two orderagencyone " + orderAgency);
                var agencyEmail = orderAgency.primary_contact_email;
                console.log(" agencyEmail " + agencyEmail);
                var emailText = "One of our carrot top deliverers has prepared your order and will be delivering soon.  For details, please visit carrot.lovingspoonful.org.";
                Meteor.call('sendEmail',
                    agencyEmail,
                    CTOP_SMTP_SENDING_EMAIL_ACCOUNT,
                    'Delivering soon!',
                    emailText);

                $(this).remove();
            });


        });



        modalPopup2.show();

        //modal

    },
    'click .js-info-on-order': function (event) {
        event.preventDefault();

        var $order = $(event.target).parents('.list-order').first();
        var orderId = $order.data('id');
        var order = Orders.findOne({ _id: new Mongo.ObjectID(orderId) });
        var agencyForOrder = Agencies.findOne({_id: new Mongo.ObjectID(order.agency_id)});
        var agencyUser = Meteor.users.findOne({_id: order.owner_id});

        var sdiIO = Meteor.commonFunctions.popupOKModal("Delivery Info",
            "Deliver to " + agencyForOrder.name + " at " +
            agencyForOrder.street_address + ".  " +
            agencyForOrder.delivery_instructions + ". This was ordered by " +
            agencyUser.profile.name + " with email of " +
            agencyUser.emails[0].address);
            //"<a href=\"" + agencyForOrder.google_maps_link + "\">" );
        var modalPopupIO = ReactiveModal.initDialog(sdiIO);

        modalPopupIO.buttons.ok.on('click', function (button) {
        });
        modalPopupIO.show();

    },
	'click .js-mark-complete': function (event) {
        event.preventDefault();

        // Should only ever be one order order.
		var $orderBundle = $('.order-order').first();
		const orderBundleId = $orderBundle.data('id');

		//modal
        var sdiC = Meteor.commonFunctions.popupModal("Completing all orders", "Are you sure you want to mark all your pending deliveries as complete?");
        var modalPopupC = ReactiveModal.initDialog(sdiC);

        modalPopupC.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Completing!");

            // TODO do any data integrity checks (unless get RI into data model)
            // IF so, do not allow the delete and pop up a message.
            // Probably just do a find, and if it returns something - don't allow the remove

            $orderBundle.slideUp(150, function () {
                // When finished sliding
                OrderBundles.update({ _id: new Mongo.ObjectID(orderBundleId) }, { $set: { completed: true,  updated_at: Date.now() }});
                var completedOrderBundle = OrderBundles.findOne({ _id: new Mongo.ObjectID(orderBundleId) });

                for (var o in completedOrderBundle.order_ids) {
                    if (completedOrderBundle.order_ids.hasOwnProperty(o)) {
                        Orders.update({ _id: new Mongo.ObjectID(completedOrderBundle.order_ids[o]) }, {
                            $set: { completed: true, completed_by_id: Meteor.userId(),  updated_at: Date.now() }
                        });
                    }
                }

                // TODO: File pickup report

                $(this).remove();
            });


        });
        modalPopupC.show();

		//modal


	}
});

Template.myPendingDeliveries.helpers({
	items: function () {
		return Items.find({}, { sort: { name: 1 } });
	},
    allVolunteers: function() {
        var allvolunteers = Meteor.users.find(
                                            {
                                                $or: [
                                                    {'profile.desired_role': 'volunteer'},
                                                    {'profile.desired_role': 'administrator'}
                                                ]
                                            });

        return allvolunteers;
    },

	orderBundles: function () {

        var params = FlowRouter.getQueryParam("deliveryState");

        if ((Roles.userIsInRole(Meteor.userId(), ['admin', 'admin'], Roles.GLOBAL_GROUP)) ) {
            if (params == 'completed') {
                if (volunteerSelected == 'All') {
                    var x;
                    x = OrderBundles.find({completed: true}); //,{sort: {updated_at: -1}});
                    return x;
                }
                else
                    return OrderBundles.find({owner_id: volunteerSelected, completed: true},{sort: {updated_at: -1}});
            }
            else {
                if (volunteerSelected == 'All')
                    return OrderBundles.find({completed: false}); //,{sort: {updated_at: -1}});
                else
                    return OrderBundles.find({owner_id: volunteerSelected, completed: false},{sort: {updated_at: -1}});

            }
        }
        else {
            if (params == 'completed') {
                return OrderBundles.find({owner_id: Meteor.userId(), completed: true},{sort: {updated_at: -1}});
            }
            else {
                return OrderBundles.find({owner_id: Meteor.userId(), completed: false}, {sort: {updated_at: -1}});

            }
        }

	},
    firstLetter: function (someString) {
        var fooText = someString.substring(0,1);
        return new Spacebars.SafeString(fooText)
    },
    getEmail: function (Id) {
        var itemObject;
        itemObject = Agencies.findOne({_id: new Mongo.ObjectID(Id) });
        return itemObject.name;
    },
    getGoogleMapsLink: function (Id) {
        var order = Orders.findOne({ _id: Id});
        var agencyForOrder = Agencies.findOne({_id: new Mongo.ObjectID(order.agency_id)});

        return agencyForOrder.google_maps_link;

    },
    deliveryCompleted: function () {
        var params = FlowRouter.getQueryParam("deliveryState");

        if (params == 'completed') {
            return true;
        }
        else {
            return false;
        }
    },
	orderBundlesExist: function () {
		return OrderBundles.find({ owner_id: Meteor.userId(), completed: false }).count() > 0;
	}

});
