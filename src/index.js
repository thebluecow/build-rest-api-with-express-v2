'use strict';

// load modules
var express = require('express');
var morgan = require('morgan');
var jsonParser = require('body-parser').json;
var mongoose = require('mongoose');
var seeder = require('mongoose-seeder');
var data = require('./data/data.json');
// include routes
var routes = require('./routes/routes');

var app = express();

// set our port
app.set('port', process.env.PORT || 5000);

// morgan gives us http request logging
app.use(morgan('dev'));

// parse json from requests
app.use(jsonParser());

// connect to local mongodb
mongoose.connect('mongodb://localhost:27017/restapi');

var db = mongoose.connection;

db.on('error', function(err){
	console.error('connection error:', err);
});

db.once('open', function(){
	console.log('db connection successful');
  
  // once the connection has been established, seed the database
  seeder.seed(data, {dropDatabase: true}).then(function(db) {
      console.log('the database has been seeded with data.');
  }).catch(function(err) {
      console.error(err);
  });;
});

// setup our static route to serve files from the "public" folder
app.use('/', express.static('public'));

// use routes defined in "routes/routes.js"
app.use('/api', routes);

// catch 404 and forward to global error handler
app.use(function(req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// Express's global error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  /*res.render('error', {
    message: err.message,
    error: {}
  });*/
  res.json({
    error: {
      message: err.message
    }
  });
});

// start listening on our port
var server = app.listen(app.get('port'), function() {
  console.log('Express server is listening on port ' + server.address().port);
});
