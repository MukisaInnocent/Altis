// Delegator entry point.
//
// Hosting panels (Hostinger included) often auto-detect a file named server.js, app.js or
// index.js in the application root and run it directly, ignoring the configured start command.
// This file used to be a standalone SQLite-only HTTP server, which meant that when the panel
// picked it, the deployed app never touched MySQL at all.
//
// It now simply hands over to the Next.js server, which bootstraps the database (creating the
// schema and seed rows) and serves the API routes. Every entry point in this project -
// server.js, src/server.js, hostinger-start.cjs and `npm start` - therefore runs the same app.
import './src/server.js';
