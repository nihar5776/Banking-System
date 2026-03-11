const { v7: uuidv7 } = require('uuid');

function uniqueIdGeneration() {
   return uuidv7();   
}

module.exports = {
   uniqueIdGeneration
}



