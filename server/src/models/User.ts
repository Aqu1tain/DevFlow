import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcrypt";

export type UserType = "guest" | "free" | "pro";
export type Role = "user" | "admin";

export interface IUser extends Document {
  userType: UserType;
  email?: string;
  password?: string;
  username: string;
  githubId?: string;
  isGuest: boolean;
  guestSessionId?: string;
  guestExpiresAt?: Date;
  role: Role;
  totpSecret?: string;
  totpEnabled: boolean;
  stripeCustomerId?: string;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  isGuestExpired(): boolean;
}

interface UserModel extends Model<IUser> {
  createGuest(): Promise<IUser>;
}

const userSchema = new Schema<IUser>(
  {
    userType: {
      type: String,
      enum: ["guest", "free", "pro"],
      default: "free",
      required: true,
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
      validate: {
        validator(this: IUser, v: string) {
          if (this.userType === "guest" || this.githubId) return true;
          return /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(v);
        },
        message: "Invalid email",
      },
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      default: () => `user_${Date.now()}`,
    },
    githubId: { type: String, sparse: true, default: null },
    isGuest: { type: Boolean, default: false },
    guestSessionId: { type: String, sparse: true, default: null },
    guestExpiresAt: { type: Date, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    totpSecret: { type: String, select: false },
    totpEnabled: { type: Boolean, default: false },
    stripeCustomerId: { type: String, default: null, index: true, sparse: true },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 });
userSchema.index({ guestSessionId: 1 });
userSchema.index({ githubId: 1 }, { sparse: true, unique: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isGuest || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isGuestExpired = function () {
  if (!this.isGuest || !this.guestExpiresAt) return false;
  return new Date() > this.guestExpiresAt;
};

const ANIMALS = [
  "capybara", "pangolin", "axolotl", "quokka", "narwhal", "ocelot", "fennec",
  "wombat", "tardigrade", "chameleon", "platypus", "lemur", "otter", "mantis",
  "gecko", "falcon", "lynx", "panda", "toucan", "bison", "cobra", "dingo",
  "eagle", "ferret", "heron", "ibis", "jackal", "koala", "moose", "newt",
  "osprey", "puffin", "raven", "sloth", "tapir", "urchin", "viper", "walrus",
  "yak", "zebra", "badger", "crane", "dove", "elk", "fox", "goose", "hawk",
  "iguana", "jay", "kiwi", "lark", "mole", "owl", "parrot", "robin", "swan",
];

userSchema.statics.createGuest = async function () {
  const taken = new Set(
    (await this.find({ isGuest: true, guestExpiresAt: { $gt: new Date() } }).select("username"))
      .map((u: IUser) => u.username),
  );
  const available = ANIMALS.filter((a) => !taken.has(`guest_${a}`));
  const pick = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

  return this.create({
    userType: "guest",
    isGuest: true,
    username: `guest_${pick}`,
    guestSessionId: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    guestExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
};

const User = mongoose.model<IUser, UserModel>("User", userSchema);

export default User;
