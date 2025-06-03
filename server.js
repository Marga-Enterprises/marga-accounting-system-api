// Module-alias setup
require("module-alias/register");

// Load environment variables
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Core packages
const express = require("express");
const cors = require("cors");
const http = require("http");

// Sequelize connection
const sequelize = require("@config/db"); 

// Init app and server
const app = express();
const port = process.env.PORT || 4000;
const server = http.createServer(app);

// Middleware
app.use(express());
app.use(cors());

// Routes
const authRoutes = require("@routes/auth");

// Use routes
app.use("/auth", authRoutes);

// Sync Database and Start Server
sequelize
  .sync({ force: false })
  .then(() => console.log("Database synchronized..."))
  .catch((err) => console.error("Error synchronizing the database:", err))
  .finally(() => {
    server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  });
