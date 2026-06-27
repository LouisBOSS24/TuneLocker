## 🎸 TuneLocker

TuneLocker est une application web permettant aux musiciens de répertorier leur collection de matériel de musique.

L'application permet de centraliser ses instruments, amplificateurs, pédales d'effets et accessoires dans une interface moderne afin de partager et comparer facilement son équipement avec ses amis.

Ce projet a été réalisé dans le cadre d'un projet de fin d'année en développement Full Stack.

---

# ✨ Fonctionnalités

* 🔐 Authentification sécurisée
* 👤 Création de compte et connexion
* 🎸 Gestion d'une collection de matériel
* ➕ Ajout d'équipements
* ✏️ Modification des informations
* 🗑️ Suppression d'objets
* 📸 Gestion des images
* 📊 Tableau de bord
* 🔎 Recherche et filtres
* 👥 Fonctionnalités sociales (selon les modules développés)
* 📱 Interface responsive

---

# 🛠️ Stack technique

## Frontend

* React
* Vite
* React Router DOM
* Font Awesome

## Backend / BaaS

* Supabase

  * Base de données PostgreSQL
  * Authentification
  * Stockage des données

---

# 📁 Structure du projet

```text
TuneLocker/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   └── ...
├── supabase/
├── package.json
└── vite.config.js
```

---

# 🚀 Installation

Cloner le dépôt :

```bash
git clone https://github.com/<votre-utilisateur>/TuneLocker.git
```

Accéder au projet :

```bash
cd TuneLocker
```

Installer les dépendances :

```bash
npm install
```

Créer un fichier `.env` à la racine du projet contenant vos variables Supabase :

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Lancer le projet :

```bash
npm run dev
```

L'application sera disponible sur :

```
http://localhost:5173
```

---

# 📦 Scripts disponibles

```bash
npm run dev      # Lance le serveur de développement
npm run build    # Génère la version de production
npm run preview  # Prévisualise le build
npm run lint     # Vérifie le code avec ESLint
```

---

# 🔒 Sécurité

Le projet s'appuie sur Supabase pour :

* l'authentification des utilisateurs ;
* la gestion des sessions ;
* la sécurisation des données ;
* les règles d'accès (Row Level Security).

---

# 🎯 Objectifs du projet

* Concevoir une application web moderne.
* Développer une interface utilisateur intuitive.
* Mettre en œuvre une authentification sécurisée.
* Manipuler une base de données PostgreSQL via Supabase.
* Développer une architecture propre et évolutive.

---

# 📱 Responsive

L'application est compatible avec :

* 💻 Ordinateur
* 📱 Smartphone
* 📟 Tablette

---

# 👨‍💻 Développeurs

Projet réalisé dans le cadre d'une formation en développement Full Stack.

---

# 📄 Licence

Projet réalisé à des fins pédagogiques.
