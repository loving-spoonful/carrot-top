/**
 * Created by mike on 2017-08-13.
 * Simple table for storing 'news' information to display on the main page
 */

import {Mongo} from 'meteor/mongo';


export const News = new Mongo.Collection('News', {idGeneration: 'MONGO'});

if (Meteor.isServer) {

    Meteor.publish('News', function getAllNews() {
        return News.find();
    });
}


News.schema = new SimpleSchema({
    text: {type: String},
    date: {type: Date}
});
News.attachSchema(News.schema);

