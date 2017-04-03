'use strict';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';
import { Agencies } from '../api/agencies/agencies.js';
import './const.js';
import './order.html';

if (Meteor.isClient) {
	FlowRouter.route('/order/', {
		name: 'order',
		action() {
					BlazeLayout.render('appBody', { main: 'order' });
		}
	});
}

Template.order.rendered = function() {
    if (Session.get(CURRENT_AGENCY)== undefined) {
        $('select[name="orderAsAgency"]').val("");
    }
    else {
        $('select[name="orderAsAgency"]').val("ObjectID(\"" + Session.get(CURRENT_AGENCY) + "\")");
    }
};

Template.order.onCreated(function bodyOnCreated() {
	Meteor.subscribe('directory');
	Meteor.subscribe('items');
	Meteor.subscribe('orders');
    Meteor.subscribe('agencies');

	if (!Session.get(CURRENT_ORDER_KEY)) { Session.set(CURRENT_ORDER_KEY, []); }


});

Template.order.events({
	'click .js-add-item': function (event) {
		event.preventDefault();

		Overlay.open('addItemToOrderOverlay', this);
	},

	'click .js-place-order': function (event) {
		event.preventDefault();

		// TODO: Additional verification around roles.
		if (Meteor.user()) {
            var agencyAlreadySelected;
		    if (Roles.userIsInRole(Meteor.userId(), ['admin', 'admin'], Roles.GLOBAL_GROUP)) {
                agencyAlreadySelected = Session.get(CURRENT_AGENCY);
                if (!agencyAlreadySelected) {
                    sAlert.error("As an admin, please select an agency to order for!");
                    return;
                }
            }
            else {
                var x = Meteor.userId();
                // x is the _id (maybe _id._str
                var currentUser = Meteor.users.findOne({_id: x });
		        agencyAlreadySelected = currentUser.profile.desired_agency;
            }
			var currentOrder = Session.get(CURRENT_ORDER_KEY);
			if (currentOrder.length <= 0) {
                sAlert.error('You must have at least one item in your order.');
				return;
            }


            //modal
            var sdi = Meteor.commonFunctions.popupModal("Placing Order", "Are you sure you want to complete and place this order?");
            var modalPopup = ReactiveModal.initDialog(sdi);
            var requests = [];
            var old_quantities = []; // TODO: Do some error handling to make sure item quantities don't get offset.
            modalPopup.buttons.ok.on('click', function (button) {
                // what needs to be done after click ok.
                sAlert.info("Placing Order");

            var originalLength = currentOrder.length;
            var itemsToStay = [];
                for (var i in currentOrder) {
                    if (currentOrder.hasOwnProperty(i)) {
                        var item = Items.findOne({ _id: new Mongo.ObjectID(currentOrder[i]._id._str) });
                        old_quantities.push({
                            id: currentOrder[i]._id._str,
                            quantity: item.quantity_amount
                        });

                        // Subtract off ordered amount from inventory amount.
                        // TODO: Somehow make sure this doesn't result in errors if 2 simultaneous updates happen.

                        // Mike: lift this idea from jpa/hibernate
                        // fetch the update timestamp first.  This gets set with every update
                        // in the update statement, include that as part of the 'where' condition
                        // If an update has happened in between fetching the timestamp and our update
                        // the update (ideally) should fail or return 0 (for no rows updated)

                        var updatedCount = Meteor.call('updateItem',
                            currentOrder[i]._id._str,
                            currentOrder[i].quantity,
                            i,
                            function(error, result) {
                                // 'result' is the method return value
                                // -1 is an error case when the amount would go less than zero
                                // this is essentially when there are 2 concurrent updates, or at least
                                // the case when someone else grabbed the last bit of the inventory
                                // before this person got to it
                                if (result <= 0) {
                                    result = Math.abs(result)-1;
                                    //modal
                                    var sdiInventoryShortage = Meteor.commonFunctions.popupOKModal("Inventory Shortage!", "It appears that inventory levels have changed for " + currentOrder[result].name + " since you placed this order.  Please edit and order less, or delete it and continue with other orders.");
                                    var modalPopupInventoryShortage = ReactiveModal.initDialog(sdiInventoryShortage);
                                    modalPopupInventoryShortage.show();
                                    itemsToStay.push(currentOrder[result]);
                                }
                                else {
                                    result = result - 1;
                                    requests.push({
                                         item_id: currentOrder[result]._id._str,
                                         quantity: currentOrder[result].quantity,
                                         instructions: currentOrder[result].instructions
                                    });

                                }

                                if (result+1==originalLength) {
                                    Orders.insert({
                                        requests: requests,
                                        owner_id: Meteor.user()._id,
                                        agency_id: agencyAlreadySelected,
                                        // packed: false,
                                        // packed_by_id: "",

                                        completed: false,
                                        completed_by_id: "",

                                        bundled: false,

                                        created_at: Date.now(),
                                        updated_at: Date.now()
                                    });

                                    if (itemsToStay.length > 0) {
                                        Session.set(CURRENT_ORDER_KEY,itemsToStay); //, itemsToStay);
                                        sAlert.info('Order partially placed!');
                                    }
                                    else {
                                        Session.set(CURRENT_ORDER_KEY,itemsToStay);
                                        sAlert.info('Order placed!');
                                    }
                                }


                            });

                    }
                }
            });

            modalPopup.show();
            //mcdal

		} else {
			sAlert('You must be logged in to place an order.');
		}
	},

    'change #orderAsAgency': function (event) {
        event.preventDefault();

        var justID=event.target.value.split("\"");
        Session.set(CURRENT_AGENCY, justID[1]);
    },

    'click .js-edit-order': function (event) {
        event.preventDefault();

        var currentOrder = Session.get(CURRENT_ORDER_KEY);

        var $orderItem = $(event.target).parents('.list-item').first();
        var orderItemIndex = parseInt($orderItem.data('index'));

		var Id = orderItemIndex;

        Session.set('currentOverlayID',Id);

        Overlay.open('addItemToOrderOverlay', this);
    },

	'click .js-delete-order': function (event) {
        event.preventDefault();

        var currentOrder = Session.get(CURRENT_ORDER_KEY);

		var $orderItem = $(event.target).parents('.list-item').first();
		var orderItemIndex = parseInt($orderItem.data('index'));

        var sdi = Meteor.commonFunctions.popupModal("Deleting Order", "Are you sure you want to delete this order? You cannot get it back afterwards and would have to reorder.");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info("Deleting Order");

            $orderItem.slideUp(150, function () {
                // When finished sliding

                if (currentOrder[orderItemIndex] !== undefined) {
                    currentOrder.splice(orderItemIndex, 1);
                    Session.set(CURRENT_ORDER_KEY, currentOrder);
                }

                $(this).remove();
            });
        });

        modalPopup.show();
	}
});

Template.order.helpers({
    agencySelected() {
        var currentOrder = Session.get(CURRENT_ORDER_KEY);
        var agencyAlreadySelected = Session.get(CURRENT_AGENCY);

        return ((agencyAlreadySelected != undefined) && (currentOrder.length > 0));
    },
    items() {
        return Items.find({}, {sort: {name: 1}});
    },
    currentOrder() {
        return Session.get(CURRENT_ORDER_KEY);
    },
    allAgencies() {
        return Agencies.find({}, {sort: {name: 1}});
    }
});

