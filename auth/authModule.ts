"use strict";

const mongoose = require("mongoose");
const userModel = require("../schema/user.ts");

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
    const User = mongoose.model("User", userModel);
    return User;
  }

  createUser(user) {
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
                resolve({ msg: "Password Successfully verified", user: user });
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
}

module.exports = authModule;
