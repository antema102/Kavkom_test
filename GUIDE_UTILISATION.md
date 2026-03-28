# 📘 Guide d'Utilisation - Prompts pour Copilot

## 🎯 Vous avez maintenant 3 documents

### 1️⃣ PROMPT_COPILOT.md (Version Complète)
**📄 À utiliser quand:** Vous voulez une solution très détaillée avec toutes les spécifications
**✅ Contient:**
- Contexte complet du projet
- Problématique détaillée avec exemples
- Toutes les fonctionnalités requises
- Architecture technique suggérée
- Tables de base de données avec SQL
- Logique métier avec code JavaScript
- Endpoints API à créer
- Wireframes d'interface
- Contraintes et exigences
- Livrables attendus

**🔧 Comment l'utiliser:**
```
1. Copiez tout le contenu de PROMPT_COPILOT.md
2. Ouvrez votre IDE (VS Code, Cursor, etc.)
3. Collez le prompt dans un nouveau fichier ou directement dans Copilot Chat
4. Demandez à Copilot: "Aide-moi à créer ce système étape par étape"
```

---

### 2️⃣ PROMPT_COPILOT_COURT.md (Version Concise)
**📄 À utiliser quand:** Vous voulez aller droit au but sans trop de détails
**✅ Contient:**
- Objectif résumé
- Problème en quelques lignes
- Solution avec workflow simplifié
- Tables principales
- APIs à utiliser
- Stack technique
- Question directe pour Copilot

**🔧 Comment l'utiliser:**
```
1. Copiez le contenu de PROMPT_COPILOT_COURT.md
2. Utilisez-le dans Copilot Chat
3. Parfait pour démarrer rapidement
4. Vous pouvez ensuite demander plus de détails sur des points précis
```

---

### 3️⃣ SCHEMA_WORKFLOW.md (Documentation Visuelle)
**📄 À utiliser quand:** Vous voulez comprendre le fonctionnement du système
**✅ Contient:**
- Schémas ASCII du workflow complet
- Scénarios d'utilisation parallèle
- Cycle de vie des numéros
- Architecture base de données visuelle
- Exemples d'interface dashboard
- Événements WebSocket

**🔧 Comment l'utiliser:**
```
1. Lisez-le pour bien comprendre le système
2. Montrez-le à votre équipe pour expliquer le concept
3. Utilisez-le comme référence pendant le développement
4. Copiez les parties pertinentes dans vos discussions avec Copilot
```

---

## 🚀 Stratégie Recommandée d'Utilisation

### Étape 1: Commencer avec la version COURTE
```
1. Ouvrez PROMPT_COPILOT_COURT.md
2. Copiez-le dans Copilot Chat
3. Demandez: "Commence par créer l'architecture backend et les modèles de données"
```

### Étape 2: Approfondir avec la version COMPLÈTE
```
Une fois que vous avez une première structure, utilisez PROMPT_COPILOT.md
pour demander des détails spécifiques:
- "Implémente la logique d'attribution de numéro"
- "Crée les endpoints API pour la file d'attente"
- "Génère le code du système de notifications WebSocket"
```

### Étape 3: Valider avec les SCHÉMAS
```
Utilisez SCHEMA_WORKFLOW.md pour:
- Vérifier que le workflow correspond bien à vos besoins
- Expliquer à votre équipe
- Documenter votre projet
```

---

## 💡 Exemples de Questions à Poser à Copilot

### Phase 1: Architecture
```
"En te basant sur ce prompt, crée-moi:
1. Le schéma complet de la base de données avec toutes les relations
2. Les migrations Laravel/Sequelize pour créer les tables
3. Les modèles avec les relations Eloquent/Sequelize"
```

### Phase 2: Logique Métier
```
"Implémente la fonction assignPhoneNumber() en Node.js avec:
- Vérification des numéros disponibles
- Attribution automatique
- Gestion de la file d'attente
- Appel à l'API Kavkom
- Gestion des erreurs"
```

### Phase 3: API Backend
```
"Crée tous les endpoints REST nécessaires avec:
- Controllers
- Middleware d'authentification
- Validation des données
- Gestion des erreurs
- Documentation Swagger"
```

### Phase 4: Temps Réel
```
"Implémente le système WebSocket avec Socket.io:
- Configuration du serveur
- Événements à émettre
- Gestion des connexions/déconnexions
- Broadcast aux utilisateurs concernés"
```

### Phase 5: Frontend
```
"Crée le dashboard commercial en React avec:
- Affichage des numéros disponibles en temps réel
- File d'attente
- Statistiques
- Formulaire post-appel
- Connexion WebSocket pour les mises à jour"
```

---

## 🎯 Approche Itérative Recommandée

### Sprint 1: MVP (Minimum Viable Product)
```
Focus: Faire fonctionner le système de base
- ✅ Base de données
- ✅ Attribution simple de numéro
- ✅ Appel via API Kavkom
- ✅ Formulaire post-appel basique
```

