const mongoose = require("mongoose");

//we r goin to embed this schema into the hotel schema
const bookingSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    userId:{
        type: String,
        required: true,
    },
    adultcnt:{
        type: Number,
        required: true,
    
    },
    childcnt:{
        type: Number,
        required: true,
    
    },
    checkIn:{
        type: Date,
        required: true,
    }, 
    checkOut:{
        type: Date,
        required: true,
    },
    totalCost:{
        type: Number,
        required: true,
    },
    starRate:{
        type:Number
    }

})
const hotelSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true,
    },
    name:{
        type: String,
        required: true,
    },
    city:{
        type: String,
        required: true,
    },
    country:{
        type: String,
        required: true,
    },
    desc:{
        type: String,
        required: true,
    },
    price:{
        type: Number,
        required: true,
    },
    type:{
        type: String,
        required: true,
    },
    facilities:{
        type: [String],
        required: true,
    },
    adults:{
        type: Number,
        required: true,
    },
    child:{
        type: Number,
        required: true,
    },
    starRating:{
        type: Number,
        min:1,
        max:5,
    },
    numRooms:{
        type:Number,
    },
    imageUrls:{
        type: [String],
    },
    phone:{
        type : Number
    },
    lastUpdated:{
        type: Date,
    },
    bookings: [bookingSchema],

})

const hotelSchemaModel = mongoose.model('hotelSchemaModel',hotelSchema)

module.exports = hotelSchemaModel;