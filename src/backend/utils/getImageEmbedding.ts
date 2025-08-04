export async function getImageEmbedding(
	imageUrl: string
): Promise<number[] | null> {
	const res = await fetch("/api/image/embedding", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ imageUrl }),
	});

	if (!res.ok) {
		console.error("Backend embedding fetch failed");
		return null;
	}

	const data = await res.json();
	console.log("DATA: ", data);
	return data?.embedding ?? null;
}

export function averageEmbeddings(embeddings: number[][]): number[] {
	console.log("embeddings to average: ", embeddings);
	const len = embeddings[0].length;
	const avg = Array(len).fill(0);
	for (const emb of embeddings) {
		for (let i = 0; i < len; i++) {
			avg[i] += emb[i];
		}
	}
	return avg.map((x) => x / embeddings.length);
}
