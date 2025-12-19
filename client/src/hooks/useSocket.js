import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (matchId = null) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (matchId && socketRef.current && isConnected) {
      socketRef.current.emit('join_match', matchId);
      
      return () => {
        socketRef.current.emit('leave_match', matchId);
      };
    }
  }, [matchId, isConnected]);

  const subscribe = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, (data) => {
        setLastEvent({ event, data, timestamp: Date.now() });
        callback(data);
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    lastEvent,
    subscribe,
    emit
  };
};

export const SOCKET_EVENTS = {
  JOIN_MATCH: 'join_match',
  LEAVE_MATCH: 'leave_match',
  BALL_UPDATE: 'ball_update',
  OVER_COMPLETE: 'over_complete',
  WICKET: 'wicket',
  INNINGS_COMPLETE: 'innings_complete',
  MATCH_COMPLETE: 'match_complete',
  SCORE_UPDATE: 'score_update',
  UNDO_BALL: 'undo_ball'
};
