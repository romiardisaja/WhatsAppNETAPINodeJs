require("dotenv").config();
const {
    PORT: PORT
} = process.env, signalr = require("node-signalr"), serverHub = "ServerHub", signalRClient = new signalr.client(`http://127.0.0.1:${PORT}/signalr`, [serverHub]);
module.exports = {
    signalRClient: signalRClient,
    serverHub: serverHub
};