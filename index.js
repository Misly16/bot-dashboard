const Discord = require("discord.js");
const client = new Discord.Client();
const ejs = require("ejs");
require("dotenv").config();
var express = require("express"),
  session = require("express-session"),
  passport = require("passport"),
  Strategy = require("./passport/index.js").Strategy,
  app = express();

client.once("ready", () => {
  console.log("Discord bot ready!");
});
app.use(express.static("public"));
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

var scopes = ["identify", "guilds"];
var prompt = "consent";

passport.use(
  new Strategy(
    {
      clientID: process.env.CLIENTID,
      clientSecret: process.env.CLIENTSECRET,
      callbackURL: process.env.CALLBACK,
      scope: scopes,
      prompt: prompt,
    },
    function (accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        return done(null, profile);
      });
    }
  )
);

app.use(
  session({
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.get(
  "/login",
  passport.authenticate("discord", { scope: scopes, prompt: prompt }),
  function (req, res) { }
);
app.get(
  "/callback",
  passport.authenticate("discord", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/dashboard");
  } // auth success
);
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/actioncomplete/logout");
});
//You can get rid of /user if you dont want your users to be able to see what data has been collected from their profile
app.get("/user", checkAuth, function (req, res) {
  res.json(req.user);
});


app.get("/actioncomplete/logout", function (req, res) {
  let username = req.body
  res.render(__dirname + "/views/signedout.ejs", {username});
});


// MAIN DASHBOARD
app.get("/", async function (req, res) {

  res.redirect("/login")

});
app.get("/dashboard", checkAuth, async function (req, res) {
  let username = req.user
  const fullserverlist = req.user.guilds.filter((e) => e.permissions & 0x8)
  if (!fullserverlist.length) {

    res.render(__dirname + "/views/errors/noservers.ejs");


  } else {

    res.render(__dirname + "/views/index.ejs", { fullserverlist, username });
  }

});
app.get("/dashboard/server/:id", checkAuth, async function (req, res, next) {
  let serverid = req.params.id
  let username = req.user
  let serverinfo = req.user.guilds.filter((e) => e.id == req.params.id && e.permissions & 0x8)
  if (!serverinfo.length) {
    res.render(__dirname + "/views/errors/401.ejs", {username});

  } else {
    res.render(__dirname + "/views/serverdash.ejs", { serverinfo, username });

  }
});

//CONFIG PAGES
app.get("/dashboard/server/:id/config/welcome", checkAuth, async function (req, res, next) {
  let serverid = req.params.id
  let username = req.user
  let serverinfo = req.user.guilds.filter((e) => e.id == req.params.id && e.permissions & 0x8)
  if (!serverinfo.length) {
    res.render(__dirname + "/views/errors/401.ejs", {username});

  } else {
    res.render(__dirname + "/views/welcome.ejs", { serverinfo, username });

  }
});




//ERRORS
app.use(function (req, res) {
  res.status(404);
  let username = req.user

  res.render(__dirname + "/views/errors/404.ejs", {username});
});
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

client.login(process.env.TOKEN);
app.listen(8000, function (err) {
  if (err) return console.log(err);
  console.log("Serving at http://localhost:8000/");
});
