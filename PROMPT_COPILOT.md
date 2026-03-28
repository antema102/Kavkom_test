# Prompt pour Copilot - Développement CRM avec Rotation d'Appels Kavkom

## Contexte du Projet

Je souhaite développer un CRM complet avec système de rotation d'appels intelligent utilisant les APIs Kavkom. Le CRM actuel de Kavkom est trop limité pour mes besoins spécifiques.

## Problématique à Résoudre

### Configuration Actuelle
- **4 commerciaux** qui effectuent des appels
- **2 numéros sortants** disponibles (phone_number_1 et phone_number_2)

### Problème Rencontré
Lorsque deux commerciaux appellent simultanément:
1. Commercial A utilise phone_number_1 → Statut: "en appel"
2. Commercial B utilise phone_number_2 → Statut: "en appel"
3. Commercial C et D doivent ATTENDRE que l'un des numéros redevienne "libre"
4. Actuellement, TOUS les numéros sont bloqués même si un seul est utilisé

### Comportement Souhaité
- Gestion intelligente du statut de chaque numéro indépendamment
- Rotation automatique des numéros disponibles
- Les commerciaux C et D peuvent voir en temps réel quel numéro est libre
- Quand Commercial A ou B termine son appel ET remplit sa fiche d'appel, le numéro redevient immédiatement disponible
- Attribution automatique du prochain numéro libre au prochain commercial

## Fonctionnalités Requises

### 1. Gestion des Statuts de Numéros en Temps Réel
```
Statuts possibles pour chaque numéro:
- "libre" : Numéro disponible pour un appel
- "en_appel" : Numéro actuellement utilisé
- "post_appel" : Appel terminé, en attente de saisie de fiche
- "maintenance" : Numéro temporairement désactivé
```

### 2. Système de Rotation Intelligent
- Attribution automatique du premier numéro disponible
- File d'attente pour les commerciaux quand tous les numéros sont occupés
- Priorité configurable (FIFO, priorité commercial, etc.)

### 3. Workflow d'Appel Complet
```
Étapes:
1. Commercial sélectionne un contact à appeler
2. Système vérifie les numéros disponibles
3. Attribution automatique d'un numéro libre
4. Mise à jour du statut → "en_appel"
5. Utilisation de l'API Kavkom pour initier l'appel
6. Fin d'appel → Statut "post_appel"
7. Commercial remplit la fiche d'appel (résultat, notes, tags)
8. Validation de la fiche → Statut "libre"
9. Numéro disponible pour le prochain commercial
```

### 4. Tableau de Bord pour Commerciaux
- Visualisation en temps réel des numéros disponibles
- File d'attente visible si tous les numéros sont occupés
- Position dans la file d'attente
- Notifications quand un numéro se libère

### 5. Fiche d'Appel à Remplir
Champs obligatoires après chaque appel:
- Résultat de l'appel (répondu, pas de réponse, occupé, etc.)
- Tags CRM (à choisir via API tags)
- Notes de l'appel
- Prochaine action (rappel, rendez-vous, abandon)
- Date de rappel si nécessaire

## APIs Kavkom à Utiliser

### APIs Principales
1. **PBX Active Calls** - `/api/pbx/v1/active_call/call`
   - Initier les appels sortants
   - Paramètres: domain_uuid, src (extension), destination

2. **CRM Tags** - `/api/crm/v1/tags/*`
   - Assigner des tags aux appels
   - Gérer les catégories de résultats

3. **PBX Extension** - `/api/pbx/v1/extension/*`
   - Récupérer les informations des extensions/commerciaux
   - Gérer les numéros sortants

4. **PBX Call Details Records** - `/api/pbx/v1/cdr/*`
   - Enregistrer l'historique des appels
   - Télécharger les enregistrements d'appels

5. **PBX User** - `/api/pbx/v1/user/*`
   - Gérer les commerciaux/utilisateurs

## Architecture Technique Souhaitée

### Backend (à développer)
```
Technologies suggérées:
- Node.js + Express OU Laravel (PHP)
- Base de données: MySQL/PostgreSQL
- WebSockets pour le temps réel (Socket.io)
- Cache Redis pour les statuts en temps réel
```

