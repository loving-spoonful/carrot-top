import { Template } from 'meteor/templating';
import { News } from '../api/news/news.js';
import { Agencies } from '../api/agencies/agencies.js';
import { Items } from '../api/items/items.js';
import { Suppliers } from '../api/suppliers/suppliers.js';
import './admin.html'
import './private/private-const.js'
import { Orders } from '../api/orders/orders.js';


/*
 * 30sep2017    mike    subscribe to news to allow editing for 'new' news
 *                      Email blast - for meat
 * 08nov2017    mike    added in veggie email blast.  Gather up the inventory of veggies and email to the contact
 *                      person at each agency (one email done with BCC)
 *
 * 18nov2017    mike    change wording for veggie email blast
 *
 * 14jan2018    mike    Functionality to generate an html email (table) with all the meat order details.
 *                      Include summary information (count and totals) by item and price (as the price
 *                      changes over time)  Add in excel formula as well for calculating overall total
 *
 * 03mar2018    mike    In prod, data problems exists where orders refer to items that no longer exist
 *                      Code wasn't expecting this, so fetched the item and referenced its name attribute
 *                      effectively generating an npe.
 *                      Now check that item is undefined or not before referencing the name.  If it is, set name
 *                      as unknown.  Function OrderAndItemDetail
 */
if (Meteor.isClient) {
	FlowRouter.route('/admin/', {
        name: 'admin',
		action() {
			BlazeLayout.render('appBody', { main: 'admin' })
		}
	});
}

Template.admin.onCreated(function () {
    this.state = new ReactiveDict();

    Meteor.subscribe('News');
    Meteor.subscribe('Agencies');
    Meteor.subscribe('items');
    Meteor.subscribe('Suppliers');

    Meteor.subscribe('orders');
});


var orderItemsMap = new Map();

function OrderAndItemDetail (agency_id, created_at, updated_at, item_id, priceAtTime, quantity, total) {
    this.agency = Agencies.findOne({_id: new Mongo.ObjectID(agency_id)}).name;
    this.created_at = created_at;
    this.updated_at =  updated_at;

    this.item = Items.findOne({_id: new Mongo.ObjectID(item_id)});
    if (this.item == undefined) {
        this.itemname = "Unknown";
    }
    else {
        this.itemname = this.item.name;
    }


    this.priceAtTime = priceAtTime;
    this.quantity = quantity;

    this.total = total;

    // key on the itemname and the priceatthetime (with a # to easily parse this dual key)
    // keep totals for each item for the price at the time (the value component of the items in the map)
    if (orderItemsMap.has(this.itemname + "#" + this.priceAtTime)) {
        var currentTotal = orderItemsMap.get(this.itemname + "#" +  this.priceAtTime);
        currentTotal = currentTotal + this.total;

        orderItemsMap.set(this.itemname+ "#" +  this.priceAtTime, currentTotal);
    }
    else {
        orderItemsMap.set( this.itemname+ "#" + this.priceAtTime, this.total );
    }
}

// compare method to help sort the order items - by name and then within name by price
function compareOrderAndItemDetail(a,b) {
    if (a.itemname < b.itemname)
        return -1;
    if (a.itemname > b.itemname)
        return 1;

    if (a.priceAtTime < b.priceAtTime)
        return -1;
    if (a.priceAtTime > b.priceAtTime)
        return 1;

    return 0;
}

Template.admin.helpers({
	isAdmin: function() {
		return Meteor.user() && Meteor.user().admin;
	},


	latestNews: function() {
		var newest;
        newest = News.findOne({}, {sort:{date:-1, limit:1}});
		return newest;
	}
});

