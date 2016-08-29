import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import './auth-page.html'

Template.authPage.onCreated(function bodyOnCreated() {
	this.state = new ReactiveDict();
});
