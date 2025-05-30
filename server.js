import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import prisma from './config/prisma.config.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // Allow cookies from frontend
  })
);

// Routes
app.use('/api/auth', authRoutes);

// Port
const PORT = process.env.PORT || 5000;

// Start server with DB connection
async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully!');

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}.`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down server...');
      await prisma.$disconnect();
      console.log('Disconnected from PostgreSQL database.');
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown); // Ctrl+C
    process.on('SIGTERM', shutdown); // Kill command or container stop
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

startServer();
