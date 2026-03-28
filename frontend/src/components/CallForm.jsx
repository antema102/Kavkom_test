import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const callResults = [
  { value: 'repondu', label: 'Répondu' },
  { value: 'pas_de_reponse', label: 'Pas de réponse' },
  { value: 'occupe', label: 'Occupé' },
  { value: 'messagerie', label: 'Messagerie' },
  { value: 'invalide', label: 'Numéro invalide' },
];

const tagOptions = [
  'Prospect chaud',
  'Prospect froid',
  'Demande de rappel',
  'RDV à planifier',
  'Devis demandé',
];

const nextActions = [
  { value: 'rappeler', label: 'Rappeler' },
  { value: 'envoyer_devis', label: 'Envoyer un devis' },
  { value: 'rdv_commercial', label: 'RDV commercial' },
  { value: 'aucune', label: 'Aucune' },
];

export default function CallForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    call_result: '',
    notes: '',
    tags: [],
    next_action: '',
    next_call_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTagToggle = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.call_result) {
      setError('Veuillez sélectionner un résultat d\'appel');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post(`/api/calls/${id}/form`, formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Formulaire post-appel</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Call result */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Résultat de l&apos;appel *
          </label>
          <div className="space-y-2">
            {callResults.map((result) => (
              <label
                key={result.value}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="call_result"
                  value={result.value}
                  checked={formData.call_result === result.value}
                  onChange={(e) =>
                    setFormData({ ...formData, call_result: e.target.value })
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{result.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <label
                key={tag}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                  formData.tags.includes(tag)
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.tags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
            rows={4}
            placeholder="Notes sur l'appel..."
          />
        </div>

        {/* Next action */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Prochaine action
          </label>
          <div className="space-y-2">
            {nextActions.map((action) => (
              <label
                key={action.value}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="next_action"
                  value={action.value}
                  checked={formData.next_action === action.value}
                  onChange={(e) =>
                    setFormData({ ...formData, next_action: e.target.value })
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{action.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Next call date */}
        {formData.next_action === 'rappeler' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date du prochain appel
            </label>
            <input
              type="datetime-local"
              value={formData.next_call_date}
              onChange={(e) =>
                setFormData({ ...formData, next_call_date: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Envoi...' : 'Soumettre'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
