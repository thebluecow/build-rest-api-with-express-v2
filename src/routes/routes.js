'use strict';

var express = require("express");
var router = express.Router();
var mid = require('../middleware');
var User = require('../models/models').User;
var Review = require('../models/models').Review;
var Course = require('../models/models').Course;

// get course from database with deep population on User and Review
router.param("cID", function(req,res,next,id){
	Course.findById(id)
		  .populate([{path: 'reviews', populate: {path: 'user', select: 'fullName'}}, {path: 'user', select: 'fullName'}])
		  .exec(function(err, course){
			if(err) return next(err);
			if(!course) {
				err = new Error("Not Found");
				err.status = 404;
				return next(err);
			}
		req.course = course;
		return next();
	});
});

// GET /courses
// route to get all courses
router.get('/courses', (req, res, next) => {
	Course.find({}, '_id title')
				.sort({createdAt: -1})
				.exec(function(err, courses){
					if(err) {
						res.status(400);
						return next(err);
					}
					res.status(200);
					res.json(courses);
				});
});

// POST /courses
// route to create a course
router.post('/courses', mid.validateUser, (req, res, next) => {
	var course = new Course(req.body);
	course.save(function(err, course){
		if(err) {
			res.status(400);
			return next(err);
		}
		res.status(201);
		res.location('/');
		res.json();
	});
});

// GET /courses/:cID
// route for specific course ID
router.get('/courses/:cID', (req, res, next) => {
	res.status(200);
	res.json(req.course);
});

// PUT /courses/:cID
// route to update a course
router.put('/courses/:cID', mid.validateUser, (req, res, next) => {
	req.course.update(req.body, function(err, result){
		if(err) {
			res.status(400);
			return next(err);
		}
		res.status(204);
		res.location('/');
		res.json();
	});
});

// POST /courses/:cID/reviews
// route to post a review for an existing course
router.post('/courses/:cID/reviews', mid.validateUser, (req, res, next) => {
	req.body.user = req.userId;

	if (!req.userId.equals(req.course.user._id)) {

		var review = new Review(req.body);
		review.save(function(err, review){
			if(err) {
				res.status(400);
				return next(err);
			}
			
			req.course.reviews.push(review);
			req.course.save(function(err, review){
				if(err) {
					res.status(400);
					return next(err);
				}
				res.status(201);
				res.location(req.originalUrl.substring(0, req.originalUrl.length - 8));
				res.json();
			});
		});
	} else {
		var err = new Error("Ability to review own course is disabled.");
		err.status = 404;
		return next(err);
	}
});

// GET /users
// route to get all users
router.get('/users', mid.validateUser, (req, res, next) => {
	// When I make a request to the GET /api/users route with the correct credentials,
	// the corresponding user document is returned
	User.findOne(req.userId)
				.sort({createdAt: -1})
				.exec(function(err, users){
					if(err) {
						res.status(400);
						return next(err);
					}
					res.status(200);
					res.json(users);
				});
});

// POST /users
// route to create a user
router.post('/users', (req, res, next) => {
	if (req.body.emailAddress &&
    	req.body.fullName &&
    	req.body.password &&
    	req.body.confirmPassword) {

		if (req.body.password !== req.body.confirmPassword) {
        	var err = new Error('Passwords do not match.');
        	err.status = 400;
        	return next(err);
      	}

    var user = new User(req.body);
	user.save(function(err, user){
		if(err) {res.status(400); return next(err);}
		res.status(201);
		res.location('/');
		res.json();
	});

    } else {
      var err = new Error('All fields required.');
      err.status = 400;
      return next(err);
    }
});


module.exports = router;