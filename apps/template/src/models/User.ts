import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends mongoose.Document {
  email: string
  password: string
  name?: string
  firstName?: string
  lastName?: string
  image?: string
  emailVerified?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password should be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    name: String,
    firstName: String,
    lastName: String,
    image: String,
    emailVerified: Date,
  },
  {
    timestamps: true,
  }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw error
  }
}

// Delete password when converting to JSON
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password
    return ret
  },
})

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema)

export default User 