**Prompt pour Copilot:**
```
"En te basant sur mon prompt, crée un MVP avec:
1. Les 4 tables principales (outbound_numbers, calls_log, contacts, users)
2. Une fonction simple d'attribution de numéro (sans file d'attente)
3. L'intégration de base avec l'API Kavkom pour initier un appel
4. Un formulaire simple post-appel
Je veux du code Node.js + Express + MySQL"
```

### Sprint 2: File d'Attente
```
Focus: Ajouter la gestion de la file d'attente
- ✅ Table call_queue
- ✅ Attribution automatique au suivant
- ✅ Gestion des priorités
```

**Prompt pour Copilot:**
```
"Ajoute maintenant la gestion de la file d'attente:
1. Table call_queue avec priorités
2. Fonction addToQueue() et getNextInQueue()
3. Attribution automatique quand un numéro se libère
4. Logique de priorité FIFO"
```

### Sprint 3: Temps Réel
```
Focus: WebSockets pour les mises à jour live
- ✅ Socket.io serveur
- ✅ Événements en temps réel
- ✅ Notifications aux commerciaux
```

**Prompt pour Copilot:**
```
"Implémente le système temps réel avec Socket.io:
1. Configuration du serveur WebSocket
2. Événements: number_status_changed, queue_updated, number_available
3. Broadcast aux utilisateurs concernés
4. Reconnexion automatique"
```

### Sprint 4: Interface Frontend
```
Focus: Dashboard commercial
- ✅ Interface React
- ✅ Composants réutilisables
- ✅ Connexion WebSocket
```

**Prompt pour Copilot:**
```
"Crée l'interface React pour le dashboard commercial:
1. Composant NumberStatus pour afficher les numéros
2. Composant QueueStatus pour la file d'attente
3. Composant CallForm pour le formulaire post-appel
4. Hook useWebSocket pour la connexion temps réel
5. Utilise TailwindCSS pour le style"
```

---

## 🔍 Checklist de Validation

### ✅ Backend
- [ ] Base de données créée avec toutes les tables
- [ ] Attribution de numéro fonctionne
- [ ] File d'attente opérationnelle
- [ ] Intégration API Kavkom réussie
- [ ] WebSockets configurés
- [ ] Tous les endpoints API créés
- [ ] Tests unitaires passent

### ✅ Frontend
- [ ] Dashboard affiche les numéros disponibles
- [ ] File d'attente visible
- [ ] Notifications temps réel fonctionnent
- [ ] Formulaire post-appel complet
- [ ] Statistiques affichées
- [ ] Interface responsive

### ✅ Intégration
- [ ] Appels via Kavkom fonctionnent
- [ ] Tags CRM assignés correctement
- [ ] Historique des appels enregistré
- [ ] CDR récupérables

---

## 🆘 En Cas de Problème

### Si Copilot ne comprend pas
```
1. Utilisez la version COURTE
2. Décomposez en plus petites questions
3. Montrez un exemple de ce que vous voulez
4. Référez-vous aux schémas du SCHEMA_WORKFLOW.md
```

### Si le code généré ne fonctionne pas
```
1. Demandez à Copilot de débugger: "Voici l'erreur: [erreur]. Comment la corriger?"
2. Montrez le code existant: "Voici mon code actuel: [code]. Comment l'améliorer?"
3. Demandez une explication: "Explique-moi comment fonctionne cette partie"
```

### Si vous voulez modifier quelque chose
```
"En te basant sur le système que tu as créé, modifie:
- Ajoute une priorité basée sur l'ancienneté du commercial
- Permets 3 numéros au lieu de 2
- Ajoute un système de pause pour les commerciaux"
```

---

## 📝 Template de Questions Type

### Pour Démarrer
```
"Je veux créer [FONCTIONNALITÉ] avec [TECHNOLOGIE].
Voici mes besoins: [COPIER PARTIE DU PROMPT]
Commence par [PREMIÈRE ÉTAPE]"
```

### Pour Continuer
```
"Maintenant que [CE QUI EST FAIT], 
aide-moi à implémenter [PROCHAINE ÉTAPE]
en utilisant [TECHNOLOGIE/PATTERN]"
```

### Pour Débugger
```
"J'ai cette erreur: [ERREUR]
Dans ce code: [CODE]
Comment la corriger?"
```

### Pour Optimiser
```
"Mon code fonctionne mais [PROBLÈME DE PERFORMANCE/QUALITÉ].
Comment l'optimiser?"
```

---

## 🎓 Conseils Finaux

1. **Soyez spécifique**: Plus vous êtes précis, meilleur sera le code généré
2. **Itérez**: N'hésitez pas à demander des modifications
3. **Testez**: Testez chaque fonctionnalité avant de passer à la suivante
4. **Documentez**: Demandez à Copilot de documenter le code généré
5. **Apprenez**: Demandez des explications sur le code généré

---

## 🚀 Prêt à Démarrer ?

1. ✅ Choisissez votre prompt (court ou complet)
2. ✅ Ouvrez votre IDE avec Copilot
3. ✅ Commencez par l'architecture backend
4. ✅ Suivez l'approche itérative
5. ✅ Référez-vous aux schémas quand nécessaire

**Bon développement ! 💪**
