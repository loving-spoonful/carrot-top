import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker'

import { Items } from '../api/items/items.js';
import { Orders } from '../api/orders/orders.js';
import { Agencies } from '../api/agencies/agencies.js';
import { OrderBundles } from '../api/order-bundles/order-bundles.js';
import { Suppliers } from '../api/suppliers/suppliers.js';

import './pending-delivery.html'
import './modalWindow.js'

if (Meteor.isClient) {
	FlowRouter.route('/pending-delivery/', {
        name: 'pending-delivery',
        action: function () {
            BlazeLayout.render('appBody', { main: 'pendingDelivery' });
        }
    });
    FlowRouter.route('/completeMeatOrder/', {
        name: 'completeMeatOrder',
        action: function () {
            BlazeLayout.render('appBody', { main: 'pendingDelivery' });
        }
    });
}

Template.pendingDelivery.onCreated(function bodyOnCreated() {
	this.state = new ReactiveDict();
	Meteor.subscribe('directory');
	Meteor.subscribe('items');
	Meteor.subscribe('orders');
	Meteor.subscribe('order-bundles');
	Meteor.subscribe('Agencies');
    Meteor.subscribe('Suppliers');
});

function MeatOrderDetails (amount, quantity_units, agency_id) {
    this.amount = amount;
    this.quantity_units = quantity_units;
    this.agency = Agencies.findOne({_id: new Mongo.ObjectID(agency_id)});

}

MeatOrderDetails.prototype.getAmount = function() {
    return this.Amount;
};
MeatOrderDetails.prototype.incrementAmount = function(amount) {
    this.amount = this.amount + amount;
};
MeatOrderDetails.prototype.getAgencyName = function() {
    return this.agency.name;
};
MeatOrderDetails.prototype.getAgencyEmail = function() {
    return this.agency.primary_contact_email;
};
MeatOrderDetails.prototype.getAgencyId = function() {
    return this.agency._id;
};

