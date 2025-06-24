import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Wifi, WifiOff, Zap, Cpu, TrendingUp } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:8080';

function App() {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({
    totalHashrate: 0,
    totalPower: 0,
    activeDevices: 0,
    totalDevices: 0,
    lastUpdate: null
  });
  const [newDeviceIP, setNewDeviceIP] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ws, setWs] = useState(null);

  // WebSocket connection
  useEffect(() => {
    const websocket = new WebSocket(WS_URL);
    
    websocket.onopen = () => {
      console.log('Connected to WebSocket');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'initial_state':
          setDevices(data.devices);
          setStats(data.stats);
          break;
        case 'device_added':
        case 'device_updated':
          setDevices(prev => {
            const updated = prev.filter(d => d.id !== data.device.id);
            return [...updated, data.device];
          });
          break;
        case 'device_removed':
          setDevices(prev => prev.filter(d => d.id !== data.device.id));
          break;
        case 'stats_updated':
          setStats(data.stats);
          break;
        default:
          break;
      }
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      websocket.close();
    };
  }, []);

  // Initial data load
  useEffect(() => {
    fetchDevices();
    fetchStats();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch(`${API_BASE}/devices`);
      const data = await response.json();
      setDevices(data);
    } catch (error) {
      setError('Failed to fetch devices');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      setError('Failed to fetch stats');
    }
  };

  const addDevice = async () => {
    if (!newDeviceIP) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip: newDeviceIP,
          name: newDeviceName
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add device');
      }
      
      setNewDeviceIP('');
      setNewDeviceName('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeDevice = async (ip) => {
    try {
      const response = await fetch(`${API_BASE}/devices/${ip}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove device');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const formatHashrate = (hashrate) => {
    if (hashrate > 1000000000000) {
      return `${(hashrate / 1000000000000).toFixed(2)} TH/s`;
    } else if (hashrate > 1000000000) {
      return `${(hashrate / 1000000000).toFixed(2)} GH/s`;
    } else if (hashrate > 1000000) {
      return `${(hashrate / 1000000).toFixed(2)} MH/s`;
    } else if (hashrate > 1000) {
      return `${(hashrate / 1000).toFixed(2)} KH/s`;
    }
    return `${hashrate.toFixed(2)} H/s`;
  };

  const formatPower = (power) => {
    return `${power.toFixed(1)} W`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bitaxe Monitor</h1>
          <p className="text-gray-600">Monitor and manage your Bitaxe mining devices</p>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Hashrate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatHashrate(stats.totalHashrate)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Power</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPower(stats.totalPower)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Cpu className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Devices</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeDevices}/{stats.totalDevices}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Wifi className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Update</p>
                <p className="text-sm font-bold text-gray-900">
                  {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Device Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Device</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Device IP Address (e.g., 192.168.1.100)"
              value={newDeviceIP}
              onChange={(e) => setNewDeviceIP(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Device Name (optional)"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addDevice}
              disabled={loading || !newDeviceIP}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {loading ? 'Adding...' : 'Add Device'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Devices List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Devices</h2>
          </div>
          <div className="p-6">
            {devices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No devices added yet. Add your first Bitaxe device above.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => (
                  <div key={device.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{device.name}</h3>
                      <div className="flex items-center gap-2">
                        {device.status === 'online' ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <button
                          onClick={() => removeDevice(device.ip)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">IP:</span>
                        <span className="font-mono">{device.ip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-semibold ${
                          device.status === 'online' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {device.status}
                        </span>
                      </div>
                      {device.stats && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Hashrate:</span>
                            <span className="font-semibold">
                              {formatHashrate(device.stats.hashRate || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Power:</span>
                            <span className="font-semibold">
                              {formatPower(device.stats.power || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Temperature:</span>
                            <span className="font-semibold">
                              {device.stats.temperature || 0}°C
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Seen:</span>
                        <span className="text-xs text-gray-500">
                          {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;