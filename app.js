const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require("cors");

const app = express();

mongoose.set('strictQuery', true);

const JWT_SECRET = "d0d9dc77406ef8cf1f1d461335680c2699db2354816c8077526441907d76d647";

mongoose.connect('mongodb+srv://hasanovtunar2008:qbgAuXKRpbcCW5zr@cluster0.reof277.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

const User = mongoose.model('User', userSchema);

// CORS settings
app.use(cors({ origin: '*' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static('public'));

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'Token required.' });
  }

  const tokenParts = token.split(' ');
  if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
    return res.status(403).json({ message: 'Invalid token format.' });
  }

  jwt.verify(tokenParts[1], JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    req.user = decoded;
    next();
  });
};

// Routes
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  try {
    const { userId, email, password } = req.body;

    // Check if userId or email already exists
    const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User ID or Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      userId,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Authentication Failed"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Authentication Failed"
      });
    }

    const jwtToken = jwt.sign(
      { email: user.email, userId: user.userId },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expiration time set to 1 minute
    );

    res.cookie('token', jwtToken, { httpOnly: true });

    return res.status(200).json({
      accessToken: jwtToken,
      userId: user.userId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    return res.status(200).json({
      message: `User ${user.email}`,
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
