import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Agencies } from '../api/agencies/agencies.js';
import './auth-page.html'

Template.atForm.onCreated(function bodyOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('Agencies');

});


    Template.atForm.onRendered(function () {
        waitForRegistrationScreen = Meteor.setInterval(function () {
            $('#at-field-desired_agency').css('visibility', 'hidden');


            // Keep checking if registration is shown
            if (AccountsTemplates.getState() == 'signUp') {
                // If it is shown, and select is empty, populate it

                if ($('#at-field-desired_agency option').length == 1) {

                    Agencies.find({}, { sort: { name: 1 } }).forEach(function (item) {
                        $('#at-field-desired_agency').append('<option value="' + item._id + '">' + item.name + '</option>');
                    });
                    Meteor.clearInterval(waitForRegistrationScreen);
                    $('#at-field-desired_agency').prop("disabled",true);

                }
                ;
            }

        }, 100);
    });

Template.atForm.helpers({
    ranking() {
        return Agencies.find().fetch();
    }
,
    showExtraFields: function() {
        return Template.instance().showExtraFields.get();
    }
});

Template.atForm.events({

    'change #at-field-desired_role': function (event, template) {
        var currentTarget = event.currentTarget;

        var selectedRole = template.find('#at-field-desired_role').value;
        //template.showExtraFields.set( true );
        if (selectedRole == 'agency') {
            $('#at-field-desired_agency').prop("disabled", false);
            $('#at-field-desired_agency').css('visibility', 'visible');
        }
        else {
            $('#at-field-desired_agency>option:eq(0)').prop('selected', true);
            $('#at-field-desired_agency').prop("disabled", true);
            $('#at-field-desired_agency').css('visibility', 'hidden');
        }
    }
});

Template.wrappedSelect2.onCreated (function bodyOnCreated() {
    this.showExtraFields = new ReactiveVar( false );

});
Template.authPage.onCreated(function bodyOnCreated() {
	this.state = new ReactiveDict();
    Meteor.subscribe('Agencies');


});



