"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var dotenv = require("dotenv");
var dns = require("dns");
var cors = require("cors");
let Schema = mongoose.Schema;
const bodyParser = require("body-parser");
const { URL } = require("url");

var app = express();
dotenv.config();
let linkArr = [];
// Basic Configuration
var port = process.env.PORT || 3000;

mongoose.connect(
  process.env.DB_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log("Connected to MongoDB")
);

//create url model
let urlSchema = new Schema({
  url: { type: String, required: true },
  shortUrl: String,
  searchUrl: String,
});

const Url = mongoose.model("Url", urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false })); // mounting body-parser here

app.use("/public", express.static(process.cwd() + "/public"));

//Updating the list of shortened-urls
Url.find({}, (err, data) => {
  if (err) return console.error(err);
  data.map((ele) => {
    console.log(linkArr);
    linkArr.push(ele["searchUrl"]);
  });
});
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});
//post request
app.post("/api/shorturl/new", (req, res, next) => {
  let inputUrl = new URL(req.body.url);
  dns.lookup(inputUrl.host, (err) => {
    if (err) {
      res.json({ error: "invalid URL" });
      return;
    } else {
      Url.create(
        {
          url: req.body.url,
          shortUrl: mongo.ObjectID().toString().split("").slice(18).join(""), // last six characters of _id
          searchUrl:
            "/api/shorturl/" +
            mongo.ObjectID().toString().split("").slice(18).join(""),
        },
        (err, data) => {
          if (err) {
            res.sendStatus(500);
            return console.log(err);
          }
          linkArr.push(data.searchUrl);
          res.json({
            original_url: data.url,
            short_url: data.shortUrl, // last six characters of _id
          });
          return;
        }
      );
    }
  });
});
//get endpoint for shortened urls
app.get(linkArr, (req, res, next) => {
  for (let i = 0; i < linkArr.length; i++) {
    if (req.originalUrl === linkArr[i]) {
      console.log(linkArr[i] + " " + req.originalUrl);
      Url.findOne({ searchUrl: linkArr[i] }, (err, data) => {
        if (err) {
          res.sendStatus(500);
          return console.error(err);
        } else {
          console.log("you should be redirected now");
          return res.redirect(data.url);
        }
      });
    } else {
      next();
    }
  }
});

app.listen(port, function () {
  console.log("Node.js listening ...");
  console.log("View the app here: http://localhost:" + port);
});
