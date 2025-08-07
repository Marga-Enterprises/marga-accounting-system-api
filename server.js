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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Routes
const authRoutes = require("@routes/auth");
const departmentRoutes = require("@routes/department");
const clientRoutes = require("@routes/client");
const clientDepartmentRoutes = require("@routes/clientdepartment");
const billingRoutes = require("@routes/billing");
const machineROutes = require("@routes/machine");
const collectionRoutes = require("@routes/collection");
const paymentRoutes = require("@routes/payment");

// Use routes
app.use("/auth", authRoutes);
app.use("/department", departmentRoutes);
app.use("/client", clientRoutes);
app.use("/clientdepartment", clientDepartmentRoutes);
app.use("/billing", billingRoutes);
app.use("/machine", machineROutes);
app.use("/collection", collectionRoutes);
app.use("/payment", paymentRoutes);

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
