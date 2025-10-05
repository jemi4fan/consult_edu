const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for database clearing...');
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    console.log('Starting database clearing...');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log(`Found ${collections.length} collections to clear:`);
    
    for (const collection of collections) {
      console.log(`- ${collection.name}`);
    }

    // Drop all collections
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`✅ Dropped collection: ${collection.name}`);
    }

    console.log('🎉 Database cleared successfully!');
    console.log('All collections have been removed.');
    
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the clearing process
connectDB().then(() => {
  clearDatabase();
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});
