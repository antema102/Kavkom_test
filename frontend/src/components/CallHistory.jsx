import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const resultLabels = {
  repondu: { label: 'Répondu', color: 'bg-green-100 text-green-700' },
  pas_de_reponse: { label: 'Pas de réponse', color: 'bg-yellow-100 text-yellow-700' },
  occupe: { label: 'Occupé', color: 'bg-orange-100 text-orange-700' },
  messagerie: { label: 'Messagerie', color: 'bg-blue-100 text-blue-700' },
  invalide: { label: 'Invalide', color: 'bg-red-100 text-red-700' },
};

export default function CallHistory() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/calls', {
        params: { page, limit: 20 },
      });
      setCalls(res.data.calls || res.data.data || []);
      setTotalPages(res.data.totalPages || res.data.total_pages || 1);
    } catch (err) {
      console.error('Error fetching calls:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Historique des appels</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
          <p className="text-gray-500 text-sm">Chargement...</p>
        ) : calls.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun appel enregistré</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Numéro</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Résultat</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Durée</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => {
                    const result = resultLabels[call.call_result] || {
                      label: call.call_result || '-',
                      color: 'bg-gray-100 text-gray-700',
                    };
                    return (
                      <tr key={call.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(call.started_at || call.created_at)}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {call.contact_name || call.contact?.name || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {call.contact_phone || call.contact?.phone || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${result.color}`}>
                            {result.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDuration(call.duration)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!call.call_result && (
                            <button
                              onClick={() => navigate(`/call/${call.id}/form`)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Remplir
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
