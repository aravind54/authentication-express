"use strict";

//Libraries
const mongoose = require("mongoose");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const redis = require("redis");
const { promisify } = require("util");

//user Model
const User = require("../schema/user.ts");

const redisClient = redis.createClient("redis://127.0.0.1:6379");

class authModule {
  constructor(props) {
    this.dbUrl = props.dbUrl;
    this.connectDb();
    this.connectToRedis();
    this.getAsync = promisify(redisClient.get).bind(redisClient);
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

  connectToRedis() {
    redisClient.on("error", error => {
      throw error;
    });
  }

  async verifyToken(token) {
    try {
      return await this.getAsync(token);
    } catch (err) {
      throw err;
    }
  }

  authenticateUser(token) {
    return async (_, res, next) => {
      if (token) {
        try {
          const userId = await this.verifyToken(token);
          if (userId) {
            next();
          } else {
            res.send({ errors: "Not authorized to view this page" });
          }
        } catch (err) {
          throw err;
        }
      } else {
        res.send({ errors: "Not authorized to view this page" });
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
        if (match) {
          await redisClient.set(user.id, user.email, redis.print);
        }
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
