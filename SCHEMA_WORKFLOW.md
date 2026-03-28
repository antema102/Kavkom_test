# Schéma Visuel - Système de Rotation d'Appels

## Workflow Complet

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SYSTÈME DE ROTATION D'APPELS                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  4 COMMERCIAUX       │
│  - Commercial A      │
│  - Commercial B      │
│  - Commercial C      │
│  - Commercial D      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│              VÉRIFICATION NUMÉROS DISPONIBLES                │
└──────────────────────────────────────────────────────────────┘
           │
           ├─────────────────────┬────────────────────┐
           ▼                     ▼                    ▼
    ┌─────────────┐       ┌─────────────┐    ┌──────────────┐
    │  NUMÉRO 1   │       │  NUMÉRO 2   │    │ FILE D'ATTENTE│
    │  ✅ LIBRE   │       │  🔴 OCCUPÉ  │    │               │
    │             │       │  (Com. B)   │    │  Commercial C │
    └──────┬──────┘       └─────────────┘    │  Commercial D │
           │                                  └──────────────┘
           ▼
    ┌──────────────────────────────────────────────────┐
    │  ATTRIBUTION AUTOMATIQUE À COMMERCIAL A          │
    │  Numéro 1 → Statut: "EN_APPEL"                   │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  APPEL VIA API KAVKOM                            │
    │  POST /api/pbx/v1/active_call/call               │
    │  - domain_uuid                                   │
    │  - src: extension du commercial                  │
    │  - destination: numéro du contact                │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  APPEL EN COURS                                  │
    │  Durée: 00:05:32                                 │
    │  Statut: "EN_APPEL"                              │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  FIN D'APPEL                                     │
    │  Numéro 1 → Statut: "POST_APPEL"                 │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  FORMULAIRE OBLIGATOIRE                          │
    │  ┌────────────────────────────────────────────┐  │
    │  │ Résultat: ○ Répondu ○ Pas réponse         │  │
    │  │ Tags: ☑ Intéressé ☑ Rappel demandé        │  │
    │  │ Notes: Client demande devis...             │  │
    │  │ Prochaine action: Rappel le 15/02          │  │
    │  │                                            │  │
    │  │ [ANNULER]  [VALIDER]                       │  │
    │  └────────────────────────────────────────────┘  │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  VALIDATION → LIBÉRATION DU NUMÉRO               │
    │  Numéro 1 → Statut: "LIBRE"                      │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  VÉRIFICATION FILE D'ATTENTE                     │
    │  Commercial C en attente depuis 2min             │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  ATTRIBUTION AUTOMATIQUE À COMMERCIAL C          │
    │  Numéro 1 → Statut: "EN_APPEL"                   │
    │  🔔 Notification à Commercial C                  │
    └──────────────────────────────────────────────────┘
```

## Scénario Parallèle: Plusieurs Appels Simultanés

```
TEMPS: T0
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Commercial A │  │ Commercial B │  │ Commercial C │  │ Commercial D │
│ 💬 Demande   │  │ 💬 Demande   │  │ 💬 Demande   │  │ 💬 Demande   │
│    appel     │  │    appel     │  │    appel     │  │    appel     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE ROTATION                               │
└──────────────────────────────────────────────────────────────────────┘
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌──────────────────────────────────┐
│  NUMÉRO 1   │  │  NUMÉRO 2   │  │     FILE D'ATTENTE               │
│  → Com. A   │  │  → Com. B   │  │  1. Commercial C (priorité: 0)   │
│  ✅ Attribué│  │  ✅ Attribué│  │  2. Commercial D (priorité: 0)   │
└─────────────┘  └─────────────┘  └──────────────────────────────────┘


TEMPS: T0 + 5 minutes (Commercial A termine)
┌─────────────┐  ┌─────────────┐  ┌──────────────────────────────────┐
│  NUMÉRO 1   │  │  NUMÉRO 2   │  │     FILE D'ATTENTE               │
│  🔴 En appel│  │  🔴 En appel│  │  1. Commercial C ⏰ 5 min        │
│  (Com. A)   │  │  (Com. B)   │  │  2. Commercial D ⏰ 5 min        │
└──────┬──────┘  └─────────────┘  └──────────────────────────────────┘
       │
       │ FIN D'APPEL
       ▼
┌─────────────┐
│  NUMÉRO 1   │
│  📝 Post    │
│  appel      │
└──────┬──────┘
       │
       │ FORMULAIRE REMPLI
       ▼
┌─────────────┐  ┌─────────────┐  ┌──────────────────────────────────┐
│  NUMÉRO 1   │  │  NUMÉRO 2   │  │     FILE D'ATTENTE               │
│  ✅ LIBRE   │  │  🔴 En appel│  │  1. ❌ Commercial C (retiré)     │
│  → Com. C   │  │  (Com. B)   │  │  2. Commercial D ⏰ 5 min        │
│  (AUTO)     │  │             │  │                                  │
└─────────────┘  └─────────────┘  └──────────────────────────────────┘
       │
       │ 🔔 NOTIFICATION AUTOMATIQUE
       ▼
