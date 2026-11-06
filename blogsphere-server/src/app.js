const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/error');
const { sendError } = require('./utils/response');
const { getSitemap, getRobots } = require('./controllers/seoController');

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Request loggers in development
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Behind a proxy/load balancer (Render, Railway, Heroku, Nginx) so req.protocol and rate limits use the real client
if (env.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

// SEO: sitemap generated from published articles + robots.txt for this host
app.get('/sitemap.xml', getSitemap);
app.get('/robots.txt', getRobots);

// Mount API routes
app.use('/api/v1', routes);

// 404 handler for unrecognized routes
app.use((req, res) => {
  return sendError(res, 404, `Endpoint not found: ${req.method} ${req.originalUrl}`);
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
