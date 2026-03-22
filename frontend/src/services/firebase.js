let firebaseApp;
let firebaseModulesPromise;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every(Boolean);
}

async function loadFirebaseModules() {
  if (!firebaseModulesPromise) {
    firebaseModulesPromise = Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
    ]).then(([appModule, authModule]) => ({
      appModule,
      authModule,
    }));
  }

  return firebaseModulesPromise;
}

export async function getFirebaseAuth() {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase phone authentication is not configured.");
  }

  const { appModule, authModule } = await loadFirebaseModules();

  if (!firebaseApp) {
    firebaseApp = appModule.initializeApp(firebaseConfig);
  }

  return authModule.getAuth(firebaseApp);
}

export async function createRecaptchaVerifier(containerId) {
  const { authModule } = await loadFirebaseModules();
  const auth = await getFirebaseAuth();

  return new authModule.RecaptchaVerifier(auth, containerId, {
    size: "invisible",
  });
}

export async function requestPhoneOtp(phoneNumber, verifier) {
  const { authModule } = await loadFirebaseModules();
  const auth = await getFirebaseAuth();
  return authModule.signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function signOutFirebaseAuth() {
  const { authModule } = await loadFirebaseModules();
  const auth = await getFirebaseAuth();
  return authModule.signOut(auth);
}
