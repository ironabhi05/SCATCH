const mongoose = require('mongoose');
const dbgr = require('debug')("development:Connection");
const config = require('config');
mongoose
    .connect(`${config.get("MONGODB_URI")}/Scatch`)
    .then(() => {
        dbgr("Database Connected Successfully💾");
    })
    .catch((err) => {
        dbgr(`Hmmm! Something went wrong ${err}`);
    })

module.exports = mongoose.connection;