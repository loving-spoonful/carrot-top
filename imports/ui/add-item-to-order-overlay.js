import { Template } from 'meteor/templating';
import { Items } from '../api/items/items.js';
import { Agencies } from '../api/agencies/agencies.js';
import './add-item-to-order-overlay.html'
import './const.js';

var getIntervalsForItem = function (id) {
	var item = Items.findOne({ _id: new Meteor.Collection.ObjectID(id) });
	var intervals = [];
	var upper_threshold = item.quantity_amount;
	if (item.ordering_maximum < item.quantity_amount) {
		upper_threshold = item.ordering_maximum;
	}

	for (var x = item.ordering_minimum; x <= upper_threshold; x += item.ordering_increment) {
		intervals.push({
			numerical: x,
			text: (Math.round(x * 100) / 100).toString() + ' ' + item.quantity_units
		});
	}

	return intervals;
};

Template.addItemToOrderOverlay.onCreated(function () {
	this.state = new ReactiveDict();
	this.state.set(ITEM_INTERVALS_KEY, []);
	Meteor.subscribe('items');

});



Template.addItemToOrderOverlay.rendered = function() {

    var Id = Session.get('currentOverlayID');

    var adminAgency = Session.get(CURRENT_AGENCY);
    var userAgency;
    var user_id = Meteor.userId();

    var currentUser = Meteor.users.findOne({_id: user_id });

    if (adminAgency == undefined) {
        userAgency = Agencies.findOne({_id: new Mongo.ObjectID(currentUser.profile.desired_agency)});
    }
    else {
        userAgency = Agencies.findOne({_id: new Mongo.ObjectID(adminAgency)});
    }
    $('label[name="AgencyName"]').text(userAgency.name);

    if (Id == undefined) {
        $('button[name="addItemToOrder"]').text("Add");

        $('textarea[name="instructions"]').val(userAgency.delivery_instructions);
    }
    else {
        var purchasing_program = Session.get("overlayData");
        var currentSessionData = Session.get(CURRENT_ORDER_KEY + purchasing_program);

        var orderItemObject = currentSessionData[Id];
        $('select[name="item-type"]').val(orderItemObject._id._str);
        $('select[name="item-type"]').prop('disabled', true);

        $('textarea[name="instructions"]').val(orderItemObject.instructions);

       Template.instance().state.set(ITEM_INTERVALS_KEY, getIntervalsForItem(orderItemObject._id._str));

       $('select[name="item-quantity"]').val(orderItemObject.quantity);
        $('select[name="item-type"]').disabled=true;

        $('button[name="addItemToOrder"]').text("Save");
	}


};

Template.addItemToOrderOverlay.events({

	'submit .form-add-to-order': function (event) {
		event.preventDefault();

		const target = event.target;
		const item = target['item-type'].value;

        var purchasing_program = Session.get("overlayData");
		var currentSessionData = Session.get(CURRENT_ORDER_KEY + purchasing_program);
        if (parseFloat(target['item-quantity'].value) <= 0) {
            sAlert('You must order more than 0 of an item!');
            return;
        }

		var Id = Session.get('currentOverlayID');

		// are we creating a new item?
		if (Id == undefined) {
			var newItem = Items.findOne({_id: new Meteor.Collection.ObjectID(item)});
			newItem.quantity = target['item-quantity'].value;
			newItem.instructions = target['instructions'].value;
			currentSessionData.push(newItem);

			var purchasing_program = Session.get("overlayData");
			Session.set(CURRENT_ORDER_KEY + purchasing_program, currentSessionData);
		}
		else {
            var orderItemObject = currentSessionData[Id];
            orderItemObject.quantity = target['item-quantity'].value;
            orderItemObject.instructions = target['instructions'].value;

            var purchasing_program = Session.get("overlayData");
            Session.set(CURRENT_ORDER_KEY  + purchasing_program, currentSessionData);
		}

        Session.set('currentOverlayID');
		Overlay.close();


	},
	'change #item-type': function (event) {
        event.preventDefault();

        Template.instance().state.set(ITEM_INTERVALS_KEY, getIntervalsForItem(event.target.value));
	}
});

Template.addItemToOrderOverlay.helpers({
	items() {
		return Items.find({purchasing_program: "N"}, { sort: { name: 1 } });
	},
    availableItems() {
        var existingOrderItemIds = [];
        var purchasing_program = Session.get("overlayData");
        var currentSessionData = Session.get(CURRENT_ORDER_KEY  + purchasing_program);

        var Id = Session.get('currentOverlayID');


        for (var item in currentSessionData) {
            if (Id == item) {
            }
            else {
                if (currentSessionData.hasOwnProperty(item)) {
                    existingOrderItemIds.push(new Mongo.ObjectID(currentSessionData[item]._id._str));
                }
            }
        }


        return Items.find({
            _id: {$nin: existingOrderItemIds},
            quantity_amount: {$gt: 0},
            purchasing_program: purchasing_program
        }, {sort: {name: 1}});
    },
    isProduce() {
        var purchasing_program = Session.get("overlayData");
        return (purchasing_program != "M");
    },
	intervals() {
		return Template.instance().state.get(ITEM_INTERVALS_KEY);
	}
});
