'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var UserSchema = new Schema({
    emailAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    }
});

// https://stackoverflow.com/questions/18022365/mongoose-validate-email-syntax
UserSchema.path('emailAddress').validate(function (email) {
   var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
   return emailRegex.test(this.emailAddress); // Assuming email has a text attribute
}, 'The e-mail is either empty or improperly formed.');

// authenticate input against database documents
UserSchema.statics.authenticate = function(email, password, callback) {
  User.findOne({ emailAddress: email })
      .exec(function (error, user) {
        if (error) {
          return callback(error);
        } else if ( !user ) {
          var err = new Error('User not found.');
          err.status = 401;
          return callback(err);
        }
        bcrypt.compare(password, user.password , function(error, result) {
          if (result === true) {
            return callback(null, user);
          } else {
            return callback();
          }
        })
      });
}

// hash password before saving to database
UserSchema.pre('save', function(next) {
  var user = this;
  bcrypt.hash(user.password, 10, function(err, hash) {
    if (err) { return next(err); }
    user.password = hash;
    next();
  });
});

var ReviewSchema = new Schema({
    user: { "type": Schema.Types.ObjectId, "ref": "User"},
    postedOn: { type: Date, default: Date.now },
    rating: { type: Number, min: 1, max: 5 },
    review: String
});

var CourseSchema = new Schema({
    user: { "type": Schema.Types.ObjectId, "ref": "User"},
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    estimatedTime: String,
    materialsNeeded: String,
    steps: [{
    	stepNumber: Number,
    	title: {
    		type: String,
    		required: true,
    		trim: true
    	},
    	description: {
    		type: String,
    		required: true,
    		trim: true
    	}
    }],
    reviews: [{ "type": Schema.Types.ObjectId, "ref": "Review" }]
});

// http://thecodebarbarian.com/mongoose-error-handling
// Handler **must** take 3 parameters: the error that occurred, the document
// in question, and the `next()` function
var defaultErrorCode = function(error, doc, next) {
  	error.status = 400;
    next(error);
};

// preset errors on saves to 400
UserSchema.post('save', defaultErrorCode);
ReviewSchema.post('save', defaultErrorCode);
CourseSchema.post('save', defaultErrorCode);

var User = mongoose.model('User', UserSchema);
var Review = mongoose.model('Review', ReviewSchema);
var Course = mongoose.model('Course', CourseSchema);

module.exports.User = User;
module.exports.Review = Review;
module.exports.Course = Course;