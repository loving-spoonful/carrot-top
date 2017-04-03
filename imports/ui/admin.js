import { Template } from 'meteor/templating';

import './admin.html'

if (Meteor.isClient) {
	FlowRouter.route('/admin/', {
		action() {
			BlazeLayout.render('appBody', { main: 'admin' })
		}
	});
}

Template.admin.helpers({
	isAdmin: function() {
		return Meteor.user() && Meteor.user().admin;
	},

	latestNews: function() {
		return News.latest();
	}
});

Template.admin.events({
	'submit form': function(event) {
		event.preventDefault();

		var text = $(event.target).find('[name=text]').val();
		News.insert({ text: text, date: new Date });

		sAlert.info('Saved latest news');
	},

	'click .login': function() {
		Meteor.loginWithTwitter();
	}
});
