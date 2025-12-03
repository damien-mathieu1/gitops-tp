const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'appdb',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
});

// Redis connection
let redisClient;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

(async () => {
  try {
    redisClient = redis.createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Redis connection failed:', err.message);
  }
})();

// Initialize database table
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        visitor_count INTEGER
      )
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
};

initDb();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.ENVIRONMENT || 'unknown'
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'GitOps Backend API',
    version: '1.0.0',
    environment: process.env.ENVIRONMENT || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  });
});

// Get visitor count from Redis
app.get('/api/visits', async (req, res) => {
  try {
    let count = 0;

    if (redisClient && redisClient.isOpen) {
      count = await redisClient.get('visitor_count') || 0;
      count = parseInt(count) + 1;
      await redisClient.set('visitor_count', count);
    } else {
      console.warn('Redis not available, using default count');
    }

    // Store in PostgreSQL
    await pool.query('INSERT INTO visits (visitor_count) VALUES ($1)', [count]);

    res.json({
      visits: count,
      message: 'Visit recorded successfully',
      cached: redisClient && redisClient.isOpen
    });
  } catch (err) {
    console.error('Error processing visit:', err.message);
    res.status(500).json({ error: 'Failed to process visit' });
  }
});

// Get visit history from database
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM visits ORDER BY timestamp DESC LIMIT 10'
    );
    res.json({
      history: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching history:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
});

// Test Redis connection
app.get('/api/redis-test', async (req, res) => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.set('test', 'hello');
      const value = await redisClient.get('test');
      res.json({
        status: 'connected',
        test: value
      });
    } else {
      res.status(503).json({
        status: 'disconnected',
        message: 'Redis client not available'
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.ENVIRONMENT || 'development'}`);
  console.log(`Log Level: ${process.env.LOG_LEVEL || 'info'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await pool.end();
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
  process.exit(0);
});
