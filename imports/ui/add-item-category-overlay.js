import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';



import { Items } from '../api/items/items.js';
import { ItemCategories } from '../api/item-categories/item-categories.js';
import { Agencies } from '../api/agencies/agencies.js';

import './add-item-category-overlay.html'
import './appShareDialog.html'


Template.addItemCategoryOverlay.onCreated(function () {
	this.state = new ReactiveDict();
	Meteor.subscribe('items');
	Meteor.subscribe('item-categories');
});


Template.addItemCategoryOverlay.rendered = function () {

    var Id = Session.get('currentOverlayID');
    if (Id == undefined) {
        $('button[name="category_save_btn"]').text("Add");
    }
    else {
        var itemObject = ItemCategories.findOne({_id: new Mongo.ObjectID(Id)});
        $('input[name="item-category-name"]').val(itemObject.name);
        $('select[name="purchasing_program"]').val(itemObject.purchasing_program);
        $('button[name="category_save_btn"]').text("Save");

    }
    ;
}

Template.addItemCategoryOverlay.events({
	'submit .form-add-item-category': function (event) {
		event.preventDefault();

		const target = event.target;
		const itemCategoryName = target['item-category-name'].value.trim();
        const purchasingProgram = target['purchasing_program'].value.trim();

		if (itemCategoryName.length > 0) {
			var rc = ItemCategories.findOne({name: itemCategoryName});
			// if (rc) {
             //    //throw new Meteor.error (666, 'duplicate!', e);
			// 	sAlert.warning ('This category (' + itemCategoryName + ') already exists!  Please enter a new category.');
			// }
			// else {
                var Id = Session.get('currentOverlayID');

                // if id is set in the session, we are editing and should do an update
				// otherwise this is a new and do an insert
                if (Id) {

                    ItemCategories.update({ _id: new Mongo.ObjectID(Id) }, { $set: { name: itemCategoryName, updated_at: Date.now(), purchasing_program: purchasingProgram }});
                    sAlert.info('Saved!');
                    Session.set('currentOverlayID');
				}
				else {
                    var rc = ItemCategories.insert({
                        name: itemCategoryName,
                        purchasing_program: purchasingProgram,
                        // these should now be default values on the collection
                        // but will leave in 24feb2017 mike
                        created_at: Date.now(),
                        updated_at: Date.now()
                    });
                };

                Overlay.close();
            // }
		} else {
			sAlert.warning('You must fill in all relevant fields in order to create your item category.');
		}
	},
});



Template.addItemCategoryOverlay.helpers({
	items() {
		return Items.find({}, { sort: { name: 1 } });
	},
	itemCategories() {
		return ItemCategories.find({}, { sort: { name: 1 } });
	}
});


