const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

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

    const secret = "Thisisourlittlesecret.";
    userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

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
                    if (foundUser.password === password) {
                        res.render("secrets");
                    } else {
                        res.send("Incorrect Password!");
                    }
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
            const newUser = new User({
                email: req.body.username,
                password: req.body.password
            });

            newUser.save().then((saved) => {
                if (saved) {
                    // res.send("User Register").status(200);
                    res.render("secrets");
                } else {
                    res.send("User not Resgister").status(400)
                }
            }).catch((err) => { console.log(err) })
        })



    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    })
}