### Tables de Base de Données Nécessaires

```sql
-- Table des numéros sortants
CREATE TABLE outbound_numbers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(20) UNIQUE,
    status ENUM('libre', 'en_appel', 'post_appel', 'maintenance'),
    current_user_id INT NULL,
    current_call_id INT NULL,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Table de la file d'attente
CREATE TABLE call_queue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    contact_id INT,
    priority INT DEFAULT 0,
    status ENUM('en_attente', 'en_cours', 'termine', 'annule'),
    assigned_number_id INT NULL,
    queued_at TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL
);

-- Table des appels effectués
CREATE TABLE calls_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    contact_id INT,
    outbound_number_id INT,
    extension_uuid VARCHAR(255),
    destination_number VARCHAR(20),
    call_status ENUM('en_cours', 'termine', 'echoue'),
    call_result ENUM('repondu', 'pas_de_reponse', 'occupe', 'invalide') NULL,
    duration INT NULL,
    recording_file VARCHAR(255) NULL,
    notes TEXT NULL,
    tags JSON NULL,
    next_action VARCHAR(50) NULL,
    next_call_date TIMESTAMP NULL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP NULL,
    form_filled_at TIMESTAMP NULL
);

-- Table des contacts à appeler
CREATE TABLE contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    company VARCHAR(255),
    status ENUM('nouveau', 'en_cours', 'converti', 'perdu'),
    last_call_date TIMESTAMP NULL,
    next_call_date TIMESTAMP NULL,
    call_count INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Frontend (à développer)
```
Technologies suggérées:
- React.js OU Vue.js
- TailwindCSS pour le style
- Socket.io-client pour les mises à jour temps réel
```

## Logique Métier Détaillée

### Fonction: Attribution de Numéro
```javascript
async function assignPhoneNumber(userId, contactId) {
    // 1. Vérifier les numéros disponibles
    const availableNumber = await findAvailableNumber();
    
    if (availableNumber) {
        // 2. Marquer le numéro comme "en_appel"
        await updateNumberStatus(availableNumber.id, 'en_appel', userId);
        
        // 3. Créer l'enregistrement d'appel
        const callLog = await createCallLog(userId, contactId, availableNumber.id);
        
        // 4. Initier l'appel via API Kavkom
        const callResult = await initiateKavkomCall(availableNumber, contactId);
        
        // 5. Notifier les autres utilisateurs
        broadcastNumberStatusUpdate();
        
        return { success: true, number: availableNumber, callLog };
    } else {
        // 6. Ajouter à la file d'attente
        await addToQueue(userId, contactId);
        return { success: false, message: 'Ajouté à la file d\'attente' };
    }
}
```

### Fonction: Libération de Numéro
```javascript
async function releasePhoneNumber(callLogId) {
    // 1. Récupérer l'appel
    const call = await getCallLog(callLogId);
    
    // 2. Vérifier que la fiche est remplie
    if (!call.form_filled_at) {
        return { error: 'Veuillez remplir la fiche d\'appel' };
    }
    
    // 3. Libérer le numéro
    await updateNumberStatus(call.outbound_number_id, 'libre', null);
    
    // 4. Vérifier la file d'attente
    const nextInQueue = await getNextInQueue();
    
    if (nextInQueue) {
        // 5. Attribuer automatiquement au suivant
        await assignPhoneNumber(nextInQueue.user_id, nextInQueue.contact_id);
        await removeFromQueue(nextInQueue.id);
    }
    
    // 6. Notifier tous les utilisateurs
    broadcastNumberStatusUpdate();
    
    return { success: true };
}
```

## Endpoints API Backend à Créer

```
GET    /api/numbers/status              - Statut de tous les numéros
POST   /api/calls/request               - Demander un numéro pour appeler
POST   /api/calls/initiate              - Initier l'appel (appelle Kavkom)
PUT    /api/calls/:id/end               - Terminer l'appel
POST   /api/calls/:id/form              - Remplir la fiche d'appel
DELETE /api/calls/queue/:id             - Retirer de la file d'attente

