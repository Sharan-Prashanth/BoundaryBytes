import express from 'express';
import authRoutes from './authRoutes.js';
import teamRoutes from './teamRoutes.js';
import playerRoutes from './playerRoutes.js';
import matchRoutes from './matchRoutes.js';
import scoringRoutes from './scoringRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/teams', teamRoutes);
router.use('/players', playerRoutes);
router.use('/matches', matchRoutes);
router.use('/scoring', scoringRoutes);

router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'BoundaryBytes API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
