import { useState, useEffect } from 'react';
import api from '../services/api';
import { on, off } from '../services/socket';

export default function QueueStatus() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await api.get('/api/queue/status');
        setQueue(res.data.queue || res.data || []);
      } catch (err) {
        console.error('Error fetching queue:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();

    const handleUpdate = (data) => {
      setQueue(data);
    };

    on('queue_updated', handleUpdate);
    return () => off('queue_updated', handleUpdate);
  }, []);

  const handleCancel = async (id) => {
    try {
      await api.delete(`/api/queue/${id}`);
      setQueue((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Error canceling queue entry:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">File d&apos;attente</h2>
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        File d&apos;attente
        {queue.length > 0 && (
          <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {queue.length}
          </span>
        )}
      </h2>

      {queue.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucun appel en attente</p>
      ) : (
        <div className="space-y-3">
          {queue.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {entry.contact_name || entry.contact?.name || 'Contact inconnu'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.contact_phone || entry.contact?.phone || ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCancel(entry.id)}
                className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