GET    /api/queue/status                - État de la file d'attente
GET    /api/dashboard/stats             - Statistiques temps réel

WebSocket Events:
- number_status_changed
- queue_updated
- call_started
- call_ended
- number_available
```

## Wireframe Interface Commercial

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard Commercial - Jean Dupont                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📞 Numéros Disponibles                                 │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ 📱 01 23 45 67 89│  │ 📱 01 98 76 54 32│            │
│  │ Status: ✅ LIBRE │  │ Status: 🔴 OCCUPÉ│            │
│  │                  │  │ Par: Marie L.    │            │
│  │ [APPELER]        │  │ Depuis: 00:05:23 │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
│  📋 File d'Attente: 2 personnes                         │
│  Position: Vous êtes en 1ère position                   │
│                                                         │
│  📊 Mes Statistiques du Jour                            │
│  - Appels effectués: 12                                 │
│  - Temps total: 1h 23min                                │
│  - Taux de réponse: 67%                                 │
│                                                         │
│  📇 Prochain Contact à Appeler                          │
│  ┌─────────────────────────────────────────┐            │
│  │ Nom: Entreprise ABC                     │            │
│  │ Contact: M. Martin                      │            │
│  │ Tél: 06 12 34 56 78                     │            │
│  │ Dernière note: Intéressé par offre Pro │            │
│  │                                         │            │
│  │ [APPELER AVEC NUMÉRO DISPONIBLE]        │            │
│  └─────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

## Formulaire Post-Appel

```
┌─────────────────────────────────────────────────────────┐
│  Fiche d'Appel - Entreprise ABC                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Résultat de l'appel: *                                 │
│  ( ) Répondu - Intéressé                                │
│  ( ) Répondu - Pas intéressé                            │
│  ( ) Pas de réponse                                     │
│  ( ) Messagerie                                         │
│  ( ) Numéro invalide                                    │
│  ( ) Occupé                                             │
│                                                         │
│  Tags CRM: (sélection multiple)                         │
│  ☐ Prospect chaud                                       │
│  ☐ Prospect froid                                       │
│  ☐ Demande de rappel                                    │
│  ☐ RDV à planifier                                      │
│  ☐ Devis demandé                                        │
│                                                         │
│  Notes de l'appel: *                                    │
│  ┌─────────────────────────────────────────┐            │
│  │                                         │            │
│  │                                         │            │
│  └─────────────────────────────────────────┘            │
│                                                         │
│  Prochaine action:                                      │
│  ( ) Rappeler le: [Date] [Heure]                        │
│  ( ) Envoyer devis                                      │
│  ( ) RDV commercial                                     │
│  ( ) Aucune action (prospect perdu)                     │
│                                                         │
│  [ANNULER]  [VALIDER ET LIBÉRER LE NUMÉRO]             │
└─────────────────────────────────────────────────────────┘
```

## Questions Techniques pour Copilot

1. Quelle est la meilleure approche pour gérer les statuts en temps réel avec WebSockets ?
2. Comment implémenter un système de file d'attente robuste avec priorités ?
3. Quelle architecture recommandes-tu pour l'intégration avec l'API Kavkom ?
4. Comment gérer les cas d'erreur (perte de connexion, API Kavkom indisponible) ?
5. Quelle stratégie de cache pour optimiser les performances ?
6. Comment implémenter un système de logs et d'audit pour tracer toutes les actions ?

## Contraintes et Exigences

- Temps de réponse < 500ms pour l'attribution de numéro
- Support de 100+ commerciaux simultanés
- Historique complet de tous les appels
- Exports CSV/Excel des statistiques
- Interface responsive (mobile + desktop)
- Authentification sécurisée des commerciaux
- Rôles et permissions (admin, superviseur, commercial)

## Livrables Attendus

1. **Backend API REST** avec toutes les fonctionnalités
2. **Interface web** pour les commerciaux
3. **Interface admin** pour la configuration et les statistiques
4. **Documentation technique** complète
5. **Tests unitaires** et d'intégration
6. **Guide de déploiement**

---

Merci de m'aider à développer cette solution complète en commençant par l'architecture backend et la logique métier de gestion des numéros.
