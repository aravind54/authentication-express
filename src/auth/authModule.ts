"use strict";

//Libraries
const mongoose = require("mongoose");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

//user Model
const User = require("../schema/user.ts");

class authModule {
  constructor(props) {
    this.dbUrl = props.dbUrl;
    this.connectDb();
  }
  connectDb() {
    try {
      return mongoose.connect(this.dbUrl, {
        useNewUrlParser: true,
        useCreateIndex: true,
      });
    } catch (err) {
      throw err;
    }
  }

  setCookie(options) {
    //Rename it as validateLogin or authenticateUser
    //setCookie on Login if User wants it which he sets it up in Options.Default Value will be JWT
    //if session he can provide redis url which will be used to provide session storage,default will be mongodb storage which is required
    //cookie npm module will be used to setHeaders and parseHeaders in server side session storage
    //secure:true,re sign cookie everytime or different jwt everytime
    //mongo or redis storage will have userid saved and signed and stored.Nothing else is required
    //secure:true needs to have update for new session storage as re-sign will be there
    //Need to write as a express middleware.Make sure everything else works too(not now.Maybe in next version)
    //use req.session variable.or not something which can be used to find by end user?

    console.log(options);
    return (req, res, next) => {
      if (req.session) next();
      else {
        console.log("Inside here");
        next();
      }
    };
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
          message: match ? "Password Successfully verified" : "Wrong password",
          user: match ? user : null,
          accessToken: match ? jwt.sign({ data: user }, "SECRET", { expiresIn: "1h" }) : null,
        };
      }
      return {
        message: "No User found with that email",
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
