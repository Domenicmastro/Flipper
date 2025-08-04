import { before, after } from "mocha";
import {
	initializeApp as initAdminApp,
	getApps as getAdminApps,
	cert,
	deleteApp,
} from "firebase-admin/app";
import { fileURLToPath } from "url";
import path from "path";
import {
	getApps as getClientApps,
	deleteApp as deleteClientApp,
} from "firebase/app";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

before(async () => {
	// Initialize Firebase Admin SDK (only once)
	if (!getAdminApps().length) {
		initAdminApp({
			credential: cert(
				path.join(__dirname, "../config/firebase-service-account.json")
			),
			projectId: "flipper-ae6d1",
		});
		console.log("✅ Firebase Admin SDK initialized");
	}
});

after(async () => {
	// Clean up Admin SDK apps
	for (const app of getAdminApps()) {
		await deleteApp(app);
	}
	console.log("🧹 Firebase Admin SDK apps deleted");

	// Delete Firebase Client SDK apps
	for (const app of getClientApps()) {
		await deleteClientApp(app);
	}
	console.log("🧹 Firebase Client SDK apps deleted");
});
