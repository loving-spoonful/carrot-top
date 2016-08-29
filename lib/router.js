dataReadyHold = null;

import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
	// Keep showing the launch screen on mobile devices until we have loaded
	// the app's data
	dataReadyHold = LaunchScreen.hold();
}
