import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // for password hashing

// Define the schema (structure of each User document)
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // removes extra spaces
    },
    email: {
      type: String,
      required: true,
      unique: true, // no duplicate emails
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // auto adds createdAt & updatedAt
);

// Add a helper method to securely hash password before saving
userSchema.pre("save", async function (next) {
  // 'this' means the user document being saved
  if (!this.isModified("passwordHash")) return next(); // only hash if password changed
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Add a method to compare password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Create and export the model
const User = mongoose.model("User", userSchema);
export default User;