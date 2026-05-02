# Le Code Masculin — Application Mobile
**Pilier Conscient · Prince Johann Akombi · SDK 54**

---

## Installation (3 commandes)

### Prérequis
- Node.js 18+ → [nodejs.org](https://nodejs.org)
- **Expo Go SDK 54** sur ton Android ✅ (déjà installé)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Lancer en mode tunnel
```bash
npm run tunnel
```
*(ou : `npx expo start --tunnel`)*

### 3. Scanner le QR code
Dans **Expo Go**, onglet "Scan QR Code" → scanner le QR affiché dans le terminal.

---

## Si erreur "module not found" après npm install
```bash
npx expo install --fix
npm run tunnel
```

## Structure
```
app/
  (auth)/   → splash, pacte, quiz, resultats, register, login
  (tabs)/   → accueil, programme, coach, bibliotheque, profil
src/
  theme/    → colors, typography, spacing
  screens/  → tous les écrans
  constants/→ pillars, quiz
  components/ store/ services/ types/
assets/     → icon, splash, adaptive-icon
```

---
*Pilier Conscient © 2026*
