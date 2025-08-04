import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./frontend/index.css";
import App from "./frontend/App.tsx";
import { Provider } from "react-redux";
import { ChakraProvider } from "@chakra-ui/react";
import store from "./frontend/redux/store.ts";
import { BrowserRouter } from "react-router-dom";
import theme from "./theme/index.ts";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			<ChakraProvider theme={theme}>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</ChakraProvider>
		</Provider>
	</StrictMode>
);
