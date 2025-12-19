import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Team from './src/models/Team.js';
import Player from './src/models/Player.js';

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Team.deleteMany({});
    await Player.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@boundarybytes.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });
    console.log('Created admin user: admin@boundarybytes.com / admin123');

    // Create scorer user
    const scorerUser = await User.create({
      name: 'Scorer User',
      email: 'scorer@boundarybytes.com',
      password: 'scorer123',
      role: 'scorer',
      isActive: true
    });
    console.log('Created scorer user: scorer@boundarybytes.com / scorer123');

    // Create viewer user
    const viewerUser = await User.create({
      name: 'Viewer User',
      email: 'viewer@boundarybytes.com',
      password: 'viewer123',
      role: 'viewer',
      isActive: true
    });
    console.log('Created viewer user: viewer@boundarybytes.com / viewer123');

    // Create Team A - Mumbai Strikers
    const teamA = await Team.create({
      name: 'Mumbai Strikers',
      shortName: 'MS',
      createdBy: adminUser._id
    });

    // Create Team B - Chennai Kings
    const teamB = await Team.create({
      name: 'Chennai Kings',
      shortName: 'CK',
      createdBy: adminUser._id
    });

    console.log('Created teams: Mumbai Strikers & Chennai Kings');

    // Create players for Mumbai Strikers
    const mumbaiPlayers = [
      { name: 'Rohit Sharma', role: 'batsman', battingStyle: 'right_hand', bowlingStyle: 'right_arm_off_spin' },
      { name: 'Shikhar Dhawan', role: 'batsman', battingStyle: 'left_hand', bowlingStyle: 'none' },
      { name: 'Virat Kohli', role: 'batsman', battingStyle: 'right_hand', bowlingStyle: 'none' },
      { name: 'Hardik Pandya', role: 'all_rounder', battingStyle: 'right_hand', bowlingStyle: 'right_arm_medium' },
      { name: 'Ravindra Jadeja', role: 'all_rounder', battingStyle: 'left_hand', bowlingStyle: 'left_arm_orthodox' },
      { name: 'Rishabh Pant', role: 'wicket_keeper', battingStyle: 'left_hand', bowlingStyle: 'none' },
      { name: 'Jasprit Bumrah', role: 'bowler', battingStyle: 'right_hand', bowlingStyle: 'right_arm_fast' },
      { name: 'Mohammed Shami', role: 'bowler', battingStyle: 'right_hand', bowlingStyle: 'right_arm_fast' },
      { name: 'Yuzvendra Chahal', role: 'bowler', battingStyle: 'right_hand', bowlingStyle: 'right_arm_leg_spin' },
      { name: 'Bhuvneshwar Kumar', role: 'bowler', battingStyle: 'right_hand', bowlingStyle: 'right_arm_medium' },
      { name: 'KL Rahul', role: 'batsman', battingStyle: 'right_hand', bowlingStyle: 'none' }
    ];

    for (const player of mumbaiPlayers) {
      await Player.create({
        ...player,
        team: teamA._id,
        createdBy: adminUser._id
      });
    }
    console.log('Created 11 players for Mumbai Strikers');

    // Create players for Chennai Kings
    const chennaiPlayers = [
      { name: 'MS Dhoni', role: 'wicket_keeper', battingStyle: 'right_hand', bowlingStyle: 'none' },
      { name: 'Suresh Raina', role: 'batsman', battingStyle: 'left_hand', bowlingStyle: 'right_arm_off_spin' },
      { name: 'Faf du Plessis', role: 'batsman', battingStyle: 'right_hand', bowlingStyle: 'none' },
      { name: 'Ruturaj Gaikwad', role: 'batsman', battingStyle: 'right_hand', bowlingStyle: 'none' },
      { name: 'Moeen Ali', role: 'all_rounder', battingStyle: 'left_hand', bowlingStyle: 'right_arm_off_spin' },
      { name: 'Dwayne Bravo', role: 'all_rounder', battingStyle: 'right_hand', bowlingStyle: 'right_arm_medium' },
      { name: 'Deepak Chahar', role: 'bowler', battingStyle: 'right_hand', bowlingStyle: 'right_arm_medium' },
      { name: 'Shardul Thakur', role: 'bowler', battingStyle: 'right_hand', bowlingStyle: 'right_arm_medium' },
      { name: 'Ravichandran Ashwin', role: 'bowler', battingStyle: 'right_hand', bowlingStyle: 'right_arm_off_spin' },
      { name: 'Tushar Deshpande', role: 'bowler', battingStyle: 'right_hand', bowlingStyle: 'right_arm_fast' },
      { name: 'Ambati Rayudu', role: 'batsman', battingStyle: 'right_hand', bowlingStyle: 'none' }
    ];

    for (const player of chennaiPlayers) {
      await Player.create({
        ...player,
        team: teamB._id,
        createdBy: adminUser._id
      });
    }
    console.log('Created 11 players for Chennai Kings');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('  Admin:  admin@boundarybytes.com / admin123');
    console.log('  Scorer: scorer@boundarybytes.com / scorer123');
    console.log('  Viewer: viewer@boundarybytes.com / viewer123');
    console.log('\n🏏 Teams Created:');
    console.log('  - Mumbai Strikers (MS) - 11 players');
    console.log('  - Chennai Kings (CK) - 11 players');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
