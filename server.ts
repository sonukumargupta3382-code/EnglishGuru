import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-english-guru';
const USERS_FILE = path.join(process.cwd(), 'users.json');

app.use(express.json());
app.use(cookieParser());

// Helper functions for users
async function getUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveUsers(users: any[]) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// API Routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const users = await getUsers();
  if (users.find((u: any) => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: hashPassword(password),
    progress: {
      completedLessons: [],
      xp: 0
    },
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  await saveUsers(users);

  const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
  
  const { passwordHash, ...userWithoutPassword } = newUser;
  res.json({ user: userWithoutPassword });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = await getUsers();
  const user = users.find((u: any) => u.email === email);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
  
  const { passwordHash, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const users = await getUsers();
    const user = users.find((u: any) => u.id === decoded.id);
    
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ success: true });
});

app.post('/api/user/progress', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const users = await getUsers();
    const userIndex = users.findIndex((u: any) => u.id === decoded.id);
    
    if (userIndex === -1) return res.status(401).json({ error: 'User not found' });
    
    const { lessonId, xpGained } = req.body;
    
    if (!users[userIndex].progress.completedLessons.includes(lessonId)) {
      users[userIndex].progress.completedLessons.push(lessonId);
    }
    users[userIndex].progress.xp += xpGained || 0;
    
    await saveUsers(users);
    
    const { passwordHash, ...userWithoutPassword } = users[userIndex];
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
