const express = require("express");
const auth = require("./auth/index.js");

const bodyParser = require("body-parser");

const url = "mongodb://localhost:27017/auth-test";
const redisUrl = "redis://127.0.0.1:6379";

const authModule = new auth({ dbUrl: url, redisUrl: redisUrl, jwtSecret: "SECRET", serverSideSession: true });

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));

// app.use(
//   authModule.setCookie({
//     secret: "SECRET"
//   })
// );

app.get("/", authModule.authenticateUser("5c9fbba2e02abd3b0ad5cbcb"), (req, res) => {
  try {
    authModule
      .createUser({
        firstName: "Aravind",
        lastName: "C Ranjan",
        email: "aravindcranjan12@gmail.com",
        password: "HELLLLOOO",
      })
      .then(user => {
        //handle success here
        res.send(user);
      })
      .catch(err => {
        //handle error conditions here
        res.send(err);
      });
  } catch (err) {
    res.send(err);
  }
});

app.post("/login", (req, res) => {
  authModule
    .login(req.body.email, req.body.password)
    .then(message => {
      res.send(message);
    })
    .catch(err => {
      res.send(err);
    });
});
app.post("/validate", (req, res) => {
  const user = authModule.validateJWTtoken(req.body.token);
  console.log(user);
  res.send(user);
});

app.listen(3000, () => {
  console.log("App Listening at PORT 3000");
});