var assignedVolunteer;
Template.pendingDelivery.events({
    'change #assignVolunteer': function (event) {
        event.preventDefault();
        // capture the volunteer that's selected from the drop down list
        var justID=event.target.value.split("\"");
        assignedVolunteer = justID[0];
    },

	'click .js-cancel-order': function (event) {
        event.preventDefault();
		var $order = $(event.target).parents('.list-order').first();
		var orderId = $order.data('id');

		// modal
        var sdi = Meteor.commonFunctions.popupModal("Deleting Order", "Are you sure you want to delete this order? You cannot get it back afterwards.");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Deleting order");

            // TODO do any data integrity checks (unless get RI into data model)
            // IF so, do not allow the delete and pop up a message.
            // Probably just do a find, and if it returns something - don't allow the remove

            $order.slideUp(150, function () {
                // When finished sliding

                var orderToDelete = Orders.findOne({ _id: new Mongo.ObjectID(orderId) });

                // Loop through items to return the quantities ordered to their original amounts.
                for (var r in orderToDelete.requests) {
                    if (orderToDelete.requests.hasOwnProperty(r)) {
                        Items.update({
                            _id: new Mongo.ObjectID(orderToDelete.requests[r].item_id)
                        }, {
                            $inc: { quantity_amount: orderToDelete.requests[r].quantity },
                            $set: { updated_at: Date.now()  }
                        });
                    }
                }

                Orders.remove({ _id: new Mongo.ObjectID(orderId) });

                $(this).remove();
            });


        });
        modalPopup.show();

		// modal
	},

    'click .js-assign-order': function (event) {
        event.preventDefault();

        // modal
        var sdi = Meteor.commonFunctions.popupModal("Assigning Order", "Are you sure you want to assign this order?");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Assigning order");
            // apologize for c&p programming - do it once, great.  second time copy is 'ok'
            // 3rd time refactor.  Need to get this done, 11:30 at night before trying to get this
            // live in march 2017.  Fix this mike sometime!  TODO refactor!
            var $order = $(event.target).parents('.list-order').first();
            var orderId = $order.data('id');

            var existingBundle = OrderBundles.findOne({ owner_id: assignedVolunteer, completed: false });

            if (existingBundle) {
                // Bundle already exists, order should be added to it.

                if (existingBundle.order_ids.indexOf(orderId) === -1) {
                    OrderBundles.update({
                        _id: new Mongo.ObjectID(existingBundle._id._str)
                    }, {
                        $push: { order_ids: orderId },
                        $set: { updated_at: Date.now() }
                    });
                } else {
                    // TODO: Handle order already being in a order.
                }
            } else {
                OrderBundles.insert({
                    order_ids: [ orderId ],
                    owner_id: assignedVolunteer,
                    completed: false,
                    purchasing_program: "N",
                    created_at: Date.now(),
                    updated_at: Date.now()
                });
            }

            $order.slideUp(150, function () {
                // When finished sliding

            Orders.update({ _id: new Mongo.ObjectID(orderId) }, { $set: { bundled: true, updated_at: Date.now() } });
            $(this).remove();
            });

        });


        modalPopup.show();
        // modal

    },

    'click .js-add-notes-to-order': function (event) {
        event.preventDefault();

        var $order = $(event.target).parents('.list-order').first();
        var Id = $order.data('id');

        Session.set('currentOverlayID',Id);
        Overlay.open('addNotesToOrderOverlay', this);

    },

	'click .js-take-responsibility': function (event) {
        event.preventDefault();

        // modal
        var sdi = Meteor.commonFunctions.popupModal("Take Responsibility For This Order", "Are you sure you want to take responsibility for this order?");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Assigning order to you!");
            var $order = $(event.target).parents('.list-order').first();
            var orderId = $order.data('id');

            var existingBundle = OrderBundles.findOne({ owner_id: Meteor.userId(), completed: false });

            if (existingBundle) {
                // Bundle already exists, order should be added to it.

                if (existingBundle.order_ids.indexOf(orderId) === -1) {
                    OrderBundles.update({
                        _id: new Mongo.ObjectID(existingBundle._id._str)
                    }, {
                        $push: { order_ids: orderId },
                        $set: { updated_at: Date.now() }
                    });
                } else {
                    // TODO: Handle order already being in a order.
                }
            } else {
                OrderBundles.insert({
                    order_ids: [ orderId ],
                    owner_id: Meteor.userId(),
                    completed: false,
                    purchasing_program: "N",
                    created_at: Date.now(),
                    updated_at: Date.now()
                });
            }

            $order.slideUp(150, function () {
                // When finished sliding

                Orders.update({ _id: new Mongo.ObjectID(orderId) }, { $set: { bundled: true,  updated_at: Date.now() } });
                $(this).remove();
            });
        });
        modalPopup.show();

        // modal

	},
    'click .js-submit-meat-order': function (event) {
        event.preventDefault();

        var firstTime = true;

        // to do #1 - fetch list of suppliers and add supplierid
        // this is with push
        var allSuppliers=[];

        Suppliers.find({purchasing_program: "M"}, {sort: {_id:-1}}).
        forEach(function(obj){
            allSuppliers.push(obj._id._str);
        });

        // to do #2 this will create an array of arrays - will have an
        // entry for each of the suppliers
        var ordersForSuppliersList = [];
        for (var i=0; i< allSuppliers.length; i++) {
            ordersForSuppliersList[i] = [];
        }

        var $order = Orders.find({
            $and: [
                {
                    $or: [
                        { completed: false },
                        { completed: null }
                    ]
                },
                {
                    $or: [
                        { bundled: false },
                        { bundled: null }
                    ]
                },
                {purchasing_program: "M"}
            ]
        }, { sort: { updated_at: -1 } }).forEach(function(currentObject){

            r = currentObject.requests;
            r.forEach(function(currentRequest) {
                var itemid = currentRequest.item_id;

                var meatOrderDetails = new MeatOrderDetails(currentRequest.quantity, currentObject.agency_id);
                var myagency = Agencies.findOne({_id: new Mongo.ObjectID(currentObject.agency_id)});

                var myItem = Items.findOne({_id: new Mongo.ObjectID(currentRequest.item_id)});
                var meatOrderDetails = new MeatOrderDetails(currentRequest.quantity, myItem.quantity_units, currentObject.agency_id);
                var sup = myItem.supplier_id;

                var supplierIndex = allSuppliers.indexOf(sup);

                // let's see if an agency submitted more than 1 order for a particular meat product

                var foundMatch = false;
                for (var i=0; i < ordersForSuppliersList[supplierIndex].length; i++) {
                    var w = ordersForSuppliersList[supplierIndex][i];
                    if (w.getAgencyId()._str == currentObject.agency_id) {
                        w.incrementAmount(currentRequest.quantity);
                        foundMatch = true;

                    }
                }
                if (foundMatch == false) {
                    ordersForSuppliersList[supplierIndex].push(meatOrderDetails);
                }

            });

            if (firstTime) {
                OrderBundles.insert({
                    order_ids: [currentObject._id._str],
                    owner_id: Meteor.userId(),
                    completed: false,
                    purchasing_program: "M",
                    created_at: Date.now(),
                    updated_at: Date.now()
                });
                firstTime = false;
            }
            else {
                var existingBundle = OrderBundles.findOne({ owner_id: Meteor.userId(), completed: false, purchasing_program: "M" });
                OrderBundles.update({
                    _id: new Mongo.ObjectID(existingBundle._id._str)
                }, {
                    $push: { order_ids: currentObject._id._str },
                    $set: { updated_at: Date.now() }
                    //$set: { updated_at: Date.now(), completed: true }
                });

            }
            Orders.update({ _id: (currentObject._id) }, {
                $set: {
                    completed_by_id: Meteor.userId(),
                    // completed: true,
                    // bundled: true,
                    updated_at: Date.now()
                }
            });
        })

        var emailString = [allSuppliers.length];

        for (var i =0; i <allSuppliers.length; i++) {
            debugger;
            var currentSupplier = Suppliers.findOne({_id: new Mongo.ObjectID(allSuppliers[i])});
            var emailOfSupplier = currentSupplier.primary_contact_email;
            var contactNameOfSupplier =  currentSupplier.primary_contact_name;
            var nameOfSupplier = currentSupplier.name;

            var emailToAgencies = [ordersForSuppliersList[i].length];
            emailString = "emailto: " + emailOfSupplier
                + "\nDear " + contactNameOfSupplier + " of " + nameOfSupplier
                + "\nOrders:";

            for (var j=0; j<ordersForSuppliersList[i].length; j++) {
                emailToAgencies[j] = ordersForSuppliersList[i][j].getAgencyEmail();
                var currentOrder = ordersForSuppliersList[i][j];
                emailString = emailString + "\n"
                    + (j+1) + ". "
                    + currentOrder.agency.primary_contact_name + " of " + currentOrder.agency.name
                    + "\nEmail: " + currentOrder.getAgencyEmail()
                    + "\nAmount of " + currentOrder.amount + " " + currentOrder.quantity_units;

            }
            debugger;
            Meteor.call('sendEmail',
                "mike__porter@hotmail.com",
                CTOP_REDIRECT_EMAIL_FOR_TESTING,
                'Meat Order',
                emailString);

        }

        //modal
        var sdi = Meteor.commonFunctions.popupModal("Submit Meat Order", "Is it already monday at noon?  If you are ready, click ok to submit meat orders to the suppliers.");

        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Submitting meat orders!");

            $order.slideUp(150, function () {
                // When finished sliding



                $(this).remove();
            });
        });
        modalPopup.show();
        //modal
    },
	'click .js-complete-order': function (event) {
        event.preventDefault();

        var $order = $(event.target).parents('.list-order').first();
		var orderId = $order.data('id');


		//modal
        var sdi = Meteor.commonFunctions.popupModal("Delivering Order", "Are you sure you want to mark this order as delivered?");
        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Delivering!");

            // TODO do any data integrity checks (unless get RI into data model)
            // IF so, do not allow the delete and pop up a message.
            // Probably just do a find, and if it returns something - don't allow the remove

            $order.slideUp(150, function () {
                // When finished sliding

                Orders.update({ _id: new Mongo.ObjectID(orderId) }, {
                    $set: {
                        completed: true,
                        completed_by_id: Meteor.userId(),
                        updated_at: Date.now()
                    }
                });

                $(this).remove();
            });


        });
        modalPopup.show();
		//modal


	}
});

