import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(
	__dirname,
	"../config/firebase-service-account.json"
);

if (!getApps().length) {
	initializeApp({
		credential: cert(serviceAccountPath),
		projectId: "flipper-ae6d1",
	});
}

export const adminAuth = getAuth();
