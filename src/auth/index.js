"use strict";

// Libraries

const mongo = require("mongoose");
const jwt = require("jsonwebtoken");
const redis = require("redis");
const { promisify } = require("util");

// user Model
const User = require("../schema/user.js");

class authModule {
  constructor(props) {
    if (!props.dbUrl) throw "Please provide a mongodb url";
    this.jwtSecret = props.jwtSecret ? props.jwtSecret : "SECRET";
    this.expiresIn = props.expiresIn ? props.expiresIn : "1h";
    this.connectDb(props.dbUrl);
    if (props.serverSideSession) {
      this.redisClient = this.checkRedisConnection(props.redisUrl);
      this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
      this.login = this.serverSideSessionLogin.bind(this);
      this.authenticateUser = this.authenticateUserForServerSideSession.bind(this);
    } else {
      this.login = this.loginForJWT.bind(this);
      this.authenticateUser = this.authenticateUserForJwt.bind(this);
    }
  }
  connectDb(url) {
    try {
      return mongo.connect(url, {
        useNewUrlParser: true,
        useCreateIndex: true,
      });
    } catch (err) {
      throw err;
    }
  }

  checkRedisConnection(url) {
    const redisClient = redis.createClient(url);
    redisClient.on("error", error => {
      throw error;
    });
    return redisClient;
  }

  async verifyRedisToken(token) {
    try {
      const accessToken = await this.getAsync(token);
      return this.validateJWTtoken(accessToken);
    } catch (err) {
      throw err;
    }
  }

  authenticateUserForServerSideSession(token) {
    if (!this.redisClient) throw "Issue with Redis Connection.Please provide redisUrl";
    return async (_, res, next) => {
      if (token) {
        try {
          const userId = await this.verifyRedisToken(token);
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

  authenticateUserForJwt(token) {
    return async (_, res, next) => {
      if (token) {
        try {
          const user = await this.validateJWTtoken(token);
          if (user) {
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

  async verifyUsernameAndPassword(email, password) {
    try {
      const user = await User.findOne({ email: email });
      if (user) {
        const match = await user.comparePassword(password);
        return {
          match: match,
          user: user,
        };
      }
      return {
        match: false,
        user: null,
      };
    } catch (err) {
      throw err;
    }
  }

  jwtSign(user) {
    return jwt.sign({ data: user }, this.jwtSecret, { expiresIn: this.expiresIn });
  }

  async serverSideSessionLogin(email, password) {
    try {
      const { match, user } = await this.verifyUsernameAndPassword(email, password);
      const accessToken = this.jwtSign(user);
      match ? await this.redisClient.set(user.id, accessToken, redis.print) : null;
      return {
        message: match ? "Password Successfully verified" : "Authentication not Successful",
        user: match ? user : null,
        cookieSecret: match ? user.id : null,
      };
    } catch (err) {
      throw err;
    }
  }

  async loginForJWT(email, password) {
    try {
      const { match, user } = await this.verifyUsernameAndPassword(email, password);
      if (match) {
        const accessToken = jwt.sign({ data: user }, this.jwtSecret, { expiresIn: "1h" });
        return {
          message: "Password Successfully verified",
          user,
          accessToken,
        };
      } else {
        return {
          message: "Authentication not Successful",
        };
      }
    } catch (err) {
      throw err;
    }
  }

  validateJWTtoken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded.data;
    } catch (err) {
      return null;
    }
  }
}

module.exports = authModule;
