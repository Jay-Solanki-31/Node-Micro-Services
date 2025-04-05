const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    users: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    mediaIds: [
        {
            type: String,
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });


postSchema.index({ content: 'text' });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
