// environment variables
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// packages
const express = require("express");
const cors = require("cors");
const http = require("http");

// sequelize connection
const sequelize = require("./config/db");

// Import Routes
const app = express();
const port = process.env.PORT || 4000;
const server = http.createServer(app);

// middleware
app.use(express());
app.use(cors());

// ✅ Sync Database
sequelize
    .sync({ force: false })
    .then(() => console.log("Database synchronized..."))
    .catch((err) => console.error("Error synchronizing the database:", err))
    .finally(() => {
        server.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Server running on http://localhost:${port}`);
        });
    });