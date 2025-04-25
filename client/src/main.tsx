import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set the document title
document.title = "SecureVote - Blockchain Voting with Biometric Authentication";

createRoot(document.getElementById("root")!).render(<App />);
