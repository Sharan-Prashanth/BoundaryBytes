import express from 'express';
import { body } from 'express-validator';
import { 
  recordBall,
  undoLastBall,
  setNewBatter,
  setNewBowler,
  swapBatters,
  startSecondInnings,
  getInnings,
  getCurrentOver,
  getBallEvents
} from '../controllers/scoringController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES, DISMISSAL_TYPES, EXTRA_TYPES } from '../config/constants.js';

const router = express.Router();

router.post('/:matchId/ball',
  protect,
  authorize(ROLES.ADMIN, ROLES.SCORER),
  [
    body('runs').optional().isInt({ min: 0, max: 7 }).withMessage('Runs must be between 0 and 7'),
    body('extras.type').optional().isIn([...Object.values(EXTRA_TYPES), null]),
    body('extras.runs').optional().isInt({ min: 0 }),
    body('isWicket').optional().isBoolean(),
    body('wicket.dismissalType').optional().isIn(Object.values(DISMISSAL_TYPES)),
    body('wicket.batter').optional().isMongoId(),
    body('wicket.bowler').optional().isMongoId(),
    body('wicket.fielder').optional().isMongoId(),
    validate
  ],
  recordBall
);

router.post('/:matchId/undo',
  protect,
  authorize(ROLES.ADMIN, ROLES.SCORER),
  undoLastBall
);

router.post('/:matchId/batter',
  protect,
  authorize(ROLES.ADMIN, ROLES.SCORER),
  [
    body('batterId').isMongoId().withMessage('Valid batter ID required'),
    body('isStriker').optional().isBoolean(),
    validate
  ],
  setNewBatter
);

router.post('/:matchId/bowler',
  protect,
  authorize(ROLES.ADMIN, ROLES.SCORER),
  [
    body('bowlerId').isMongoId().withMessage('Valid bowler ID required'),
    validate
  ],
  setNewBowler
);

router.post('/:matchId/swap',
  protect,
  authorize(ROLES.ADMIN, ROLES.SCORER),
  swapBatters
);

router.post('/:matchId/second-innings',
  protect,
  authorize(ROLES.ADMIN, ROLES.SCORER),
  [
    body('openingBatters').isArray({ min: 2, max: 2 }).withMessage('Exactly 2 opening batters required'),
    body('openingBatters.*').isMongoId().withMessage('Valid player IDs required'),
    body('openingBowler').isMongoId().withMessage('Valid bowler ID required'),
    validate
  ],
  startSecondInnings
);

router.get('/:matchId/innings/:inningsNumber', getInnings);

router.get('/:matchId/current-over', getCurrentOver);

router.get('/:matchId/innings/:inningsNumber/balls', getBallEvents);

export default router;
