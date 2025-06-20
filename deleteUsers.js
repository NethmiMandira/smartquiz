// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with the service account credentials
const serviceAccount = require('./serviceAccountKey.json'); // Path to your service account key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

// Function to delete all users
const deleteAllUsers = async () => {
  try {
    let batchSize = 1000; // Firebase only allows you to delete users in batches of 1000
    let nextPageToken;
    
    do {
      const listUsersResult = await auth.listUsers(batchSize, nextPageToken);
      
      listUsersResult.users.forEach(async (userRecord) => {
        console.log(`Deleting user: ${userRecord.uid}`);
        await auth.deleteUser(userRecord.uid);
      });

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken); // Loop until all users are deleted
    
    console.log('All users have been deleted');
  } catch (error) {
    console.error('Error deleting users:', error);
  }
};

// Run the function
deleteAllUsers();
