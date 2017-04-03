import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import './help.html';


if (Meteor.isClient) {
    FlowRouter.route('/help/', {
        name: 'help',
        action() {
            BlazeLayout.render('appBody', { main: 'help' });
        }
    });
}



