const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,   
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            this.password = await argon2.hash(this.password);
        } catch (error) {
            next(error);
        }
     }

});

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        const isMatch = await argon2.verify(this.password, candidatePassword);
        return isMatch
    } catch (error) {    
        throw error
    }
};

userSchema.index({ username: "text" });

const User = mongoose.model('User', userSchema);

module.exports = User;