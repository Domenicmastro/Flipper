import express from "express";
import fetch from "node-fetch"; // if using CommonJS/ESM, make sure node-fetch is installed
import dotenv from "dotenv";
dotenv.config({ path: "../.env" }); // adjust path if needed
const router = express.Router();

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

router.post("/embedding", async (req, res) => {
	const { imageUrl } = req.body;

	if (!imageUrl) {
		res.status(400).json({ error: "Missing imageUrl" });
		return;
	}

	try {
		const response = await fetch("https://api.replicate.com/v1/predictions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Token ${REPLICATE_API_TOKEN}`,
			},
			body: JSON.stringify({
				// model:
				// 	"krthr/clip-embeddings:1c0371070cb827ec3c7f2f28adcdde54b50dcd239aa6faea0bc98b174ef03fb4",
				version:
					"1c0371070cb827ec3c7f2f28adcdde54b50dcd239aa6faea0bc98b174ef03fb4",
				input: {
					image: imageUrl,
				},
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Replicate API error:", errorText);
			res.status(500).json({ error: "Replicate request failed" });
			return;
		}

		const replicateRes = (await response.json()) as any;

		// Wait until the prediction is completed (polling loop)
		const predictionId = replicateRes.id;
		let predictionStatus = replicateRes.status;
		let output = null;

		while (predictionStatus !== "succeeded" && predictionStatus !== "failed") {
			await new Promise((r) => setTimeout(r, 1000));
			const pollRes = await fetch(
				`https://api.replicate.com/v1/predictions/${predictionId}`,
				{
					headers: {
						Authorization: `Token ${REPLICATE_API_TOKEN}`,
					},
				}
			);
			const pollData = (await pollRes.json()) as any;
			predictionStatus = pollData.status;
			output = pollData.output;
		}

		if (predictionStatus === "failed") {
			console.error("Prediction failed:", replicateRes);
			res.status(500).json({ error: "Embedding generation failed" });
			return;
		}

		console.log("got embedding: ", output.embedding);
		res.status(200).json({ embedding: output.embedding });
	} catch (err) {
		console.error("Embedding route error:", err);
		res.status(500).json({ error: "Backend embedding fetch failed" });
		return;
	}
});

export default router;
