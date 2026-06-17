const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const errorMiddleware = require('./middlewares/error.middleware');
const ApiError = require('./utils/ApiError');

const app = express();

// ─── Middlewares ────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((_req, _res, next) => {
  next(ApiError.notFound('The requested endpoint does not exist.'));
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
