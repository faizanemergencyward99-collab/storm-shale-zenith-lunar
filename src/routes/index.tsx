import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import "@/site/index.css";
import App from "@/site/App";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  useEffect(() => {
    void import("@/site/lib/interaction-lock").then((m) => m.installInteractionLock());
    void import("@/site/lib/orientation-lock").then((m) => m.installOrientationLock());
  }, []);

  return (
    <div id="root">
      <App />
    </div>
  );
}
