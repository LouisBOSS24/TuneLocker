Cahier des Charges :

# Cahier des charges — TuneLocker

## 1. Présentation du projet

### Nom du projet

**TuneLocker**

### Contexte

Les musiciens possèdent souvent plusieurs instruments, pédales, amplificateurs et accessoires. Il devient rapidement difficile de suivre :

- leur matériel,
- leur valeur,
- leur état,
- leurs achats,
- ou encore leur organisation.

L’objectif du projet est de développer une application web permettant aux utilisateurs de gérer leur collection musicale de manière simple, moderne et sécurisée.

L’application intégrera également des fonctionnalités sociales afin de permettre aux utilisateurs de comparer leur matériel avec leurs amis et partager leur collection.

---

## 2. Objectifs du projet

L’application devra permettre :

- la gestion d’une collection musicale personnelle,
- l’ajout / modification / suppression de matériel,
- la visualisation de statistiques,
- la gestion d’images,
- la sécurisation des données utilisateurs,
- la comparaison de collections entre utilisateurs,
- une interface responsive accessible sur ordinateur, tablette et mobile.

---

## 3. Public cible

L’application s’adresse :

- aux musiciens amateurs,
- aux collectionneurs,
- aux groupes,
- aux passionnés de matériel audio.

---

## 4. Fonctionnalités principales

### 4.1 Authentification (Obligatoire)

#### Inscription

L’utilisateur pourra créer un compte avec :

- nom d’utilisateur,
- email,
- mot de passe.

#### Connexion

L’utilisateur pourra se connecter grâce à :

- email,
- mot de passe.

#### Sécurité

- Les mots de passe devront être chiffrés.
- Les routes protégées nécessiteront une authentification.

#### Déconnexion

L’utilisateur pourra se déconnecter de son compte.

---

### 4.2 Gestion de collection (CRUD)

L’utilisateur pourra :

#### Ajouter du matériel

Chaque objet pourra contenir :

- nom,
- catégorie,
- marque,
- modèle,
- état,
- date d’achat,
- prix d’achat,
- valeur estimée,
- description,
- photo.

#### Modifier un objet

L’utilisateur pourra modifier les informations d’un objet existant.

#### Supprimer un objet

L’utilisateur pourra retirer un objet de sa collection.

#### Consulter sa collection

Les objets seront affichés sous forme :

- de cartes,
- ou de tableau.

---

### 4.3 Catégories de matériel

Le système devra gérer plusieurs catégories :

- guitare,
- basse,
- amplificateur,
- pédale d’effet,
- synthétiseur,
- batterie,
- microphone,
- accessoires.

---

### 4.4 Recherche et filtres

L’utilisateur pourra :

- rechercher un objet par nom,
- filtrer par catégorie,
- filtrer par marque,
- trier par prix,
- trier par date d’ajout.

---

### 4.5 Gestion des images

L’utilisateur pourra :

- importer une image,
- modifier une image,
- supprimer une image.

#### Formats acceptés

- JPG,
- PNG,
- WEBP.

---

### 4.6 Tableau de bord (Obligatoire)

Le tableau de bord affichera :

- nombre total d’objets,
- valeur totale estimée,
- répartition par catégorie,
- derniers objets ajoutés,
- statistiques simples.

#### Exemples de statistiques

- nombre de guitares,
- valeur moyenne des objets,
- catégorie la plus présente.

---

### 4.7 Notifications et alertes

L’application pourra afficher :

- confirmation d’ajout,
- confirmation de suppression,
- erreurs de formulaire,
- messages de succès.

---

### 4.8 Administration (Optionnel mais recommandé)

Un administrateur pourra :

- consulter les utilisateurs,
- supprimer des comptes,
- supprimer du contenu inapproprié.

---

### 4.9 Fonctionnalités sociales

L’application permettra aux utilisateurs d’interagir entre eux autour de leur collection musicale.