Template.admin.events({
    'submit .form-admin-news': function (event) {
        event.preventDefault();

        const target = event.target;
        var text = $(event.target).find('[name=newsText]').val();
        const target2 = event.target;

        News.insert({text: text, date: new Date});

        sAlert.info('Saved latest news: ' + text);
    },

    'submit .form-admin-veggie-email-blast': function (event) {
        event.preventDefault();

        var veggieDeadline = $(event.target).find('[name=veggieDeadline]').val();

        const target = event.target;
        var sdi = Meteor.commonFunctions.popupModal("Vaggie Email Blast", "Are you sure you want to email all veggie inventory amounts to agencies?");
        var modalPopup = ReactiveModal.initDialog(sdi);
        modalPopup.buttons.ok.on('click', function(button) {
            var toUsers = [];

            //purchasing_program: "N"
            var listOfVeggieProgramAgencies = Agencies.find({}).
                forEach(function(obj){
                    toUsers.push(obj.primary_contact_email);
                });

            var emailText = "Dear friends,\n\nWe have received large donations of fresh produce to our cold storage and you can get some in three easy steps!";
            emailText = emailText + "\n\n" + "\t1. Visit carrot.lovingspoonful.org on any phone, tablet or computer. ";
            emailText = emailText + "\n"   + "\t2. Log in to view the inventory of ";


            var countOfItems = 0;

            var totalVeggieItems = Items.find({purchasing_program: "N"}, {sort: {name:1}}).count();

            var listOfVeggieItems = Items.find({purchasing_program: "N"}, {sort: {name:1}}).
            forEach(function(obj){
                countOfItems++;
                emailText = emailText + obj.name;
                if (countOfItems+1 < totalVeggieItems) {
                    emailText = emailText + ", ";
                }
                else if (countOfItems+1 == totalVeggieItems) {
                    emailText = emailText + " and ";
                }
                else if (countOfItems == totalVeggieItems) {
                    emailText = emailText + ".";

                }
            });

            //emailText = emailText.slice(0, emailText.length-2);

            emailText = emailText + "\n"   + "\t3. Place your order by 12 noon on " + veggieDeadline +".  (Watch the 'how-to' video at https://www.youtube.com/watch?v=Nfb6U_Ved7c)";

            emailText = emailText + "\n"   + "\nAs always, veggies are free and they will be delivered by our delightful volunteer drivers in the coming week.";

            emailText = emailText + "\n\n";

            emailText = emailText + "Be in touch if you have any questions at all!\n"
                + "Lilith";
            emailText = emailText + "\n\nWe are grateful to our farmer and grocer partners for their generous donations."

            emailText = emailText + "\n\nLilith Wyatt\nFood Access Coordinator\nCommunity Gardens Coordinator\n";
            emailText = emailText + "559 Bagot St.\nKingston, ON  K7K 3E1\nOffice:  613-507-8848\nCell:  613-893-6393\nfood@lovingspoonful.org\nwww.lovingspoonful.org"

            Meteor.call('sendBCCEmail',
                toUsers,
                CTOP_SMTP_SENDING_EMAIL_ACCOUNT,
                'CarrotTop Veggie Program: Current Inventory',
                emailText);
        });
        modalPopup.show();
    },
    'submit .form-admin-orderdetails' : function (event) {
        event.preventDefault();
        var programParam = "M";
        var myList = [];
        var origSortedList = [];
        var tableAsEmail;

        var rowWhereDataStarts = 2;
        var numberOfOrders=0;

        Orders.find({purchasing_program: programParam}, {sort: {created_at: 1}})
            .forEach(function(ord) {
                    for (var i = 0; i < ord.requests.length; i++) {
                        tableAsEmail = tableAsEmail + "<tr>";
                        var orderAndItemDetail = new OrderAndItemDetail(ord.agency_id, ord.created_at, ord.updated_at,
                            ord.requests[i].item_id, ord.requests[i].priceAtTime, ord.requests[i].quantity,
                            ord.requests[i].priceAtTime * ord.requests[i].quantity);
                        myList.push(orderAndItemDetail);
                        origSortedList.push(orderAndItemDetail);
                        numberOfOrders = numberOfOrders + 1;
                    }
                }
            )
        tableAsEmail = "<table><br>";
        tableAsEmail = tableAsEmail + "<tr>";
        tableAsEmail = tableAsEmail + "<td>";
        tableAsEmail = tableAsEmail + "=sum(G" + rowWhereDataStarts + ":G" + (numberOfOrders+rowWhereDataStarts) + ")";
        tableAsEmail = tableAsEmail + "</td>";

        tableAsEmail = tableAsEmail + "</tr>";

        tableAsEmail = tableAsEmail + "<tr>";
        tableAsEmail = tableAsEmail + "<th>Created Date</th><th>Submitted Date</th><th>Agency</th><th>Product</th><th>Amount</th><th>Price</th><th>Total</th><th></th><th></th><th></th><th>Price At Time</th><th>Total Weight</th><th>Total Price</th>";
        tableAsEmail = tableAsEmail + "</tr>";

        for (var i=0; i < myList.length; i++) {
            tableAsEmail = tableAsEmail + "<tr>";
            tableAsEmail = tableAsEmail + "<td>";
            tableAsEmail = tableAsEmail + myList[i].created_at;

            tableAsEmail = tableAsEmail + "</td>";

            tableAsEmail = tableAsEmail + "<td>";
            tableAsEmail = tableAsEmail + myList[i].updated_at;
            tableAsEmail = tableAsEmail + "</td>";

            tableAsEmail = tableAsEmail + "<td>";
            tableAsEmail = tableAsEmail + myList[i].agency;
            tableAsEmail = tableAsEmail + "</td>";

            tableAsEmail = tableAsEmail + "<td>";
            tableAsEmail = tableAsEmail + myList[i].itemname;
            tableAsEmail = tableAsEmail + "</td>";

            tableAsEmail = tableAsEmail + "<td>";
            tableAsEmail = tableAsEmail + myList[i].priceAtTime;
            tableAsEmail = tableAsEmail + "</td>";

            tableAsEmail = tableAsEmail + "<td>";
            tableAsEmail = tableAsEmail + myList[i].quantity;
            tableAsEmail = tableAsEmail + "</td>";

            tableAsEmail = tableAsEmail + "<td>";
            tableAsEmail = tableAsEmail + myList[i].total;
            tableAsEmail = tableAsEmail + "</td>";


            if (i < orderItemsMap.size) {
                tableAsEmail = tableAsEmail + "<td>";
                tableAsEmail = tableAsEmail + "</td>";

                tableAsEmail = tableAsEmail + "<td>";
                tableAsEmail = tableAsEmail + "</td>";

                var iter1 = orderItemsMap.keys();
                var itemName;
                var itemPriceAtTime;
                for (var x = 0; x<=i; x++) {
                    itemName = iter1.next().value;
                    itemPriceAtTime = itemName.split("#")[1];
                    itemName= itemName.split("#")[0];
                }
                tableAsEmail = tableAsEmail + "<td>";
                tableAsEmail = tableAsEmail + itemName;
                tableAsEmail = tableAsEmail + "</td>";

                tableAsEmail = tableAsEmail + "<td>";
                tableAsEmail = tableAsEmail + itemPriceAtTime;
                tableAsEmail = tableAsEmail + "</td>";


                var iter = orderItemsMap.values();
                var itemTotalPrice;

                for (var x = 0; x<=i; x++) {
                    itemTotalPrice = iter.next().value;
                }


                tableAsEmail = tableAsEmail + "<td>";
                tableAsEmail = tableAsEmail + itemTotalPrice / itemPriceAtTime;
                tableAsEmail = tableAsEmail + "</td>";

                tableAsEmail = tableAsEmail + "<td>";
                tableAsEmail = tableAsEmail + itemTotalPrice;
                tableAsEmail = tableAsEmail + "</td>";
            }
            //                   }
            tableAsEmail = tableAsEmail + "</tr>";

        }
        tableAsEmail = tableAsEmail + "<br></table>";

        debugger;
        var currentUser = Meteor.users.findOne({_id: Meteor.user()._id});
        var currentUserEmail = currentUser.emails[0].address;
        Meteor.call('sendHTMLEmail',
            currentUserEmail,
            CTOP_SMTP_SENDING_EMAIL_ACCOUNT,
            'Order Details',
            tableAsEmail);

        sAlert.info('Sent all the meat order details to ' + currentUserEmail);

    },
    'submit .form-admin-meat-email-blast': function (event) {
        event.preventDefault();

        const target = event.target;
        var meatDeadline = $(event.target).find('[name=meatDeadline]').val();

        var sdi = Meteor.commonFunctions.popupModal("Meat Email Blast", "Are you sure you want to email all meat prices to agencies in the meat program?");
        var modalPopup = ReactiveModal.initDialog(sdi);
        modalPopup.buttons.ok.on('click', function(button) {

            var toUsers = [];

            var listOfMeatProgramAgencies = Agencies.find({purchasing_program: "M"}).
            forEach(function(obj){
                toUsers.push(obj.primary_contact_email);
            });

            var meatPrices = [];
            var meatName = [];
            var meatSupplier = [];
            var uniqueMeatSupplier = [];
            var meatUnits = [];
            var meatUnitsComments = [];
            var countOfItems = 0;
            var stringOfAllSuppliers = undefined;
            var listOfMeatItems = Items.find({purchasing_program: "M"}, {sort: {name:1}}).
            forEach(function(obj){

                var times100 = (Math.round(obj.price * 100)).toString();

                var formattedPrice = times100.substr(0, times100.length-2) + '.';
                formattedPrice = formattedPrice + times100.substr(times100.length-2,2);
                meatPrices.push(formattedPrice );
                meatName.push(obj.name);

                meatUnits.push(obj.quantity_units);
                meatUnitsComments.push(obj.quantity_units_comments);

                var mySupplier = Suppliers.findOne({_id: new Mongo.ObjectID(obj.supplier_id)});
                var foundSupplier = false;
                for (var i=0; i < meatSupplier.length; i++) {
                    if (meatSupplier[i] == mySupplier.name) {
                        foundSupplier = true;
                        break;
                    }
                }
                if (foundSupplier==false) {
                    uniqueMeatSupplier.push(mySupplier.name);
                }
                meatSupplier.push(mySupplier.name)
                countOfItems++;
            });

            for (var i=0; i < uniqueMeatSupplier.length; i++) {
                if (stringOfAllSuppliers == undefined) {
                    stringOfAllSuppliers = uniqueMeatSupplier[i];
                }
                else {
                    if (i ==  uniqueMeatSupplier.length - 1) {
                        stringOfAllSuppliers = stringOfAllSuppliers + " and " + uniqueMeatSupplier[i];
                    }
                    else {
                        stringOfAllSuppliers = stringOfAllSuppliers + ", " + uniqueMeatSupplier[i];
                    }
                }
            }
            var emailText = "Hi friends,\n\nVisit the Carrot Top at carrot.lovingspoonful.org to place your meat order by 12 noon on " + meatDeadline + ". If you have any questions, please be in touch.\n\nSuppliers will deliver the meat and bill you directly. Beef and pork will be delivered Friday afternoon. Poultry delivered Wed-Fri -- specify your preference in your order notes.";

            emailText = emailText + "\n\n" + "Here are this week's prices:\n"
            for (var i=0; i < countOfItems; i++) {

                emailText = emailText + "\n\t· " + meatName[i] + " at $" + meatPrices[i] + "/" + meatUnits [i] + " from " + meatSupplier[i];
                if (meatUnitsComments[i] != undefined) {
                    emailText = emailText + " -- " + meatUnitsComments[i];
                }
            }

            emailText = emailText + "\n\n";

            emailText = emailText + "Cheers,\nLilith\n\n"
                + "We are grateful to our local suppliers -- " + stringOfAllSuppliers + " -- for providing the discounted quality meat, and to the Community Foundation for Kingston & Area for making the program possible.";

            emailText = emailText + "\n\nLilith Wyatt\nFood Access Coordinator\nCommunity Gardens Coordinator\n";
            emailText = emailText + "559 Bagot St.\nKingston, ON  K7K 3E1\nOffice:  613-507-8848\nCell:  613-893-6393\nfood@lovingspoonful.org\nwww.lovingspoonful.org"

            Meteor.call('sendBCCEmail',
                toUsers,
                CTOP_SMTP_SENDING_EMAIL_ACCOUNT,
                'CarrotTop Meat Program: Order by noon ' + meatDeadline,
                emailText);
            //sAlert.info('Blast' + emailText);
        });
        modalPopup.show();
    }



});
