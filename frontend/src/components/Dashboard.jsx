import { useState, useEffect } from 'react';
import api from '../services/api';
import NumberStatus from './NumberStatus';
import QueueStatus from './QueueStatus';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-500 mb-1">Appels du jour</p>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : (stats?.calls_today ?? 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-500 mb-1">Taux de réponse</p>
          <p className="text-3xl font-bold text-green-600">
            {loading ? '...' : `${stats?.response_rate ?? 0}%`}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-500 mb-1">Durée totale</p>
          <p className="text-3xl font-bold text-blue-600">
            {loading ? '...' : formatDuration(stats?.total_duration ?? 0)}
          </p>
        </div>
      </div>

      {/* Real-time panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NumberStatus />
        <QueueStatus />
      </div>

      {/* Next contact */}
      {stats?.next_contact && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Prochain contact à appeler</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{stats.next_contact.name}</p>
              <p className="text-sm text-gray-500">{stats.next_contact.phone}</p>
              {stats.next_contact.company && (
                <p className="text-sm text-gray-400">{stats.next_contact.company}</p>
              )}
            </div>
            <button
              onClick={async () => {
                try {
                  await api.post('/api/calls/request', {
                    contact_id: stats.next_contact.id,
                  });
                } catch (err) {
                  console.error('Error requesting call:', err);
                }
              }}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Appeler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
