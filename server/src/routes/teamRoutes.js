import express from 'express';
import { body } from 'express-validator';
import { 
  createTeam, 
  getTeams, 
  getTeam, 
  updateTeam, 
  deleteTeam,
  getTeamPlayers
} from '../controllers/teamController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.route('/')
  .get(getTeams)
  .post(
    protect, 
    authorize(ROLES.ADMIN, ROLES.SCORER),
    [
      body('name').trim().notEmpty().withMessage('Team name is required'),
      body('shortName').trim().notEmpty().isLength({ max: 5 }).withMessage('Short name is required (max 5 chars)'),
      validate
    ],
    createTeam
  );

router.route('/:id')
  .get(getTeam)
  .put(
    protect,
    authorize(ROLES.ADMIN, ROLES.SCORER),
    [
      body('name').optional().trim().notEmpty().withMessage('Team name cannot be empty'),
      body('shortName').optional().trim().isLength({ max: 5 }).withMessage('Short name max 5 chars'),
      validate
    ],
    updateTeam
  )
  .delete(protect, authorize(ROLES.ADMIN), deleteTeam);

router.get('/:id/players', getTeamPlayers);

export default router;
