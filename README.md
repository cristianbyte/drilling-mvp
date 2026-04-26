# FOR-PO-04 · Drilling Operator App

React + Vite + Tailwind app for drilling shift registration.

## Setup

```bash
npm install
npm run dev
```

## Firebase Configuration

Edit `src/lib/firebase.js` and replace the placeholder values in `firebaseConfig` with your actual project credentials:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

## Firebase Database Rules (recommended)

```json
{
  "rules": {
    "shifts": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "holes": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Data Structure

```
shifts/{shiftId}       ← one per shift (header, frozen)
  operatorName
  equipment
  date
  shift                DIA | NOCHE
  blastId              # Voladura
  diameter             mm
  elevation            m
  pattern
  createdAt
  frozenAt

holes/{holeId}         ← one per barreno (repetitive)
  shiftId              FK → shifts
  holeNumber
  depth                m
  ceiling              m
  floor                m
  createdAt
  updatedAt            set by supervisor on correction
  updatedBy            supervisor name
```

## Components

| Component      | Role                                                  |
| -------------- | ----------------------------------------------------- |
| `ShiftHeader`  | Header form, freezes on submit, calls `createShift()` |
| `HoleEntry`    | Repetitive barreno form, calls `createHole()`         |
| `ConfirmModal` | Confirmation dialog before submitting shift           |
| `HoleLog`      | Running list + total meters                           |
| `Toast`        | Global notification                                   |

## Supervisor Corrections

Use `updateHole(holeId, patch, name)` from `src/lib/firebase.js` to correct any hole by its Firebase ID. The `updatedAt` and `updatedBy` fields are written automatically — full audit trail.
