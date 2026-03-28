# Documentation API Kavkom

Documentation complète des APIs Kavkom pour la gestion du CRM et du PBX.

## Table des matières

- [CRM Tags](#crm-tags)
  - [LIST - Liste des tags](#list---liste-des-tags)
  - [GET - Récupérer un tag](#get---récupérer-un-tag)
  - [STORE - Créer un tag](#store---créer-un-tag)
  - [ASSIGN - Assigner des tags](#assign---assigner-des-tags)
  - [UPDATE - Mettre à jour un tag](#update---mettre-à-jour-un-tag)
  - [DELETE - Supprimer un tag](#delete---supprimer-un-tag)
- [PBX Active Calls](#pbx-active-calls)
  - [CALL - Exécuter une commande](#call---exécuter-une-commande)
- [PBX Call Details Records](#pbx-call-details-records)
  - [LIST - Historique des appels](#list---historique-des-appels)
  - [DOWNLOAD - Télécharger un enregistrement](#download---télécharger-un-enregistrement)
  - [GET FILE LINK - Lien de téléchargement](#get-file-link---lien-de-téléchargement)
- [PBX Destinations](#pbx-destinations)
  - [LIST - Liste des destinations](#list---liste-des-destinations)
- [PBX Extension](#pbx-extension)
  - [LIST ALL - Liste complète](#list-all---liste-complète)
  - [LIST LIMITED - Liste limitée](#list-limited---liste-limitée)
  - [GET - Récupérer une extension](#get---récupérer-une-extension)
  - [FIND - Trouver une extension](#find---trouver-une-extension)
  - [UPDATE - Mettre à jour une extension](#update---mettre-à-jour-une-extension)
- [PBX User](#pbx-user)
  - [LIST - Liste des utilisateurs](#list---liste-des-utilisateurs)
  - [GET - Récupérer un utilisateur](#get---récupérer-un-utilisateur)
  - [STORE - Créer un utilisateur](#store---créer-un-utilisateur)
  - [DESTROY - Supprimer un utilisateur](#destroy---supprimer-un-utilisateur)
- [Authentification](#authentification)
- [Réponses d'erreur](#réponses-derreur)

---

## CRM Tags

APIs pour la gestion des tags CRM Kavkom.

### LIST - Liste des tags

Affiche la liste des tags CRM.

**Endpoint:** `GET /api/crm/v1/tags/list`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| limit | optionnel | Nombre d'enregistrements (par défaut: 15) |
| page | optionnel | Numéro de la page |
| filter | optionnel | Tableau de conditions: filter[search_query] = Checked |
| sort | optionnel | Colonnes autorisées: name, created_at, updated_at. Directions: ASC, DESC |

**Exemple de requête:**

```javascript
const url = new URL("https://api.kavkom.com/api/crm/v1/tags/list");

let params = {
    "domain_uuid": "ddcfeb62-110f-4bd7-b7a9-965e1a78295f",
    "limit": "1",
    "page": "1",
};
Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

let headers = {
    "X-API-TOKEN": "YOUR_API_TOKEN",
    "Accept": "application/json",
    "Content-Type": "application/json",
}

fetch(url, {
    method: "GET",
    headers: headers,
})
    .then(response => response.json())
    .then(json => console.log(json));
```

**Exemple de réponse (200):**

```json
{
    "data": [
        {
            "id": 2119,
            "name": "Checked",
            "name_slug": "e44d4ec4-c016-4727-8cf3-ff689bf7d86f",
            "color": "#5bceae",
            "created_at": "2021-11-30 12:49:32",
            "updated_at": "2021-11-30 12:49:32",
            "domain_uuid": "ddcfeb62-110f-4bd7-b7a9-965e1a78295f",
            "pd_disposition_id": 0,
            "crm_template_id": null
        }
    ],
    "success": true,
    "message": "Action completed successfully"
}
```

---

### GET - Récupérer un tag

Récupère un tag par son ID.

**Endpoint:** `GET /api/crm/v1/tags/get`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| id | requis | ID du tag |

**Exemple de requête:**

```javascript
const url = new URL("https://api.kavkom.com/api/crm/v1/tags/get");

let params = {
    "domain_uuid": "ddcfeb62-110f-4bd7-b7a9-965e1a78295f",
    "id": "2119",
};
Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

let headers = {
    "X-API-TOKEN": "YOUR_API_TOKEN",
    "Accept": "application/json",
    "Content-Type": "application/json",
}

fetch(url, {
    method: "GET",
    headers: headers,
})
    .then(response => response.json())
    .then(json => console.log(json));
```

---

### STORE - Créer un tag

Ajoute un tag au CRM.

**Endpoint:** `POST /api/crm/v1/tags/store`

**Paramètres du body:**

| Paramètre | Type | Statut | Description |
|-----------|------|--------|-------------|
| domain_uuid | uuid-v4 | requis | UUID-v4 valide du domaine |
| tag[name] | string | requis | Nom du tag CRM |
| tag[color] | string | requis | Couleur du tag CRM |
| tag[crm_template_id] | integer | optionnel | ID du template CRM |
| tag[pd_disposition_id] | integer | optionnel | ID de disposition PD |

**Exemple de requête:**

```javascript
const url = new URL("https://api.kavkom.com/api/crm/v1/tags/store");

let headers = {
    "X-API-TOKEN": "YOUR_API_TOKEN",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

let body = {
    "domain_uuid": "ddcfeb62-110f-4bd7-b7a9-965e1a78295f",
    "tag": {
        "name": "To remove",
        "color": "#b8aff2"
    }
}

fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body)
})
    .then(response => response.json())
    .then(json => console.log(json));
```

---

### ASSIGN - Assigner des tags

Assigne des tags CRM à un lead spécifique.

**Endpoint:** `POST /api/crm/v1/tags/assign`

**Paramètres du body:**

| Paramètre | Type | Statut | Description |
|-----------|------|--------|-------------|
| domain_uuid | uuid-v4 | requis | UUID-v4 valide du domaine |
| tags[0] | integer | requis | ID du tag sélectionné |
| lead_id | integer | requis | ID du lead CRM |

**Exemple de requête:**

```javascript
const url = new URL("https://api.kavkom.com/api/crm/v1/tags/assign");

let headers = {
    "X-API-TOKEN": "YOUR_API_TOKEN",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

let body = {
    "domain_uuid": "ddcfeb62-110f-4bd7-b7a9-965e1a78295f",
    "tags": [2142],
    "lead_id": 11148159
}

fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body)
})
    .then(response => response.json())
    .then(json => console.log(json));
```

---

### UPDATE - Mettre à jour un tag

Met à jour un tag existant.

**Endpoint:** `PUT /api/crm/v1/tags/update`

**Paramètres du body:**

| Paramètre | Type | Statut | Description |
|-----------|------|--------|-------------|
| domain_uuid | uuid-v4 | requis | UUID-v4 valide du domaine |
| data[id] | integer | requis | ID du tag CRM |
| data[name] | string | requis | Nom du tag CRM |
| data[color] | string | requis | Couleur du tag CRM |
| data[crm_template_id] | integer | optionnel | ID du template CRM |
| data[pd_disposition_id] | integer | optionnel | ID de disposition PD |
| user_has_pd | boolean | optionnel | Si l'utilisateur a un Predictive Dialer |

---

### DELETE - Supprimer un tag

Supprime un tag du stockage.

**Endpoint:** `DELETE /api/crm/v1/tags/destroy`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| id | requis | ID du tag CRM |

---

## PBX Active Calls

Utilisez cette API pour surveiller et interagir avec les appels actifs.

### CALL - Exécuter une commande

Cette méthode est utilisée pour exécuter une commande switch.

**Endpoint:** `POST /api/pbx/v1/active_call/call`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| src | requis | Numéro d'extension (int) |
| destination | requis | Numéro de destination (int) |

**Exemple de réponse (200):**

```json
{
    "success": true,
    "message": "Action completed successfully",
    "additional_resources": [],
    "switch_result": ""
}
```

---

## PBX Call Details Records

APIs pour la gestion des CDRs (Call Detail Records).

### LIST - Historique des appels

Retourne des informations sur l'historique des appels. La propriété 'file' contient le nom de l'enregistrement qui peut être téléchargé via: `/api/pbx/v1/cdr/download?file=recordingname`

**Endpoint:** `GET /api/pbx/v1/cdr/list`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| limit | optionnel | Nombre d'enregistrements (par défaut: 15) |
| page | optionnel | Numéro de la page |

**Paramètres du body:**

| Paramètre | Type | Statut | Description |
|-----------|------|--------|-------------|
| filter[extension_uuid] | string | optionnel | UUID-v4 valide de l'extension |
| filter[number] | string | optionnel | Nom du caller ID ou numéro de destination |
| filter[start_date] | string | optionnel | Date de début (format: yyyy-mm-dd HH:mm) |
| filter[end_date] | string | optionnel | Date de fin (format: yyyy-mm-dd HH:mm) |
| filter[call_result] | string | optionnel | Résultat: 'answered', 'voicemail', 'missed', 'cancelled' |
| filter[caller_id_number] | string | optionnel | Numéro du caller ID |
| filter[destination_number] | string | optionnel | Numéro de destination |
| filter[caller_id_name] | string | optionnel | Nom du caller ID |

---

### DOWNLOAD - Télécharger un enregistrement

Télécharge un fichier d'enregistrement.

**Endpoint:** `GET /api/pbx/v1/cdr/download`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| file | requis | Nom du fichier (string) |

---

### GET FILE LINK - Lien de téléchargement

Retourne un lien de téléchargement pour le fichier.

**Endpoint:** `GET /api/pbx/v1/cdr/get_file_link`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| uuid | optionnel | UUID-v4 valide du CDR |
| domain_uuid | requis | UUID-v4 valide du domaine |

**Exemple de réponse (200):**

```json
{
    "data": {
        "fileLink": "https://api.kavkom.com/api/pbx/v1/cdr/download?file=..."
    },
    "success": true,
    "message": "Action completed successfully"
}
```

---

## PBX Destinations

APIs pour la gestion des destinations PBX Kavkom.

### LIST - Liste des destinations

Affiche la liste des destinations PBX.

**Endpoint:** `GET /api/pbx/v1/destination/list`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| limit | optionnel | Nombre d'enregistrements (par défaut: 15) |
| page | optionnel | Numéro de la page |
| filter | optionnel | Conditions: filter[search_query] = 12321345 |
| sort | optionnel | Tri: sort[0] = destination_number, sort[1] = DESC |

---

## PBX Extension

Les extensions définissent les informations nécessaires pour qu'un endpoint se connecte au serveur SIP.

### LIST ALL - Liste complète

Liste toutes les extensions configurées dans votre domaine PBX.

**Endpoint:** `GET /api/pbx/v1/extension/list`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| limit | optionnel | Nombre d'enregistrements (par défaut: 15) |
| getAll | optionnel | Obtenir toutes les extensions (bool) |

**Paramètres du body:**

| Paramètre | Type | Statut | Description |
|-----------|------|--------|-------------|
| filter[search_query] | string | optionnel | Recherche sur nom ou description |
| sort[0] | string | optionnel | Champ de tri (voir documentation complète) |
| sort[1] | string | optionnel | Direction: 'asc', 'desc' |

---

### LIST LIMITED - Liste limitée

Liste toutes les extensions avec des données limitées.

**Endpoint:** `GET /api/pbx/v1/extension/list_limited`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| limit | optionnel | Nombre d'enregistrements (par défaut: 15) |
| page | optionnel | Numéro de la page pour la pagination |

---

### GET - Récupérer une extension

Retourne un objet extension avec toutes les données liées (voicemails, utilisateurs).

**Endpoint:** `GET /api/pbx/v1/extension/get`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| id | requis | UUID-v4 valide de l'extension |

---

### FIND - Trouver une extension

Récupère une extension par son numéro.

**Endpoint:** `GET /api/pbx/v1/extension/find`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| extension | requis | Numéro d'extension (int) |

---

### UPDATE - Mettre à jour une extension

Met à jour une extension spécifique.

**Endpoint:** `PUT /api/pbx/v1/extension/update`

**Paramètres du body:**

| Paramètre | Type | Statut | Description |
|-----------|------|--------|-------------|
| domain_uuid | uuid-v4 | requis | UUID-v4 valide du domaine |
| extension[password] | string | optionnel | Mot de passe de l'extension |
| extension[user_uuid] | uuid-v4 | optionnel | UUID-v4 de l'agent utilisateur |
| extension[outbound_caller_id_number] | string | optionnel | Numéro du caller ID sortant |
| extension[outbound_caller_id_name] | string | optionnel | Nom du caller ID sortant |
| extension[voicemail_password] | string | optionnel | Mot de passe de la messagerie |
| extension[dids][0] | array | optionnel | Tableau d'UUIDs de destinations |
| extension[voicemail_enabled] | string | optionnel | Messagerie activée: 'true', 'false' |
| extension[description] | string | optionnel | Description de l'extension |
| extension[extension_uuid] | uuid-v4 | requis | UUID-v4 de l'extension |

**Exemple de requête:**

```javascript
const url = new URL("https://api.kavkom.com/api/pbx/v1/extension/update");

let headers = {
    "X-API-TOKEN": "YOUR_API_TOKEN",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

let body = {
    "domain_uuid": "ddcfeb62-110f-4bd7-b7a9-965e1a78295f",
    "extension": {
        "password": "Xtr4Q!NtL.",
        "user_uuid": "474e60d0-d077-46f6-ac66-6266a64cef29",
        "outbound_caller_id_number": "33971082262",
        "outbound_caller_id_name": "Client1",
        "voicemail_password": "1234",
        "dids": ["145642fa-3ef6-430b-bcf3-995141c50289"],
        "voicemail_enabled": "true",
        "description": "test",
        "extension_uuid": "48b0d200-2b31-4211-a3d7-b41f87abbcbb"
    }
}

fetch(url, {
    method: "PUT",
    headers: headers,
    body: JSON.stringify(body)
})
    .then(response => response.json())
    .then(json => console.log(json));
```

---

## PBX User

APIs pour la gestion des utilisateurs.

### LIST - Liste des utilisateurs

Retourne la liste des utilisateurs PBX pour le domaine fourni.

**Endpoint:** `GET /api/pbx/v1/user/list`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| limit | optionnel | Nombre d'enregistrements (par défaut: 15) |
| filter[search_query] | optionnel | Recherche par nom d'utilisateur |
| sort[0] | optionnel | Champ de tri |
| sort[1] | optionnel | Direction: 'asc', 'desc' |

---

### GET - Récupérer un utilisateur

Retourne un objet utilisateur avec toutes les données liées (contact, extension, événements, groupes...).

**Endpoint:** `GET /api/pbx/v1/user/get`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| id | requis | UUID-v4 valide de l'utilisateur |

---

### STORE - Créer un utilisateur

Enregistre un nouvel utilisateur.

**Endpoint:** `POST /api/pbx/v1/user/store`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| user_login_email | requis | Email de connexion (string) |
| groups | requis | ID du groupe utilisateur (int) |
| password | requis | Mot de passe (string) |
| username | requis | Nom d'utilisateur (string) |
| color | optionnel | Code couleur hash (string) |
| module_id | optionnel | ID du module (int) |
| callmethod | optionnel | Méthode d'appel (string) |
| extension_uuid | optionnel | UUID-v4 de l'extension |

**Paramètres du body:**

| Paramètre | Type | Statut | Description |
|-----------|------|--------|-------------|
| contact[contact_nickname] | string | optionnel | Nom de l'agent |

---

### DESTROY - Supprimer un utilisateur

Supprime un utilisateur.

**Endpoint:** `DELETE /api/pbx/v1/user/destroy`

**Paramètres de requête:**

| Paramètre | Statut | Description |
|-----------|--------|-------------|
| domain_uuid | requis | UUID-v4 valide du domaine |
| id | requis | UUID-v4 valide de l'utilisateur |

---

## Authentification

Toutes les requêtes API doivent inclure l'en-tête d'authentification suivant:

```
X-API-TOKEN: YOUR_API_TOKEN
```

L'en-tête `X-API-TOKEN` doit contenir votre token API valide. Contactez l'administrateur Kavkom pour obtenir votre token.

---

## Réponses d'erreur

**Erreur 500:**

```json
{
    "error": true,
    "message": "Something went wrong"
}
```

---

## Support

Pour plus d'informations, consultez la documentation complète de l'API Kavkom ou contactez le support technique.
