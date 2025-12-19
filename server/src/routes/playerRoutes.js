import express from 'express';
import { body } from 'express-validator';
import { 
  createPlayer, 
  getPlayers, 
  getPlayer, 
  updatePlayer, 
  deletePlayer,
  createMultiplePlayers
} from '../controllers/playerController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.route('/')
  .get(getPlayers)
  .post(
    protect, 
    authorize(ROLES.ADMIN, ROLES.SCORER),
    [
      body('name').trim().notEmpty().withMessage('Player name is required'),
      body('team').isMongoId().withMessage('Valid team ID is required'),
      body('role').optional().isIn(['batsman', 'bowler', 'all_rounder', 'wicket_keeper']),
      body('battingStyle').optional().isIn(['right_hand', 'left_hand']),
      validate
    ],
    createPlayer
  );

router.post('/bulk',
  protect,
  authorize(ROLES.ADMIN, ROLES.SCORER),
  [
    body('team').isMongoId().withMessage('Valid team ID is required'),
    body('players').isArray({ min: 1 }).withMessage('At least one player is required'),
    body('players.*.name').trim().notEmpty().withMessage('Player name is required'),
    validate
  ],
  createMultiplePlayers
);

router.route('/:id')
  .get(getPlayer)
  .put(
    protect,
    authorize(ROLES.ADMIN, ROLES.SCORER),
    [
      body('name').optional().trim().notEmpty().withMessage('Player name cannot be empty'),
      validate
    ],
    updatePlayer
  )
  .delete(protect, authorize(ROLES.ADMIN), deletePlayer);

export default router;
