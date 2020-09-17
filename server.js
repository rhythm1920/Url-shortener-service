"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var dotenv = require("dotenv");
var cors = require("cors");
let Schema = mongoose.Schema;
const bodyParser = require("body-parser");

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
});

const Url = mongoose.model("Url", urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false })); // mounting body-parser here

app.use("/public", express.static(process.cwd() + "/public"));

//Updating the list of shortened-urls
Url.find({}, (err, data) => {
  if (err) return console.error(err);
  data.map((ele) => {
    linkArr.push(ele["shortUrl"]);
  });
});
//post request
app.post("/api/shorturl/new", (req, res) => {
  Url.create(
    {
      url: req.body.url,
      //constructing the short url(ex. http://localhost:3000/)
      shortUrl:
        req.protocol + // http
        "://" +
        req.hostname + // localhost
        ":" +
        port + // 3000
        "/" +
        mongo.ObjectId(), // _id
    },
    (err) => {
      if (err) return console.log(err);
    }
  );
  Url.findOne({ url: req.body.url }, (err, data) => {
    if (err) return console.log(err);
    linkArr.push(data.shortUrl);
    res.json({
      original_url: data.url,
      short_url: data.shortUrl,
    });
  });
});

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.listen(port, function () {
  console.log("Node.js listening ...");
  console.log("View the app here: http://localhost:" + port);
});
