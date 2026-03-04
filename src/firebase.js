import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyApCRIN0_awAg48FGc7A0hjm0WEarTy6Uw",
  authDomain: "echo-chat-f949c.firebaseapp.com",
  projectId: "echo-chat-f949c",
  storageBucket: "echo-chat-f949c.firebasestorage.app",
  messagingSenderId: "800344635155",
  appId: "1:800344635155:web:246b36ce1983591799cce6"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    // 🔥 Your actual VAPID key is now here!
    const currentToken = await getToken(messaging, { vapidKey: 'BBMNCSlYLlCaw9sfzknceQGVfkFdvDCwKECtP0KbK50HPdNCXikDgBdCXy0jQl1qiXrTAIom_ZZEHT1W3cYLBYY' });
    if (currentToken) {
      console.log('Current FCM Token: ', currentToken);
      
      // We will add an Axios call right here later to send this token to your MongoDB database!
      return currentToken;
      
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { messaging };