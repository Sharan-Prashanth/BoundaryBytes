import express from 'express';
import { body } from 'express-validator';
import { 
  createMatch, 
  getMatches, 
  getMatch, 
  getMatchByPublicLink,
  updateMatch,
  updateMatchPlayers,
  setToss,
  startMatch,
  deleteMatch,
  getLiveMatches
} from '../controllers/matchController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/live', getLiveMatches);

router.get('/public/:publicLink', getMatchByPublicLink);

router.route('/')
  .get(optionalAuth, getMatches)
  .post(
    protect, 
    authorize(ROLES.ADMIN, ROLES.SCORER),
    [
      body('teamA').isMongoId().withMessage('Valid team A ID is required'),
      body('teamB').isMongoId().withMessage('Valid team B ID is required'),
      body('totalOvers').isInt({ min: 1, max: 50 }).withMessage('Total overs must be between 1 and 50'),
      body('venue').optional().trim(),
      body('matchDate').optional().isISO8601().withMessage('Invalid date format'),
      validate
    ],
    createMatch
  );

router.route('/:id')
  .get(getMatch)
  .put(
    protect,
    authorize(ROLES.ADMIN, ROLES.SCORER),
    [
      body('venue').optional().trim(),
      body('matchDate').optional().isISO8601().withMessage('Invalid date format'),
      validate
    ],
    updateMatch
  )
  .delete(protect, authorize(ROLES.ADMIN), deleteMatch);

router.put('/:id/players',
  protect,
  authorize(ROLES.ADMIN, ROLES.SCORER),
  [
    body('teamAPlayers').optional().isArray(),
    body('teamBPlayers').optional().isArray(),
    validate
  ],
  updateMatchPlayers
);

router.put('/:id/toss',
  protect,
  authorize(ROLES.ADMIN, ROLES.SCORER),
  [
    body('winner').isMongoId().withMessage('Valid team ID is required'),
    body('decision').isIn(['bat', 'bowl']).withMessage('Decision must be bat or bowl'),
    validate
  ],
  setToss
);

router.post('/:id/start',
  protect,
  authorize(ROLES.ADMIN, ROLES.SCORER),
  [
    body('openingBatters').isArray({ min: 2, max: 2 }).withMessage('Exactly 2 opening batters required'),
    body('openingBatters.*').isMongoId().withMessage('Valid player IDs required'),
    body('openingBowler').isMongoId().withMessage('Valid bowler ID required'),
    validate
  ],
  startMatch
);

export default router;
