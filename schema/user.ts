// const mongoose = require('mongoose');
let mongoose = require("mongoose");
const schema = mongoose.Schema;

const userSchema = new schema({
  firstName: String,
  lastName: String,
  password: String,
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: {
      unique: true,
      dropDups: true
    },
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  updatedAt: {
    type: Date
  }
});

userSchema.index({
  email: 1
});

userSchema.pre("save", next => {
  this.updatedAt = Date.now();
  next();
});

module.exports = userSchema;
