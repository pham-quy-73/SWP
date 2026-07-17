import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cleanUser = (raw) => {
  const email = (raw.email || '').toLowerCase().trim();
  const username = (raw.username || '').toLowerCase().trim();

  // Parse ObjectId if valid, else let MongoDB generate it
  const parsedId = raw._id && raw._id.$oid 
    ? new mongoose.Types.ObjectId(raw._id.$oid) 
    : (typeof raw._id === 'string' && mongoose.Types.ObjectId.isValid(raw._id) 
        ? new mongoose.Types.ObjectId(raw._id) 
        : null);

  const user = {
    username,
    email,
    password: raw.password || null,
    first_name: raw.first_name || raw.firstName || 'User',
    last_name: raw.last_name || raw.lastName || 'Optic',
    phone: raw.phone || null,
    dob: raw.dob ? new Date(raw.dob) : null,
    avatar_url: raw.avatar_url || null,
    is_email_verified: raw.is_email_verified !== undefined ? raw.is_email_verified : true,
    role: raw.role || (raw.roles && raw.roles[0]) || 'CUSTOMER',
    deleted_at: raw.deleted_at ? new Date(raw.deleted_at) : null,
  };

  if (parsedId) {
    user._id = parsedId;
  }
  return user;
};

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/SWP';
    console.log(`Connecting to database to seed users...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected Successfully.');

    // Read the user seed JSON file
    const jsonPath = path.join(__dirname, 'users_seed.json');
    console.log(`Reading user seed from ${jsonPath}...`);
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const rawUsers = JSON.parse(rawData);

    // Normalize user definitions
    console.log(`Normalizing ${rawUsers.length} user records...`);
    const cleanedUsers = rawUsers.map(cleanUser);

    console.log('Upserting user records to MongoDB (preserving pre-hashed passwords)...');
    for (const user of cleanedUsers) {
      // Direct raw delete to prevent duplicate keys
      await User.deleteOne({ $or: [{ username: user.username }, { email: user.email }] });
      
      // Direct raw insert to bypass Mongoose pre-save hashing middleware
      await User.collection.insertOne(user);
      console.log(` - Imported user: ${user.username} (${user.role})`);
    }

    console.log('User seeding completed successfully!');
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`Error during user seeding: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
