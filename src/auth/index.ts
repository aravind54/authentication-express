"use strict";

// Libraries
declare function require(name: string): any;

const mongo = require("mongoose");
const jwt = require("jsonwebtoken");
const redis = require("redis");
const { promisify } = require("util");

// user Model
const User = require("../schema/user.ts");

type Props = {
  dbUrl: string;
  jwtSecret: string;
  expiresIn: string;
  serverSideSession: boolean;
  redisUrl: string;
};

type verifyUser = {
  match: boolean;
  user: any;
};

class authModule {
  jwtSecret: string;
  expiresIn: string;
  redisClient: any;
  getAsync: any;
  login: any;
  authenticateUser: any;
  constructor(props: Props) {
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
  connectDb(url: string) {
    try {
      return mongo.connect(url, {
        useNewUrlParser: true,
        useCreateIndex: true,
      });
    } catch (err) {
      throw err;
    }
  }

  checkRedisConnection(url: string) {
    const redisClient = redis.createClient(url);
    redisClient.on("error", (error: any) => {
      throw error;
    });
    return redisClient;
  }

  async verifyRedisToken(token: string) {
    try {
      const accessToken = await this.getAsync(token);
      return this.validateJWTtoken(accessToken);
    } catch (err) {
      throw err;
    }
  }

  authenticateUserForServerSideSession(token: string): any {
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

  authenticateUserForJwt(token: string) {
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

  async createUser(user: any) {
    try {
      const newUser = new User(user);
      return await newUser.save();
    } catch (err) {
      throw err;
    }
  }

  async verifyUsernameAndPassword(email: string, password: string): Promise<verifyUser> {
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

  jwtSign(user: any) {
    return jwt.sign({ data: user }, this.jwtSecret, { expiresIn: this.expiresIn });
  }

  async serverSideSessionLogin(email: string, password: string) {
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

  async loginForJWT(email: string, password: string) {
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

  validateJWTtoken(token: string) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded.data;
    } catch (err) {
      return null;
    }
  }
}

module.exports = authModule;
