import { Template } from 'meteor/templating';

import './home.html'

if (Meteor.isClient) {
	FlowRouter.route('/', {
		name: 'home',
		action() {
			BlazeLayout.render('appBody', { main: 'home' })
		}
	});
}

Template.home.onCreated(function bodyOnCreated() {
	dataReadyHold.release();
	this.state = new ReactiveDict();
});

Template.appBody.events({
	'click .js-menu': function (event) {
		
	}
});
