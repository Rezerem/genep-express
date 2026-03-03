# Genep'express 🎿

Application mobile de ravitaillement sur pistes de ski — localisez les Genep'express en temps réel et passez commande directement depuis les pistes.

---

## Stack

| Couche | Technologie |
|---|---|
| Mobile | React Native + Expo |
| Carte | MapLibre GL + Terrain RGB (3D) + Overpass API (pistes OSM) |
| Temps réel | Socket.io |
| Backend | Node.js + Fastify |
| ORM | Prisma |
| BDD | PostgreSQL + PostGIS |
| Cache | Redis |
| Notifications | Firebase FCM |
| Déploiement | Render |

---

## Prérequis

- [nvm-windows](https://github.com/coreybutler/nvm-windows) + Node.js 20 LTS
- [Git](https://git-scm.com)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## Installation

### 1. Cloner le repo

```powershell
PS> git clone https://github.com/VOTRE_USER/genepexpress.git
PS> cd genepexpress
```

### 2. Installer les dépendances

```powershell
PS> npm install
```

### 3. Configurer les variables d'environnement

```powershell
PS> copy .env.example .env
PS> notepad .env
```

### 4. Lancer l'environnement

```powershell
PS> npm run dev
```

---

## Structure du projet

```
genepexpress/
├── app/              # Application Expo (mobile)
├── api/              # Serveur Fastify
│   ├── prisma/       # Schéma base de données
│   └── server.js     # Point d'entrée
├── .env.example      # Variables d'environnement à copier
└── render.yaml       # Config déploiement Render
```

---

## Scripts

```powershell
npm run dev        # Démarrer en développement (nodemon)
npm run start      # Démarrer en production
npm run build      # Générer Prisma + appliquer les migrations
npx expo start     # Lancer l'app mobile (scanner QR avec Expo Go)
npx prisma studio  # Interface visuelle base de données (:5555)
```

---

## Contribuer

1. Créer une branche : `git checkout -b feature/ma-feature`
2. Commiter : `git commit -m "feat: ma feature"`
3. Pousser : `git push origin feature/ma-feature`
4. Ouvrir une Pull Request

---

*Genep'express v0.2 · Mars 2026*
