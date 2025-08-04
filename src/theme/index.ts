import { extendTheme } from "@chakra-ui/react";
import type { ThemeConfig } from "@chakra-ui/react";

// DEFINE THEME STUF HERE:
const config: ThemeConfig = {
	initialColorMode: "system",
	useSystemColorMode: true,
};

const theme = extendTheme({
	config,
	colors: {
		brand: {
			50: "#e3f9f5",
			100: "#c1eedd",
			200: "#9fe3c4",
			300: "#7dd8ab",
			400: "#5bcd92",
			500: "#42b378", // your main brand color
			600: "#32905e",
			700: "#226c44",
			800: "#12482a",
			900: "#00140f",
		},
		indigo: {
			50: "#eef2ff",
			100: "#e0e7ff",
			200: "#c7d2fe",
			300: "#a5b4fc",
			400: "#818cf8",
			500: "#6366f1",
			600: "#4f46e5",
			700: "#4338ca",
			800: "#3730a3",
			900: "#312e81",
		},
		gold: {
			50: "#fffbea",
			100: "#fff3c4",
			200: "#fce588",
			300: "#fadb5f",
			400: "#f7c948",
			500: "#f0b429",
			600: "#de911d",
			700: "#cb6e17",
			800: "#b44d12",
			900: "#8d2b0b",
		},
	},
	fonts: {
		heading: `'Poppins', sans-serif`,
		body: `'Inter', sans-serif`,
	},
	fontSizes: {
		sm: "0.875rem",
		md: "1rem",
		lg: "1.125rem",
		xl: "1.25rem",
	},
	styles: {
		global: {
			"html, body": {
				margin: 0,
				padding: 0,
				width: "100%",
				height: "100%",
			},
			"#root": {
				width: "100%",
				height: "100%",
			},
		},
	},
});
export default theme;