#### Ajout d’amis

Les utilisateurs pourront :

- rechercher d’autres utilisateurs,
- envoyer une demande d’ami,
- accepter ou refuser une demande.

---

#### Profils publics

Chaque utilisateur pourra disposer d’un profil public affichant :

- son pseudo,
- sa collection publique,
- ses statistiques principales,
- ses instruments favoris.

L’utilisateur pourra choisir de rendre certains objets :

- publics,
- ou privés.

---

#### Comparaison de collections

Les utilisateurs pourront comparer leur matériel avec celui de leurs amis.

Le système pourra afficher :

- les instruments en commun,
- les marques les plus utilisées,
- la valeur totale des collections,
- les catégories les plus présentes.

---

#### Partage de matériel

Un utilisateur pourra partager un objet de sa collection via :

- un lien public,
- ou avec ses amis uniquement.

---

## 5. Contraintes techniques

### Frontend

Technologies possibles :

- React,
- Vite,
- Tailwind CSS.

### Backend

Technologies possibles :

- Node.js,
- Express.js.

### Base de données

- MySQL
- PostgreSQL.
- Supabase

### Sécurité

- Hashage des mots de passe avec bcrypt,
- Authentification JWT,
- Validation des formulaires,
- Protection des routes.

### Responsive Design

L’application devra être compatible :

- ordinateur,
- tablette,
- smartphone.

---

## 6. Architecture générale

### Architecture client / serveur

#### Frontend

Responsable :

- affichage des données,
- navigation,
- interface utilisateur.

#### Backend

Responsable :

- logique métier,
- sécurité,
- gestion base de données,
- API.

#### Base de données

Stockage :

- utilisateurs,
- objets,
- catégories,
- images,
- relations d’amis.

---

## 7. Parcours utilisateur

### Utilisateur non connecté

- consulter la page d’accueil,
- s’inscrire,
- se connecter.

---

### Utilisateur connecté

L’utilisateur pourra :

- accéder au dashboard,
- gérer sa collection,
- modifier son profil,
- ajouter du matériel,
- ajouter des amis,
- consulter des profils publics,
- comparer sa collection avec d’autres utilisateurs,
- partager certains objets de sa collection.

---

### Administrateur

- gérer les utilisateurs,
- modérer le contenu.

---

## 8. Interface utilisateur

### Pages principales

#### Public

- Accueil,
- Connexion,
- Inscription.

#### Privé

- Dashboard,
- Ma collection,
- Ajouter un objet,
- Modifier un objet,
- Profil utilisateur.

#### Social

- Liste d’amis,
- Profil public utilisateur,
- Comparaison de collections.

#### Admin

- Gestion utilisateurs,
- Modération.

---

## 9. Maquettes envisagées

Le design devra être :

- moderne,
- minimaliste,
- intuitif,
- responsive.

### Palette recommandée

- noir,
- gris foncé,
- blanc,
- accent violet ou bleu électrique.

---

## 10. Sécurité

Le système devra :

- protéger les mots de passe,
- empêcher l’accès non autorisé,
- vérifier les permissions,
- sécuriser les formulaires.

---

## 11. Performances

L’application devra :

- charger rapidement,
- optimiser les images,
- limiter les requêtes inutiles.

---

## 12. Livrables attendus

- Code source frontend,
- Code source backend,
- Export SQL,
- Documentation utilisateur,
- Documentation technique,
- Support de soutenance.

---

## 13. Conclusion

Le projet **TuneLocker** a pour objectif de proposer une solution moderne de gestion de collection musicale.

L’application permettra aux utilisateurs de centraliser et organiser leur matériel grâce à une interface ergonomique et sécurisée tout en mettant en pratique les compétences acquises en développement fullstack.

Les fonctionnalités sociales permettront également de créer une expérience plus interactive en donnant la possibilité aux utilisateurs de comparer et partager leur collection avec leurs amis.
