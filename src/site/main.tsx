import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installInteractionLock } from "./lib/interaction-lock.ts";
import { installOrientationLock } from "./lib/orientation-lock.ts";

// Lock selection / zoom / long-press callouts app-wide (Instagram-style).
installInteractionLock();
// Keep the chat portrait-only on devices/browsers that support it.
installOrientationLock();

createRoot(document.getElementById("root")!).render(<App />);
