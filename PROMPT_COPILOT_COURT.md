# Prompt Court - CRM Rotation d'Appels Kavkom

## Objectif
Créer un CRM avec système intelligent de rotation d'appels utilisant les APIs Kavkom.

## Problème Actuel
- 4 commerciaux, 2 numéros sortants
- Quand 2 commerciaux appellent simultanément, les 2 autres doivent attendre
- Besoin d'un système qui gère le statut de chaque numéro indépendamment

## Solution Requise

### 1. Gestion des Statuts de Numéros
```javascript
// Statuts: "libre", "en_appel", "post_appel", "maintenance"
// Chaque numéro a son propre statut indépendant
```

### 2. Workflow
```
Commercial demande appel 
→ Système attribue numéro libre automatiquement
→ Statut → "en_appel" 
→ Appel via API Kavkom
→ Fin d'appel → "post_appel"
→ Commercial remplit fiche obligatoire
→ Validation → Numéro redevient "libre"
→ Attribution automatique au suivant en file d'attente
```

### 3. Tables Principales
```sql
-- outbound_numbers: Gérer les 2 numéros et leurs statuts
-- call_queue: File d'attente quand tous numéros occupés
-- calls_log: Historique complet des appels + fiches
-- contacts: Base de contacts à appeler
```

### 4. APIs Kavkom à Utiliser
- `/api/pbx/v1/active_call/call` - Initier appels
- `/api/crm/v1/tags/*` - Tags CRM
- `/api/pbx/v1/cdr/*` - Historique appels

### 5. Fonctionnalités Clés
- ✅ Attribution automatique du 1er numéro libre
- ✅ File d'attente si tous numéros occupés
- ✅ Formulaire obligatoire après chaque appel
- ✅ Temps réel (WebSockets) pour statuts
- ✅ Dashboard commercial avec numéros disponibles
- ✅ Statistiques et historique

### 6. Stack Technique Suggéré
```
Backend: Node.js + Express + MySQL + Socket.io + Redis
Frontend: React + TailwindCSS + Socket.io-client
```

## Question pour Copilot
"Aide-moi à créer ce système en commençant par:
1. L'architecture backend avec les modèles de données
2. La logique d'attribution/libération de numéros
3. L'intégration avec l'API Kavkom
4. Le système de temps réel pour les statuts"
