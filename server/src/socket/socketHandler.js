import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { SOCKET_EVENTS } from '../config/constants.js';

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          socket.user = user;
        }
      }
      
      next();
    } catch (error) {
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.JOIN_MATCH, (matchId) => {
      socket.join(`match_${matchId}`);
      console.log(`Socket ${socket.id} joined match_${matchId}`);
      
      socket.emit('joined_match', { matchId, message: 'Successfully joined match room' });
    });

    socket.on(SOCKET_EVENTS.LEAVE_MATCH, (matchId) => {
      socket.leave(`match_${matchId}`);
      console.log(`Socket ${socket.id} left match_${matchId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
};

export const emitToMatch = (io, matchId, event, data) => {
  io.to(`match_${matchId}`).emit(event, data);
};

export const emitScoreUpdate = (io, matchId, innings) => {
  io.to(`match_${matchId}`).emit(SOCKET_EVENTS.SCORE_UPDATE, {
    matchId,
    innings: {
      inningsNumber: innings.inningsNumber,
      totalRuns: innings.totalRuns,
      totalWickets: innings.totalWickets,
      currentOver: innings.currentOver,
      currentOverBalls: innings.currentOverBalls,
      runRate: innings.runRate,
      requiredRunRate: innings.requiredRunRate,
      target: innings.target
    },
    timestamp: new Date().toISOString()
  });
};

export const emitBallUpdate = (io, matchId, ball, innings, currentOver) => {
  io.to(`match_${matchId}`).emit(SOCKET_EVENTS.BALL_UPDATE, {
    matchId,
    ball: {
      overNumber: ball.overNumber,
      ballNumber: ball.ballNumber,
      runs: ball.runs,
      isWicket: ball.isWicket,
      extras: ball.extras,
      striker: ball.striker,
      bowler: ball.bowler
    },
    innings: {
      totalRuns: innings.totalRuns,
      totalWickets: innings.totalWickets,
      currentOver: innings.currentOver,
      currentOverBalls: innings.currentOverBalls,
      runRate: innings.runRate
    },
    currentOver: {
      overNumber: currentOver.overNumber,
      runs: currentOver.runs,
      wickets: currentOver.wickets,
      legalBalls: currentOver.legalBalls
    },
    timestamp: new Date().toISOString()
  });
};

export const emitWicket = (io, matchId, wicket, innings) => {
  io.to(`match_${matchId}`).emit(SOCKET_EVENTS.WICKET, {
    matchId,
    wicket,
    innings: {
      totalRuns: innings.totalRuns,
      totalWickets: innings.totalWickets,
      fallOfWickets: innings.fallOfWickets
    },
    timestamp: new Date().toISOString()
  });
};

export const emitOverComplete = (io, matchId, over, innings) => {
  io.to(`match_${matchId}`).emit(SOCKET_EVENTS.OVER_COMPLETE, {
    matchId,
    over: {
      overNumber: over.overNumber,
      runs: over.runs,
      wickets: over.wickets,
      isMaiden: over.isMaiden,
      bowler: over.bowler
    },
    innings: {
      currentOver: innings.currentOver,
      runRate: innings.runRate
    },
    timestamp: new Date().toISOString()
  });
};

export const emitInningsComplete = (io, matchId, innings) => {
  io.to(`match_${matchId}`).emit(SOCKET_EVENTS.INNINGS_COMPLETE, {
    matchId,
    innings: {
      inningsNumber: innings.inningsNumber,
      totalRuns: innings.totalRuns,
      totalWickets: innings.totalWickets,
      totalOvers: innings.currentOver,
      totalBalls: innings.totalBalls,
      status: innings.status
    },
    timestamp: new Date().toISOString()
  });
};

export const emitMatchComplete = (io, matchId, match) => {
  io.to(`match_${matchId}`).emit(SOCKET_EVENTS.MATCH_COMPLETE, {
    matchId,
    result: match.result,
    status: match.status,
    timestamp: new Date().toISOString()
  });
};
