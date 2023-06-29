require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000
}

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));


main().catch((err) => {
    console.log(err)
})

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/userDB");

    const userSchema = new mongoose.Schema({
        email: String,
        password: String,
    });

    // userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

    const User = new mongoose.model("User", userSchema);


    app.get("/", (req, res) => {
        res.render("home");
    });

    app.route("/login")
        .get((req, res) => {
            res.render("login");
        })
        .post((req, res) => {
            const username = req.body.username;
            const password = req.body.password;

            User.findOne({ email: username }).then((foundUser) => {
                if (foundUser) {
                    bcrypt.compare(password, foundUser.password).then(function (result) {
                        // result == true
                        if (result === true) {
                            res.render("secrets");
                        } else {
                            res.send("Incorrect Password!");
                        }
                    });
                } else {
                    res.send("Invalid login details")
                }
            }).catch((err) => {
                console.log(err);
            })

        });

    app.route("/register")
        .get((req, res) => {
            res.render("register");
        })
        .post((req, res) => {
            bcrypt.hash(req.body.password, saltRounds).then(function (hash) {
                // Store hash in your password DB.
                const newUser = new User({
                    email: req.body.username,
                    password: hash
                });

                newUser.save().then((saved) => {
                    if (saved) {
                        // res.send("User Register").status(200);
                        res.render("secrets");
                    } else {
                        res.send("User not Resgister").status(400)
                    }
                }).catch((err) => { console.log(err) })
            });


        })



    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    })
}

