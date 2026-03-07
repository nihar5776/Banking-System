const mongoose = require('mongoose');


function mongoDBConnect(){
    mongoose.connect(process.env.Mongo_URI)
      .then(() =>{
           console.log("MongoDB Connected Successfully ");
      })
        .catch((err) =>{
            console.log("Failed To Connect The MongoDB",err.body);
            process.exit(1);
        })
}

module.exports = mongoDBConnect;