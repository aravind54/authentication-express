const express = require("express");
const auth = require("./auth/authModule.ts");

const bodyParser = require("body-parser");

const url = "mongodb://localhost:27017/auth-test";

const authModule = new auth({ dbUrl: url });

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
  const user = authModule.validateToken(req.body.token);
  res.send(user);
});

app.listen(3000, () => {
  console.log("App Listening at PORT 3000");
});
