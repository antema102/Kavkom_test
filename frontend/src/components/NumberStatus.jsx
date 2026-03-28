import { useState, useEffect } from 'react';
import api from '../services/api';
import { on, off } from '../services/socket';

const statusConfig = {
  libre: { label: 'Libre', color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
  en_appel: { label: 'En appel', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
  post_appel: { label: 'Post-appel', color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
  maintenance: { label: 'Maintenance', color: 'bg-gray-100 text-gray-800 border-gray-200', dot: 'bg-gray-500' },
};

export default function NumberStatus() {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNumbers = async () => {
      try {
        const res = await api.get('/api/numbers/status');
        setNumbers(res.data.numbers || res.data || []);
      } catch (err) {
        console.error('Error fetching numbers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNumbers();

    const handleUpdate = (data) => {
      setNumbers(data);
    };

    on('number_status_changed', handleUpdate);
    return () => off('number_status_changed', handleUpdate);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Numéros sortants</h2>
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Numéros sortants</h2>
      {numbers.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucun numéro configuré</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {numbers.map((num) => {
            const config = statusConfig[num.status] || statusConfig.maintenance;
            return (
              <div
                key={num.id || num.number}
                className={`border rounded-lg p-4 ${config.color}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{num.number}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                    <span className="text-xs font-medium">{config.label}</span>
                  </div>
                </div>
                {num.current_contact && (
                  <p className="text-xs mt-2 opacity-75">
                    En ligne : {num.current_contact}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
