import { Template } from 'meteor/templating';
import { News } from '../api/news/news.js';
import './home.html'

/*
 * 30Sep2017    mike    subscribe to the news table; add method to get the current news (to display on home page)
 *                      Also, function to get the current application version to display on home page
 */
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
    Meteor.subscribe('News');
});

Template.appBody.events({
	'click .js-menu': function (event) {
		
	}
});

Template.home.helpers({
    latestNews: function () {
        var theLatestNewsPosting;
        theLatestNewsPosting = News.findOne({}, {sort: {date: -1, limit: 1}});
        return theLatestNewsPosting;
    },
    getVersion: function() {
        return CTOP_VERSION;
    }
});