"use strict";

const mongoose = require("mongoose");
const User = require("../schema/user.ts");

const jwt = require("jsonwebtoken");

class authModule {
  constructor(props) {
    this.dbUrl = props.dbUrl;
    this.connectDb();
  }
  connectDb() {
    try {
      return mongoose.connect(this.dbUrl, {
        useNewUrlParser: true,
        useCreateIndex: true
      });
    } catch (err) {
      throw err;
    }
  }

  async createUser(user) {
    try {
      const newUser = new User(user);
      return await newUser.save();
    } catch (err) {
      throw err;
    }
  }
  async login(email, password) {
    try {
      const user = await User.findOne({ email: email });
      if (user) {
        const match = await user.comparePassword(password);
        return {
          message: match ? "password Successfully verified" : "Wrong password",
          user: match ? user : null,
          accessToken: match
            ? jwt.sign({ data: user }, "SECRET", { expiresIn: "1h" })
            : null
        };
      }
      return {
        message: "No User found with that email"
      };
    } catch (err) {
      throw err;
    }
  }
  validateToken(token) {
    try {
      const decoded = jwt.verify(token, "SECRET");
      return decoded.data;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = authModule;
