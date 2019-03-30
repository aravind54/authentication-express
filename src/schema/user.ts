// const mongoose = require('mongoose');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const SALT_WORK_FACTOR = 10;

const schema = mongoose.Schema;

const userSchema = new schema({
  firstName: String,
  lastName: String,
  password: {
    type: String,
    required: [true, "Password is required"],
    validate: {
      validator: function(v: any) {
        if (v.length >= 6) {
          return true;
        }
        return false;
      },
      message: (props: any) => "Please provide a non empty password",
    },
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: {
      unique: true,
      dropDups: true,
    },
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
  },
});

userSchema.index({
  email: 1,
});

userSchema.pre("save", function(next: any): any {
  let user: any = this;
  if (!user.isModified("password")) return next();
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err: any, salt: any) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function(err: any, hash: any) {
      if (err) return next(err);

      // override the cleartext password with the hashed one
      user.password = hash;
      user.updatedAt = Date.now();
      next();
    });
  });
});

userSchema.methods.comparePassword = async function(candidatePassword: string) {
  try {
    const match = await bcrypt.compare(candidatePassword, this.password);
    return match;
  } catch (err) {
    return err;
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
