const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    publicId : {
        type: String,
        required: true,
    },
    originalName : {
        type: String,
        required: true,
    },
    url : {
        type: String,
    
    },
    mimeType : {
        type: String,
        required: true,
    },
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;