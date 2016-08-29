import { Template } from 'meteor/templating';
import { Items } from '../api/items/items.js';

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
	Meteor.subscribe('items');
	console.log(Roles.getRolesForUser(Meteor.userId()));
});

Template.appBody.events({
	'click .js-menu': function (event) {
		
	}
});
