"use strict";

const mongoose = require("mongoose");
const userModel = require("../schema/user.ts");

const jwt = require("jsonwebtoken");

class authModule {
  constructor(props) {
    this.dbUrl = props.dbUrl;
    this.connectDb();
    this.User = this.initiateUserSchema();
  }
  connectDb() {
    mongoose.connect(
      this.dbUrl,
      {
        useNewUrlParser: true,
        useCreateIndex: true
      },
      error => {
        if (error) {
          throw error;
        }
      }
    );
  }
  initiateUserSchema() {
    //export as a model from userModel
    const User = mongoose.model("User", userModel);
    return User;
  }

  createUser(user) {
    //move to Async/Await for a much cleaner approach
    return new Promise((resolve, reject) => {
      const newUser = new this.User(user);
      newUser.save(error => {
        if (error) {
          reject(error);
        } else {
          resolve(newUser);
        }
      });
    });
  }
  login(email, password) {
    //move to Async/Await for a much cleaner approach

    return new Promise((resolve, reject) => {
      this.User.findOne({ email: email }, (error, user) => {
        if (error) {
          reject(error);
        } else {
          if (user) {
            user.comparePassword(password, (err, isMatch) => {
              if (err) {
                reject(err);
              }
              if (isMatch) {
                const accessToken = jwt.sign({ data: user }, "SECRET", {
                  expiresIn: "1h" //change it from user perspective
                });
                resolve({
                  msg: "Password Successfully verified",
                  user: user,
                  acessToken: accessToken
                });
              } else {
                resolve({ msg: "Wrong Password" });
              }
            });
          } else {
            resolve({ msg: "No user found" });
          }
        }
      });
    });
  }
  validateToken(token) {
    try {
      const decoded = jwt.verify(token, "SECRET");
      return decoded.data;
    } catch (err) {
      return err;
    }
  }
}

module.exports = authModule;
