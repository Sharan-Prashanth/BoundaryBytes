# BoundaryBytes 🏏

A production-ready, real-time cricket scoring web application inspired by Cricheroes. Built with React, Node.js, MongoDB, and Socket.IO.

## Features

- ⚡ **Real-time Scoring** - Ball-by-ball live updates with Socket.IO
- 📊 **Complete Statistics** - Detailed batting, bowling and match statistics
- 👥 **Team Management** - Create and manage teams with full squads
- 🔐 **Role-based Access** - Admin, Scorer, and Viewer roles
- 🔗 **Share Live Scores** - Public links for spectators
- ↩️ **Undo Functionality** - Full ball-by-ball audit trail
- 📱 **Mobile First** - Responsive design optimized for all devices

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time updates
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### Frontend
- **React 18** with Vite
- **React Router v6** for navigation
- **Axios** for API calls
- **socket.io-client** for real-time updates
- **Context API** for state management

## Project Structure

```
BoundaryBytes/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── auth/       # Login, Register, ProtectedRoute
│   │   │   ├── home/       # Home dashboard
│   │   │   ├── layout/     # Navbar, Layout
│   │   │   ├── match/      # Match list, create, setup, details
│   │   │   ├── scoring/    # Scoring panel
│   │   │   └── team/       # Team management
│   │   ├── context/        # AuthContext, MatchContext
│   │   ├── hooks/          # useSocket
│   │   ├── services/       # API services
│   │   └── App.jsx         # Main app with routes
│   ├── .env                # Environment variables
│   └── package.json
│
└── server/                 # Node.js backend
    ├── src/
    │   ├── config/         # Database, constants
    │   ├── controllers/    # Business logic
    │   ├── middleware/     # Auth, error handling
    │   ├── models/         # Mongoose schemas
    │   ├── routes/         # API routes
    │   ├── socket/         # Socket.IO handlers
    │   ├── utils/          # Helper functions
    │   └── index.js        # Server entry point
    ├── .env                # Environment variables
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/boundarybytes
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:5173
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create team (admin/scorer)
- `GET /api/teams/:id` - Get team by ID
- `GET /api/teams/:id/players` - Get team players

### Players
- `POST /api/players` - Create player
- `POST /api/players/bulk` - Bulk create players
- `GET /api/players/:id` - Get player details

### Matches
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Create match (admin/scorer)
- `GET /api/matches/:id` - Get match details
- `POST /api/matches/:id/setup` - Setup match (select players)
- `POST /api/matches/:id/toss` - Record toss
- `POST /api/matches/:id/start` - Start match

### Scoring
- `POST /api/matches/:id/score/ball` - Record ball
- `POST /api/matches/:id/score/undo` - Undo last ball
- `POST /api/matches/:id/score/batter` - Set new batter
- `POST /api/matches/:id/score/bowler` - Set new bowler
- `POST /api/matches/:id/score/swap` - Swap batters
- `POST /api/matches/:id/score/second-innings` - Start 2nd innings

## Real-time Events (Socket.IO)

### Client to Server
- `join_match` - Subscribe to match updates
- `leave_match` - Unsubscribe from match

### Server to Client
- `ball_update` - Ball recorded
- `wicket` - Wicket fell
- `over_complete` - Over completed
- `innings_complete` - Innings finished
- `match_complete` - Match finished

## User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access - create teams, matches, score |
| Scorer | Create teams, matches, and score |
| Viewer | View matches only |

## Scoring Logic

The app handles all cricket scoring scenarios:

- **Runs**: 0-6 runs per ball
- **Extras**: Wide, No-ball, Bye, Leg-bye
- **Wickets**: All dismissal types with proper crediting
- **Strike Rotation**: Automatic on odd runs and over completion
- **Undo**: Full reversal of any ball

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

Built with ❤️ for cricket enthusiasts
