/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const Discord = require('discord.js');

const client = new Discord.Client();
const ejs = require('ejs');
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('./passport/index.js');

const app = express();

client.once('ready', () => {
  console.log('Discord bot ready!');
});
app.use(express.static('public'));
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
// You can add email if you want to collect that.
const scopes = ['identify', 'guilds'];
const prompt = 'consent';

passport.use(
  new Strategy(
    {
      clientID: process.env.CLIENTID,
      clientSecret: process.env.CLIENTSECRET,
      callbackURL: process.env.CALLBACK,
      scope: scopes,
      prompt,
    },
    ((accessToken, refreshToken, profile, done) => {
      process.nextTick(() => done(null, profile));
    }),
  ),
);

app.use(
  session({
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.get(
  '/login',
  passport.authenticate('discord', { scope: scopes, prompt }),
  (req, res) => {},
);
app.get(
  '/callback',
  passport.authenticate('discord', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }, // auth success
);
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/actioncomplete/logout');
});
// You can get rid of /user if you dont want your users to be able to see what
// data has been collected from their profile
app.get('/user', checkAuth, (req, res) => {
  res.json(req.user);
});

app.get('/actioncomplete/logout', (req, res) => {
  const username = req.body;
  res.render(`${__dirname}/views/signedout.ejs`, { username });
});

// MAIN DASHBOARD
app.get('/', async (req, res) => {
  res.redirect('/login');
});
app.get('/dashboard', checkAuth, async (req, res) => {
  const username = req.user;
  const fullserverlist = req.user.guilds.filter((e) => e.permissions & 0x8);
  if (!fullserverlist.length) {
    res.render(`${__dirname}/views/errors/noservers.ejs`);
  } else {
    res.render(`${__dirname}/views/index.ejs`, { fullserverlist, username });
  }
});
app.get('/dashboard/server/:id', checkAuth, async (req, res, next) => {
  const serverid = req.params.id;
  const username = req.user;
  const serverinfo = req.user.guilds.filter(
    (e) => e.id === req.params.id && e.permissions & 0x8,
  );
  if (!serverinfo.length) {
    // This will happen if that server doesnt exist either
    res.render(`${__dirname}/views/errors/401.ejs`, { username });
  } else {
    res.render(`${__dirname}/views/serverdash.ejs`, { serverinfo, username });
  }
});

// CONFIG PAGES
app.get('/dashboard/server/:id/config/welcome', checkAuth, async (
  req,
  res,
  next,
) => {
  const serverid = req.params.id;
  const username = req.user;
  const serverinfo = req.user.guilds.filter(
    (e) => e.id === req.params.id && e.permissions & 0x8,
  );
  if (!serverinfo.length) {
    res.render(`${__dirname}/views/errors/401.ejs`, { username });
  } else {
    res.render(`${__dirname}/views/welcome.ejs`, { serverinfo, username });
  }
});

// ERRORS
app.use((req, res) => {
  res.status(404);
  const username = req.user;

  res.render(`${__dirname}/views/errors/404.ejs`, { username });
});
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

client.login(process.env.TOKEN);
app.listen(8000, (err) => {
  if (err) return console.log(err);
  console.log('Serving at http://localhost:8000/');
});
