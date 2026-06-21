const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ── Models ──────────────────────────────────────────
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

const Post = mongoose.model('Post', new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: String,
  createdAt: { type: Date, default: Date.now }
}));

const Comment = mongoose.model('Comment', new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: String,
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}));

// ── Auth middleware ──────────────────────────────────
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// ── Auth routes ──────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, name: user.name });
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, name: user.name });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

// ── Post routes ───────────────────────────────────
app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

app.get('/api/posts/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  res.json(post);
});

app.post('/api/posts', auth, async (req, res) => {
  const post = await Post.create({ ...req.body, author: req.user.id, authorName: req.user.name });
  res.json(post);
});

app.put('/api/posts/:id', auth, async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, author: req.user.id });
  if (!post) return res.status(403).json({ msg: 'Not authorized' });
  Object.assign(post, req.body);
  await post.save();
  res.json(post);
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.user.id });
  if (!post) return res.status(403).json({ msg: 'Not authorized' });
  await Comment.deleteMany({ post: req.params.id });
  res.json({ msg: 'Deleted' });
});

// ── Comment routes ──────────────────────────────────
app.get('/api/posts/:id/comments', async (req, res) => {
  const comments = await Comment.find({ post: req.params.id }).sort({ createdAt: 1 });
  res.json(comments);
});

app.post('/api/posts/:id/comments', auth, async (req, res) => {
  const comment = await Comment.create({
    post: req.params.id,
    author: req.user.id,
    authorName: req.user.name,
    text: req.body.text
  });
  res.json(comment);
});

app.delete('/api/comments/:id', auth, async (req, res) => {
  const comment = await Comment.findOneAndDelete({ _id: req.params.id, author: req.user.id });
  if (!comment) return res.status(403).json({ msg: 'Not authorized' });
  res.json({ msg: 'Deleted' });
});

// ── Start ────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.log(err));