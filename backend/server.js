const express = require('express');
const cors = require('cors');
const axios = require('axios');
const WebSocket = require('ws');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with database in production)
let devices = [];
let stats = {
  totalHashrate: 0,
  totalPower: 0,
  activeDevices: 0,
  lastUpdate: null
};

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8080 });

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
// Device monitoring service
class BitaxeMonitor {
  constructor() {
    this.devices = new Map();
  }

  async addDevice(ip, name = '') {
    try {
      const response = await axios.get(`http://${ip}/api/v1/system/info`, {
        timeout: 5000
      });
      
      const device = {
        id: ip,
        ip,
        name: name || `Bitaxe-${ip}`,
        status: 'online',
        lastSeen: new Date(),
        info: response.data
      };

      this.devices.set(ip, device);
      devices = Array.from(this.devices.values());
      
      broadcast({ type: 'device_added', device });
      return device;
    } catch (error) {
      console.error(`Failed to add device ${ip}:`, error.message);
      throw new Error(`Cannot connect to device at ${ip}`);
    }
  }

  async updateDeviceStats(ip) {
    try {
      const [infoResponse, statsResponse] = await Promise.all([
        axios.get(`http://${ip}/api/v1/system/info`, { timeout: 5000 }),
        axios.get(`http://${ip}/api/v1/system/stats`, { timeout: 5000 })
      ]);

      const device = this.devices.get(ip);
      if (device) {
        device.info = infoResponse.data;
        device.stats = statsResponse.data;
        device.status = 'online';
        device.lastSeen = new Date();
        
        broadcast({ type: 'device_updated', device });
      }
    } catch (error) {
      const device = this.devices.get(ip);
      if (device) {
        device.status = 'offline';
        broadcast({ type: 'device_offline', device });
      }
      console.error(`Failed to update stats for ${ip}:`, error.message);
    }
  }

  async updateAllDevices() {
    const promises = Array.from(this.devices.keys()).map(ip => 
      this.updateDeviceStats(ip)
    );
    
    await Promise.allSettled(promises);
    this.calculateTotalStats();
  }

  calculateTotalStats() {
    const onlineDevices = Array.from(this.devices.values())
      .filter(device => device.status === 'online');

    stats = {
      totalHashrate: onlineDevices.reduce((sum, device) => 
        sum + (device.stats?.hashRate || 0), 0
      ),
      totalPower: onlineDevices.reduce((sum, device) => 
        sum + (device.stats?.power || 0), 0
      ),
      activeDevices: onlineDevices.length,
      totalDevices: this.devices.size,
      lastUpdate: new Date()
    };

    broadcast({ type: 'stats_updated', stats });
  }

  removeDevice(ip) {
    const device = this.devices.get(ip);
    if (device) {
      this.devices.delete(ip);
      devices = Array.from(this.devices.values());
      broadcast({ type: 'device_removed', device });
      return true;
    }
    return false;
  }
}

const monitor = new BitaxeMonitor();

// Routes
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

app.post('/api/devices', async (req, res) => {
  try {
    const { ip, name } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }
    
    const device = await monitor.addDevice(ip, name);
    res.json(device);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/devices/:ip', (req, res) => {
  const { ip } = req.params;
  const removed = monitor.removeDevice(ip);
  
  if (removed) {
    res.json({ message: 'Device removed successfully' });
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.get('/api/stats', (req, res) => {
  res.json(stats);
});

app.get('/api/device/:ip/info', async (req, res) => {
  try {
    const { ip } = req.params;
    const response = await axios.get(`http://${ip}/api/v1/system/info`, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch device info' });
  }
});

app.get('/api/device/:ip/stats', async (req, res) => {
  try {
    const { ip } = req.params;
    const response = await axios.get(`http://${ip}/api/v1/system/stats`, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch device stats' });
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  // Send current state to new client
  ws.send(JSON.stringify({ type: 'initial_state', devices, stats }));
  
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Schedule regular updates every 30 seconds
cron.schedule('*/30 * * * * *', () => {
  monitor.updateAllDevices();
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`WebSocket server running on port 8080`);
});
