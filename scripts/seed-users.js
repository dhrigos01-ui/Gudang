const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedUsers() {
    try {
        console.log('🌱 Starting user seeding...');

        // Hash passwords
        const adminPassword = await bcrypt.hash('adminTJA', 10);
        const user1Password = await bcrypt.hash('userTJA1', 10);
        const user2Password = await bcrypt.hash('userTJA2', 10);
        const user3Password = await bcrypt.hash('userTJA3', 10);

        // Create users
        const users = [
            {
                username: 'admin',
                password: adminPassword,
                role: 'ADMIN'
            },
            {
                username: 'user1',
                password: user1Password,
                role: 'USER'
            },
            {
                username: 'user2',
                password: user2Password,
                role: 'USER'
            },
            {
                username: 'user3',
                password: user3Password,
                role: 'USER'
            }
        ];

        // Clear existing users first
        console.log('🗑️  Clearing existing users...');
        await prisma.user.deleteMany({});

        // Create new users
        console.log('👥 Creating users...');
        const createdUsers = await Promise.all(
            users.map(user => 
                prisma.user.create({
                    data: user
                })
            )
        );

        console.log('✅ Users seeded successfully!');
        console.log('\n📋 Created users:');
        createdUsers.forEach(user => {
            console.log(`   - ${user.username} (${user.role})`);
        });

        console.log('\n🔑 Login credentials:');
        console.log('   Admin: admin / adminTJA');
        console.log('   User1: user1 / userTJA1');
        console.log('   User2: user2 / userTJA2');
        console.log('   User3: user3 / userTJA3');

    } catch (error) {
        console.error('❌ Error seeding users:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeder
seedUsers()
    .then(() => {
        console.log('\n🎉 User seeding completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 User seeding failed:', error);
        process.exit(1);
    });
