importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyApCRIN0_awAg48FGc7A0hjm0WEarTy6Uw",
  authDomain: "echo-chat-f949c.firebaseapp.com",
  projectId: "echo-chat-f949c",
  storageBucket: "echo-chat-f949c.firebasestorage.app",
  messagingSenderId: "800344635155",
  appId: "1:800344635155:web:246b36ce1983591799cce6"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // This will use your newly added blue Echo logo!
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});