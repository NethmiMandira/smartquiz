const functions = require('firebase-functions/v2'); // NEW import style
const { onRequest } = require('firebase-functions/v2/https'); // For HTTPS functions
const admin = require('firebase-admin');

admin.initializeApp();

// Example: simple hello world function
exports.helloWorld = onRequest((req, res) => {
  res.send("Hello from Firebase Functions with Node 22!");
});
