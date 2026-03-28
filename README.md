# CRM Kavkom - Système de Rotation d'Appels

CRM avec système de rotation d'appels intelligent utilisant les APIs Kavkom.

## Architecture

- **Backend**: Node.js + Express + Sequelize (SQLite) + Socket.io
- **Frontend**: React + Vite + TailwindCSS + Socket.io-client

## Démarrage Rapide

### Backend

```bash
cd backend
cp .env.example .env    # Configurer les variables d'environnement
npm install
npm run seed            # Créer les données de test
npm run dev             # Démarrer le serveur (port 3001)
```

### Frontend

```bash
cd frontend
npm install
npm run dev             # Démarrer le serveur de développement (port 5173)
```

### Comptes de Test

| Utilisateur   | Mot de passe | Rôle       |
|---------------|-------------|------------|
| admin         | admin123    | Admin      |
| commercial1   | pass123     | Commercial |
| commercial2   | pass123     | Commercial |
| commercial3   | pass123     | Commercial |
| commercial4   | pass123     | Commercial |

## Tests

```bash
cd backend
npm test
```

## API Endpoints

| Méthode | Endpoint                | Description                    |
|---------|------------------------|--------------------------------|
| POST    | /api/auth/login        | Authentification               |
| GET     | /api/numbers/status    | Statut des numéros sortants    |
| POST    | /api/calls/request     | Demander un numéro pour appeler|
| POST    | /api/calls/initiate    | Initier l'appel via Kavkom     |
| PUT     | /api/calls/:id/end     | Terminer l'appel               |
| POST    | /api/calls/:id/form    | Remplir la fiche post-appel    |
| GET     | /api/calls/history     | Historique des appels          |
| GET     | /api/queue/status      | État de la file d'attente      |
| DELETE  | /api/queue/:id         | Retirer de la file d'attente   |
| GET     | /api/dashboard/stats   | Statistiques du jour           |
| GET     | /api/contacts          | Liste des contacts             |
| POST    | /api/contacts          | Créer un contact               |
| GET     | /api/health            | Health check                   |

## WebSocket Events

- `number_status_changed` - Mise à jour des statuts des numéros
- `queue_updated` - Mise à jour de la file d'attente