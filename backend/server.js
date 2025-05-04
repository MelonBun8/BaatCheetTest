const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db")
const userRoutes = require("./routes/userRoutes")
const passport = require("./config/passport")
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");
const setupWebSocketServer = require('./server/websocketServer');

// loading environment variables
dotenv.config();

// connect to the database
connectDB();

const app = express();

// Enable CORS for the React app
app.use(cors({
  origin: 'http://localhost:3000', // or your frontend URL
  credentials: true
}));

// Body parser middleware
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// Adjust Google OAuth callback to work with frontend
app.get("/api/auth/google/callback", passport.authenticate("google", { session: false }), (req, res) => {
  if (!req.user) {
    return res.redirect('/login?error=Google%20authentication%20failed');
  }

  const token = req.user.token;
  const userData = encodeURIComponent(JSON.stringify(req.user.user));
  
  // Redirect to the frontend with token and user data
  res.redirect(`/auth/google/callback?token=${token}&user=${userData}`);
});

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));

// Setup WebSocket server
setupWebSocketServer(server);