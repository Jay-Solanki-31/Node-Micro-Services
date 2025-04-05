const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
}    
}, { timestamps: true });

refreshTokenSchema.index({ expiresAt: 1 },{expireAfterSeconds:0});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;