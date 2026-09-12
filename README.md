# Diam Yaraam — Espace d'Administration Centralisée (Vue.js 3 + TypeScript)

Application web d'administration de la plateforme de santé **Diam-Yaraam**, conçue pour conférer à l'administrateur un **contrôle total** sur l'ensemble de l'écosystème : utilisateurs, professionnels de santé certifiés ONMS, patients, dossiers médicaux, téléconsultations, portefeuilles financiers et surveillance de l'infrastructure microservices.

---

## 🏛️ Architecture & Modules de Contrôle

1. **Tableau de Bord Exécutif (`/`)**
   - Indicateurs en temps réel (Utilisateurs, Praticiens ONMS, Consultations, Volume financier FCFA).
   - Raccourcis d'actions rapides et jauges de distribution des statuts de compte.
   - Flux d'événements de sécurité récents.

2. **Utilisateurs & Comptes (`/users`)**
   - Annuaire filtrable et recherche multi-critères en temps réel.
   - Déblocage immédiat de compte et réinitialisation du compteur d'échecs de connexion (RM024).
   - Modification de statut (`ACTIF`, `SUSPENDU`, `BLOQUE`, `EN_ATTENTE`) et promotion de rôles (`ADMIN`, `MEDECIN`, `PATIENT`).
   - Création manuelle d'utilisateurs et suppression de compte.

3. **Ordre National des Médecins & Praticiens (`/medecins`)**
   - **Registre officiel ONMS** : CRUD complet des médecins autorisés à exercer (N° d'ordre, section, spécialité, hôpital, statut).
   - **Praticiens Plateforme** : Approbation et validation des comptes praticiens inscrits sur l'application mobile.

4. **Patients & Dossiers Médicaux (`/patients`)**
   - Fiches patients, coordonnées d'urgence et consentements d'analyse IA.
   - Modal d'inspection médicale approfondie : groupe sanguin, constantes vitales, allergies, antécédents, ordonnances et QR code d'urgence anonymisé.

5. **Rendez-Vous & Téléconsultations (`/rendez-vous`)**
   - Supervision des consultations médicales présentielles et à distance (LiveKit).
   - Forçage de statut de rendez-vous avec motif d'audit ou annulation administrative.

6. **Finances & Portefeuilles Santé (`/finances`)**
   - Gestion des portefeuilles et visualisation des soldes en Francs CFA.
   - Grand livre de toutes les opérations financières (Wave, Orange Money, débits de soins).
   - Modal de régularisation manuelle de solde (crédit / débit) avec traçabilité d'audit.

7. **Sécurité, Audit & Santé Système (`/systeme`)**
   - Sonde de disponibilité et temps de latence des 10 microservices Diam-Yaraam.
   - Consultation des journaux d'audit de sécurité (`auth_schema.audit_log`).

---

## 🛠️ Stack Technique

- **Framework** : Vue.js 3 (Composition API `<script setup>`)
- **Build Tool** : Vite 8
- **Langage** : TypeScript 6
- **Routage** : Vue Router 4 (avec gardiens de navigation `beforeEach`)
- **Gestion HTTP** : Axios (avec intercepteur JWT et gestion globale du code 401)
- **Design & CSS** : Design System Vanilla CSS sur-mesure (Police *Plus Jakarta Sans*, palettes HSL, animations douces)

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js >= 20
- Les microservices Diam-Yaraam ou l'API Gateway démarrée sur le port `8090`.

### Installation & Lancement
```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement (Port 5173)
npm run dev

# Vérification TypeScript et build de production
npm run build
```

---

## 🔐 Identifiants Administrateur Démo

- **Téléphone** : `+221770000000`
- **Mot de passe** : `Fatou3112`
*(Un bouton de remplissage automatique est disponible sur la page de connexion)*
