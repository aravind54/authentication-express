const express = require("express");
const mongoose = require("mongoose");
const url = "mongodb://localhost:27017/auth-test";
mongoose.connect(url, { useNewUrlParser: true, useCreateIndex: true });

const userModel = require("./schema/user.ts");

const User = mongoose.model("User", userModel);

const app = express();

app.get("/", (req, res) => {
  try {
    const user = new User({
      firstName: "Aravind",
      lastName: "Ranjan",
      email: "aravindcranjan54@gmail.com"
    });
    user.save(error => {
      console.log(error);
      res.send(error);
    });
    // res.send(user);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

app.listen(3000, () => {
  console.log("App Listening at PORT 3000");
});
