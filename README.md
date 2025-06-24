# BAM2 - Bitaxe Monitor v2

A modern, full-stack Bitaxe monitoring application with real-time updates and a clean web interface.

## 🏗️ Architecture

This application is split into two main components:

- **Backend**: Node.js/Express API server with WebSocket support
- **Frontend**: React application with real-time updates

## 📁 Project Structure

```
bam2/
├── backend/
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic services
│   │   ├── models/          # Data models
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── server.js            # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── public/
│   ├── package.json
│   └── index.html
├── docs/                   # Documentation
├── docker-compose.yml      # Docker orchestration
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- Docker (optional, for containerized deployment)

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Start Development Servers

```bash
# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend  
cd frontend
npm run dev
```

### 3. Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **WebSocket**: ws://localhost:8080

## 🔄 Migration from bitaxe-monitor

### Step 1: Backup Current Configuration

```bash
cd c:/dev/bitaxe-monitor

# Export current device list (if stored in files)
# Backup any configuration files
# Note current device IPs and settings
```

### Step 2: Identify Components to Migrate

Review your existing `bitaxe-monitor` codebase and identify:

1. **Device discovery logic** → Move to `backend/src/services/`
2. **Data polling/monitoring** → Integrate into `BitaxeMonitor` class
3. **UI components** → Recreate as React components
4. **Configuration settings** → Move to environment variables
5. **Database/storage** → Implement in backend services

### Step 3: Migration Checklist

- [ ] List all current devices and their configurations
- [ ] Identify custom features or modifications
- [ ] Migrate device polling intervals
- [ ] Recreate any custom dashboards or views
- [ ] Transfer historical data (if applicable)
- [ ] Test all existing functionality

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
PORT=3001
NODE_ENV=development
WS_PORT=8080
POLLING_INTERVAL=30000
DB_PATH=./data/devices.db
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_API_BASE=http://localhost:3001/api
VITE_WS_URL=ws://localhost:8080
VITE_POLLING_INTERVAL=30000
```

## 📡 API Endpoints

### Device Management

- `GET /api/devices` - List all devices
- `POST /api/devices` - Add new device
- `DELETE /api/devices/:ip` - Remove device
- `GET /api/device/:ip/info` - Get device info
- `GET /api/device/:ip/stats` - Get device stats

### Statistics

- `GET /api/stats` - Get overall statistics

### WebSocket Events

- `device_added` - New device added
- `device_updated` - Device stats updated
- `device_offline` - Device went offline
- `device_removed` - Device removed
- `stats_updated` - Overall stats updated

## 🎯 Features

### Current Features

- ✅ Real-time device monitoring
- ✅ WebSocket updates
- ✅ Device management (add/remove)
- ✅ Aggregate statistics
- ✅ Responsive web interface
- ✅ Docker support

### Planned Features

- [ ] Historical data storage
- [ ] Alerts and notifications
- [ ] Performance charts and graphs
- [ ] Device grouping
- [ ] Export functionality
- [ ] Mobile app
- [ ] Multi-user support

## 🛠️ Development

### Backend Development

```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
npm test     # Run tests
npm run lint # Run linting
```

### Frontend Development

```bash
cd frontend
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket connection fails**
   - Check if port 8080 is available
   - Verify firewall settings
   - Ensure backend is running

2. **Device discovery fails**
   - Verify device IP addresses
   - Check network connectivity
   - Confirm Bitaxe API is accessible

3. **Frontend won't connect to backend**
   - Verify API_BASE URL in frontend config
   - Check CORS settings in backend
   - Ensure backend is running on correct port

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Original bitaxe-monitor project
- Bitaxe hardware team
- Open source community