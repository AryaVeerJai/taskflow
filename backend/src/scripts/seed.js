/**
 * Seed script — creates demo admin + user + sample tasks
 * Usage: node src/scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const logger = require('../utils/logger');

const SEED_USERS = [
  {
    name: 'Admin User',
    email: 'admin@taskflow.dev',
    password: 'Admin123!',
    role: 'admin',
    isActive: true,
  },
  {
    name: 'Jane Smith',
    email: 'jane@taskflow.dev',
    password: 'User1234!',
    role: 'user',
    isActive: true,
  },
  {
    name: 'Bob Johnson',
    email: 'bob@taskflow.dev',
    password: 'User1234!',
    role: 'user',
    isActive: true,
  },
];

const TASK_TEMPLATES = [
  { title: 'Design system architecture', description: 'Plan microservices, DB schema, and API contracts', status: 'done', priority: 'high', tags: ['architecture', 'planning'] },
  { title: 'Implement JWT authentication', description: 'Access + refresh tokens with rotation', status: 'done', priority: 'high', tags: ['auth', 'security'] },
  { title: 'Write API documentation', description: 'Swagger + Postman collection', status: 'in-progress', priority: 'medium', tags: ['docs', 'api'] },
  { title: 'Add rate limiting', description: 'Protect auth endpoints from brute force', status: 'done', priority: 'high', tags: ['security'] },
  { title: 'Set up Docker Compose', description: 'MongoDB + Backend + Frontend in containers', status: 'in-progress', priority: 'medium', tags: ['devops', 'docker'] },
  { title: 'Write unit tests', description: 'Cover controllers, middleware, and validators', status: 'todo', priority: 'medium', tags: ['testing'] },
  { title: 'Configure CI/CD pipeline', description: 'GitHub Actions for lint, test, and deploy', status: 'todo', priority: 'low', tags: ['devops', 'ci'] },
  { title: 'Performance testing', description: 'Load test with k6 — target 1000 RPS', status: 'todo', priority: 'low', tags: ['testing', 'performance'] },
  { title: 'Add Redis caching', description: 'Cache task stats and admin dashboard', status: 'todo', priority: 'low', tags: ['caching', 'redis'] },
  { title: 'Set up monitoring', description: 'Prometheus + Grafana dashboards', status: 'todo', priority: 'low', tags: ['monitoring', 'devops'] },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB');

    // Clear existing
    await User.deleteMany({});
    await Task.deleteMany({});
    logger.info('Cleared existing data');

    // Create users
    const users = await User.create(SEED_USERS);
    logger.info(`Created ${users.length} users`);

    // Create tasks for each user
    const [admin, jane, bob] = users;
    const allTasks = [];

    TASK_TEMPLATES.forEach((template, i) => {
      const owner = i % 3 === 0 ? admin._id : i % 3 === 1 ? jane._id : bob._id;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (i * 3 - 5)); // Mix of past and future dates
      allTasks.push({ ...template, owner, dueDate });
    });

    const tasks = await Task.create(allTasks);
    logger.info(`Created ${tasks.length} tasks`);

    logger.info('\n✅ Seed complete!\n');
    logger.info('Demo accounts:');
    SEED_USERS.forEach(u => {
      logger.info(`  ${u.role.padEnd(6)} | ${u.email.padEnd(24)} | password: ${u.password}`);
    });

    process.exit(0);
  } catch (err) {
    logger.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