Template.pendingDelivery.helpers({
	items: function () {
		return Items.find({}, { sort: { name: 1 } });
	},
    getEmail: function (Id) {
        var itemObject;
        itemObject = Agencies.findOne({_id: new Mongo.ObjectID(Id) });
        return itemObject.name;
    },

    // TODO: seemed to need to name this different than the other allVolunteers function.  revisit
    allVolunteers2: function() {

        var allv = Meteor.users.find(
            {
                $or: [
                    {'profile.desired_role': 'volunteer'},
                    {'profile.desired_role': 'administrator'}
                ]
            }
        );



        return allv;
    },
    // get the first letter of a string - prob should be in a common spot, but needed it here
    firstLetter: function (someString) {
        var fooText = someString.substring(0,1);
        return new Spacebars.SafeString(fooText)
    },
    pdTitle: function () {
        var programParam = FlowRouter.getQueryParam("program");
        if (programParam == 'M') {
            return 'Complete Meat Orders';
        }
        else {
            return 'Orders To Be Loaded';
        }
    },
    isNotMeat: function () {
        var programParam = FlowRouter.getQueryParam("program");
        if (programParam != 'M') {
            return true;
        }
        else {
            return false;
        }
    },
    isMeat: function () {
        var programParam = FlowRouter.getQueryParam("program");
        if (programParam == 'M') {
            return true;
        }
        else {
            return false;
        }
    },
	orders: function () {
            var programParam = FlowRouter.getQueryParam("program");
            if (programParam == undefined){
                programParam = "N";
            }
            return Orders.find({
                $and: [
                    {
                        $or: [
                            { completed: false },
                            { completed: null }
                        ]
                    },
                    {
                        $or: [
                            { bundled: false },
                            { bundled: null }
                        ]
                    },
                    {purchasing_program: programParam}
                    //{ packed: true }
                ]
            }, { sort: { updated_at: -1 } });


	}

});
