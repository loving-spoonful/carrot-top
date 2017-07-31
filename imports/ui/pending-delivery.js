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

function getFormattedCurrency(amount, price) {
    var times100 = (Math.round(amount * price * 100)).toString();

    return times100.substr(0, times100.length-2) + '.' + times100.substr(times100.length-2);
}

function MeatOrderDetails (itemName, amount, quantity_units, agency_id, price, submitterEmail) {
    this.itemName = itemName;
    this.amount = amount;
    this.quantity_units = quantity_units;
    this.agency = Agencies.findOne({_id: new Mongo.ObjectID(agency_id)});
    this.price = price;
    this.submitterEmail = submitterEmail;

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
MeatOrderDetails.prototype.getAgencyPhone = function() {
    return this.agency.primary_contact_phone;
};
MeatOrderDetails.prototype.getAgencyDeliveryInstructions = function() {
    return this.agency.delivery_instructions;
};
MeatOrderDetails.prototype.getAgencyGoogleMapsLink = function() {
    return this.agency.google_maps_link;
};
MeatOrderDetails.prototype.getAgencyId = function() {
    return this.agency._id;
};

function compareMeatOrders(a,b) {
    if (a.getAgencyId < b.getAgencyId)
        return -1;
    if (a.getAgencyId > b.getAgencyId)
        return 1;
    return 0;
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

        if (assignedVolunteer == undefined) {
            sAlert.info ("Please select a volunteer to assign to this order");
            return;
        }
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

            // let's send an email to the volunteer to let them know they were assigned a delivery
            var volunteer = Meteor.users.findOne({_id: assignedVolunteer});
            var emailText = "You have been assigned a delivery!  Please log in to carrot.lovingspoonful.org.";
            Meteor.call('sendEmail',
                volunteer.emails[0].address,
                CTOP_SMTP_SENDING_EMAIL_ACCOUNT,
                'Assigned a delivery',
                emailText);
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

        var $ordersOnPage = $(event.target).parents('.list-order').first();

        //modal
        var sdi = Meteor.commonFunctions.popupModal("Submit Meat Order", "Is it already monday at noon?  If you are ready, click ok to submit meat orders to the suppliers.");

        var modalPopup = ReactiveModal.initDialog(sdi);

        modalPopup.buttons.ok.on('click', function (button) {
            // what needs to be done after click ok.
            sAlert.info ("Submitting meat orders!");

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

                    //var meatOrderDetails = new MeatOrderDetails(currentRequest.quantity, currentObject.agency_id);
                    var myagency = Agencies.findOne({_id: new Mongo.ObjectID(currentObject.agency_id)});

                    var myItem = Items.findOne({_id: new Mongo.ObjectID(currentRequest.item_id)});
                    //ebugger;
                    // TODO var orderOwner = Meteor.users.findOne({_id: new Mongo.ObjectId(currentObject.owner_id)});


                    var meatOrderDetails = new MeatOrderDetails(myItem.name, currentRequest.quantity, myItem.quantity_units, currentObject.agency_id, currentRequest.priceAtTime, currentObject.owner_id);
                    var sup = myItem.supplier_id;

                    var supplierIndex = allSuppliers.indexOf(sup);

                    // let's see if an agency submitted more than 1 order for a particular meat product

                    var foundMatch = false;
                    for (var i=0; i < ordersForSuppliersList[supplierIndex].length; i++) {
                        var w = ordersForSuppliersList[supplierIndex][i];
                        if ((w.getAgencyId()._str == currentObject.agency_id) &&  (w.itemName == myItem.name)) {
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
                        // $set: { updated_at: Date.now() }
                        $set: { updated_at: Date.now(), completed: true }
                    });

                }
                Orders.update({ _id: (currentObject._id) }, {
                    $set: {
                        completed_by_id: Meteor.userId(),
                        completed: true,
                        bundled: true,
                        updated_at: Date.now()
                    }
                });
            })

            debugger;
            ordersForSuppliersList.sort(compareMeatOrders);
            var emailString = [allSuppliers.length];

            for (var i =0; i <allSuppliers.length; i++) {
                //ebugger;
                var currentSupplier = Suppliers.findOne({_id: new Mongo.ObjectID(allSuppliers[i])});
                var emailOfSupplier = currentSupplier.primary_contact_email;
                var contactNameOfSupplier = currentSupplier.primary_contact_name;
                var nameOfSupplier = currentSupplier.name;

                var emailToAgencies = [ordersForSuppliersList[i].length];
                emailString =
                    "\nDear " + contactNameOfSupplier + " of " + nameOfSupplier
                    + "\nHere are this week's orders from local shelters and meal programs via the Loving Spoonful:";
                var ordersThisWeek = false;


                var startNewEmail = true;
                var orderNumber = 1;


                if (ordersForSuppliersList[i][0] == undefined) {
                    Meteor.call('sendEmail',
                        emailOfSupplier,
                        CTOP_SMTP_SENDING_EMAIL_ACCOUNT,
                        'Meat Order',
                        emailString + "\nNo orders this week!");
                    continue;
                }

                var currentAgency = ordersForSuppliersList[i][0].agency.name;
                for (var j=0; j<ordersForSuppliersList[i].length; j++) {

                    // close off this particular agency section of the email
                    if (currentAgency != ordersForSuppliersList[i][j].agency.name) {
                        emailString = emailString
                            + "\n\nNotes:" + currentOrder.getAgencyDeliveryInstructions();
                        if (currentOrder.getAgencyGoogleMapsLink() != undefined){
                            emailString = emailString + "\n" + currentOrder.getAgencyGoogleMapsLink()
                        }
                        emailString = emailString + "\n";
                        startNewEmail=true;
                        orderNumber = orderNumber + 1;
                    }

                    currentAgency = ordersForSuppliersList[i][j].agency.name;

                    emailToAgencies[j] = ordersForSuppliersList[i][j].getAgencyEmail();
                    var currentOrder = ordersForSuppliersList[i][j];
                    ordersThisWeek =true;

                    // at the start of each processing, build the 'header' part of the email (the Dear XXX part with whatever
                    // other tombstone info
                    if (startNewEmail == true) {
                        emailString = emailString + "\n"
                            + orderNumber + ". "
                            + currentOrder.agency.name
                            + "\n" + currentOrder.agency.primary_contact_name
                            + ", " + currentOrder.getAgencyEmail()
                            + ", " + currentOrder.getAgencyPhone() + "\n";
                        startNewEmail = false;


                    }

                    // for the other orders for the supplier, add those in (so martha's table may have hamburger and steak) - include as one email
                    emailString = emailString
                        + "\n" + currentOrder.itemName + " in the amount of " + currentOrder.amount + " " + currentOrder.quantity_units
                        + " @ $" + getFormattedCurrency(1, currentOrder.price)
                        + " = $" + getFormattedCurrency(currentOrder.amount, currentOrder.price);




                    var agencyEmail = "Dear " + currentOrder.agency.primary_contact_name + " of " + currentOrder.agency.name
                        + "\nYour " + currentOrder.itemName + " order this week is"
                        + " for " + currentOrder.amount + " " + currentOrder.quantity_units
                            + " @ $" + getFormattedCurrency(1, currentOrder.price)
                        + " = $" + getFormattedCurrency(currentOrder.amount, currentOrder.price);
                    if (currentSupplier.notes == undefined) {
                    }
                    else {
                        if (j==ordersForSuppliersList[i].length-1) {
                            agencyEmail = agencyEmail + "\nDelivery notes: " + currentSupplier.notes;
                        }
                    }
                    Meteor.call('sendEmail',
                        currentOrder.getAgencyEmail(),
                        CTOP_SMTP_SENDING_EMAIL_ACCOUNT,
                        'Meat Order',
                        agencyEmail);

                }


                if (ordersThisWeek)
                {
                    emailString = emailString + "\n\n" + "Thank you for helping get more good food to out Kingston neighbours who need it most!"
                        + "\n" + "Have questions? Call Lilith Wyatt, Food Access Coordinator, at 613-507-8848 or respond to this email."
                    // This is the email to the suppliers!
                    Meteor.call('sendEmail',
                        emailOfSupplier,
                        CTOP_SMTP_SENDING_EMAIL_ACCOUNT,
                        'Meat Order',
                        emailString);
                }
                else
                {
                    // This is the email to the suppliers!
                    Meteor.call('sendEmail',
                        emailOfSupplier,
                        CTOP_SMTP_SENDING_EMAIL_ACCOUNT,
                        'Meat Order',
                        emailString + "\nNo orders this week!");
                }
            }

            $ordersOnPage.slideUp(150, function () {
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
    allVolunteerList: function() {

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
