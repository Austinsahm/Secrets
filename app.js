require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000
}

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


main().catch((err) => {
    console.log(err)
})

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/userDB");

    const userSchema = new mongoose.Schema({
        email: String,
        password: String,
        googleId: String,
    });

    userSchema.plugin(passportLocalMongoose);
    userSchema.plugin(findOrCreate)


    const User = new mongoose.model("User", userSchema);

    // CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
    passport.use(User.createStrategy());

    // passport.serializeUser(User.serializeUser());
    // passport.deserializeUser(User.deserializeUser());
    passport.serializeUser(function (user, cb) {
        process.nextTick(function () {
            return cb(null, {
                id: user.id,
                username: user.username,
                picture: user.picture
            });
        });
    });

    passport.deserializeUser(function (user, cb) {
        process.nextTick(function () {
            return cb(null, user);
        });
    });

    passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
        function (accessToken, refreshToken, profile, cb) {
            console.log(profile);
            User.findOrCreate({ googleId: profile.id }, function (err, user) {
                return cb(err, user);
            });
        }
    ));


    app.get("/", (req, res) => {
        res.render("home");
    });

    app.get("/auth/google",
        passport.authenticate("google", { scope: ["profile"] }));

    app.get("/auth/google/secrets",
        passport.authenticate("google", { failureRedirect: "/login" }),
        function (req, res) {
            // Successful authentication, redirect home.
            res.redirect("/secrets");
        });

    app.route("/login")
        .get((req, res) => {
            res.render("login");
        })
        .post((req, res) => {
            const user = new User({
                username: req.body.username,
                password: req.body.password
            });

            req.login(user, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    passport.authenticate("local")(req, res, function () {
                        res.redirect("/secrets");
                    })
                }

            })
        });

    app.route("/register")
        .get((req, res) => {
            res.render("register");
        })
        .post((req, res) => {
            User.register({ username: req.body.username }, req.body.password, function (err, user) {
                if (err) {
                    console.log(err);
                    res.redirect("/register");
                } else {
                    passport.authenticate("local")(req, res, function () {
                        res.redirect("/secrets");
                    })
                }
            })


        })


    app.get("/secrets", function (req, res) {
        if (req.isAuthenticated()) {
            res.render("secrets");
        } else {
            res.redirect("/login");
        }
    });


    app.get("/logout", (req, res) => {
        req.logout(function (err) {
            if (err) { return next(err); }
            res.redirect('/');
        });
    });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    })
}

