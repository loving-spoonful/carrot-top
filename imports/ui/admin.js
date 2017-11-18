import { Template } from 'meteor/templating';
import { News } from '../api/news/news.js';
import { Agencies } from '../api/agencies/agencies.js';
import { Items } from '../api/items/items.js';
import { Suppliers } from '../api/suppliers/suppliers.js';
import './admin.html'
import './private/private-const.js'

/*
 * 30sep2017    mike    subscribe to news to allow editing for 'new' news
 *                      Email blast - for meat
 * 08nov2017    mike    added in veggie email blast.  Gather up the inventory of veggies and email to the contact
 *                      person at each agency (one email done with BCC)
 *
 * 18nov2017    mike    change wording for veggie email blast
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
});

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
        var text = $(event.target).find('[name=text]').val();
        const target2 = event.target;

        News.insert({text: text, date: new Date});

        sAlert.info('Saved latest news' + text);
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
