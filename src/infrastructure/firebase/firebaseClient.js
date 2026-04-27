import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyCIdlI8mXu2UeujV3nx9MMI051kTjEirN8',
  authDomain: 'drilling-app-d57d8.firebaseapp.com',
  databaseURL: 'https://drilling-app-d57d8-default-rtdb.firebaseio.com',
  projectId: 'drilling-app-d57d8',
  storageBucket: 'drilling-app-d57d8.firebasestorage.app',
  messagingSenderId: '1013959235478',
  appId: '1:1013959235478:web:25c9e6768e7df215caafb7',
}

let app
let db
let ready = false

try {
  app = initializeApp(firebaseConfig)
  db = getDatabase(app)
  ready = true
} catch (error) {
  console.warn('Firebase not configured - offline mode', error)
}

export { db, ready }
