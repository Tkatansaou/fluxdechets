// WasteFlow — vide, aucun fetch handler, aucun cache
// Ce fichier existe uniquement pour remplacer l'ancien SW v5
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())
// PAS de fetch handler — le navigateur ne peut pas dire "no-op"
