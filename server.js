// 'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes.js');
const auth = require('./auth.js');


const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http)
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({url: URI});
app.set('view engine', 'pug');


fccTesting(app); //For FCC testing purposes

// Genereal
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(process.cwd() + '/public'));

// Set up session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}))

// Set up passport
app.use(passport.initialize());
app.use(passport.session());

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: 'express.sid',
  secret: process.env.SESSION_SECRET,
  store: store,
  success: onAuthorizeSuccess,
  fail: onAuthorizeFail
}));

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if(error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');
  
  auth(app, myDataBase);
  routes(app, myDataBase);

  let currentUsers = 0;
  io.on('connection', (socket) => {
    ++currentUsers;
    io.emit('user count', currentUsers);
    console.log('A user has connected');
    socket.on('disconnect', () => {
      console.log('A user is disconnected')
      --currentUsers;
      io.emit('user count', currentUsers);
    })
  });

}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' })
  })
})


const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});