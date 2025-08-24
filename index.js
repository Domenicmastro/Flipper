import app from "./src/backend/app.ts";

const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});