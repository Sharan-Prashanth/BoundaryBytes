export const ROLES = {
  ADMIN: 'admin',
  SCORER: 'scorer',
  VIEWER: 'viewer'
};

export const MATCH_STATUS = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned'
};

export const INNINGS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

export const DISMISSAL_TYPES = {
  BOWLED: 'bowled',
  CAUGHT: 'caught',
  LBW: 'lbw',
  RUN_OUT: 'run_out',
  STUMPED: 'stumped',
  HIT_WICKET: 'hit_wicket',
  CAUGHT_BEHIND: 'caught_behind',
  CAUGHT_AND_BOWLED: 'caught_and_bowled',
  RETIRED_HURT: 'retired_hurt',
  RETIRED_OUT: 'retired_out',
  OBSTRUCTING_FIELD: 'obstructing_field',
  HIT_BALL_TWICE: 'hit_ball_twice',
  TIMED_OUT: 'timed_out',
  HANDLED_BALL: 'handled_ball'
};

export const EXTRA_TYPES = {
  WIDE: 'wide',
  NO_BALL: 'no_ball',
  BYE: 'bye',
  LEG_BYE: 'leg_bye',
  PENALTY: 'penalty'
};

export const BALL_OUTCOMES = {
  DOT: 0,
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6
};

export const TOSS_DECISIONS = {
  BAT: 'bat',
  BOWL: 'bowl'
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