┌──────────────┐
│ Commercial C │
│ 🎉 "Numéro 1 │
│ disponible!" │
└──────────────┘
```

## États Possibles des Numéros

```
┌─────────────────────────────────────────────────────────────┐
│  CYCLE DE VIE D'UN NUMÉRO                                   │
└─────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  LIBRE   │  ← État initial / Numéro disponible
    │  ✅      │
    └────┬─────┘
         │
         │ Commercial demande appel
         ▼
    ┌──────────┐
    │ EN_APPEL │  ← Appel en cours
    │  📞      │
    └────┬─────┘
         │
         │ Fin d'appel
         ▼
    ┌──────────┐
    │POST_APPEL│  ← En attente de formulaire
    │  📝      │
    └────┬─────┘
         │
         │ Formulaire validé
         ▼
    ┌──────────┐
    │  LIBRE   │  ← Retour à disponible
    │  ✅      │
    └──────────┘
```

## Architecture Base de Données

```
┌─────────────────────────────────────────────────────────────┐
│  RELATIONS ENTRE LES TABLES                                 │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ outbound_numbers │
│─────────────────│
│ id               │◄────┐
│ phone_number     │     │
│ status           │     │
│ current_user_id  │     │
│ current_call_id  │     │
└──────────────────┘     │
                         │
                         │
┌──────────────────┐     │
│   call_queue     │     │
│─────────────────│     │
│ id               │     │
│ user_id          │     │
│ contact_id       │     │
│ assigned_number  │─────┘
│ status           │
│ priority         │
└────────┬─────────┘
         │
         │
         ▼
┌──────────────────┐
│   calls_log      │
│─────────────────│
│ id               │
│ user_id          │──────────┐
│ contact_id       │          │
│ outbound_number  │─────┐    │
│ call_status      │     │    │
│ call_result      │     │    │
│ notes            │     │    │
│ tags             │     │    │
│ next_action      │     │    │
└──────────────────┘     │    │
                         │    │
                         ▼    ▼
┌──────────────────┐  ┌──────────────────┐
│ contacts         │  │ users            │
│─────────────────│  │─────────────────│
│ id               │  │ id               │
│ name             │  │ username         │
│ phone            │  │ extension_uuid   │
│ last_call_date   │  │ domain_uuid      │
│ next_call_date   │  │ role             │
│ call_count       │  └──────────────────┘
└──────────────────┘
```

## Interface Dashboard en Temps Réel

```
┌─────────────────────────────────────────────────────────────┐
│  🏢 CRM Kavkom - Dashboard Commercial                       │
├─────────────────────────────────────────────────────────────┤
│  👤 Commercial: Jean Dupont                    🔴 En ligne  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📞 NUMÉROS DISPONIBLES (Mise à jour en temps réel)         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────┐    ┌────────────────────────┐  │
│  │ 📱 01 23 45 67 89      │    │ 📱 01 98 76 54 32      │  │
│  │                        │    │                        │  │
│  │ Status: ✅ LIBRE       │    │ Status: 🔴 OCCUPÉ     │  │
│  │                        │    │                        │  │
│  │ Dernier appel:         │    │ Utilisateur:           │  │
│  │ Il y a 2 min           │    │ Marie LAURENT          │  │
│  │ Par: Pierre M.         │    │                        │  │
│  │                        │    │ En appel depuis:       │  │
│  │ [🎯 APPELER]           │    │ 00:05:23              │  │
│  │                        │    │                        │  │
│  └────────────────────────┘    └────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⏳ FILE D'ATTENTE                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Personnes en attente: 2                                 │
│  🎯 Votre position: 1ère                                    │
│  ⏱️ Temps d'attente estimé: ~3 minutes                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. 👤 Vous (Jean Dupont)        En attente: 2m34s │   │
│  │  2. 👤 Sophie MARTIN              En attente: 1m12s │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔔 Vous serez notifié quand un numéro se libère           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📊 MES STATISTIQUES DU JOUR                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📞 Appels effectués:     12                                │
│  ⏱️ Temps total:           1h 23min                         │
│  ✅ Répondus:              8  (67%)                         │
│  📭 Pas de réponse:        3  (25%)                         │
│  🚫 Occupé/Invalide:       1  (8%)                          │
│  ⭐ Prospects intéressés: 5                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Notifications Temps Réel (WebSockets)

```
┌─────────────────────────────────────────────────────────────┐
│  ÉVÉNEMENTS WEBSOCKET                                       │
└─────────────────────────────────────────────────────────────┘

📡 number_status_changed
{
  "event": "number_status_changed",
  "number_id": 1,
  "phone_number": "0123456789",
  "old_status": "en_appel",
  "new_status": "libre",
  "timestamp": "2024-02-15T14:30:00Z"
}

📡 queue_updated
{
  "event": "queue_updated",
  "queue_length": 2,
  "your_position": 1,
  "estimated_wait": 180
}

📡 number_available
{
  "event": "number_available",
  "number_id": 1,
  "phone_number": "0123456789",
  "assigned_to_user_id": 5,
  "message": "Numéro disponible pour appeler!"
}

📡 call_started
{
  "event": "call_started",
  "call_id": 123,
  "number_id": 1,
  "user_id": 5,
  "contact_name": "Entreprise ABC"
}

📡 call_ended
{
  "event": "call_ended",
  "call_id": 123,
  "duration": 323,
  "status": "waiting_form"
}
```
