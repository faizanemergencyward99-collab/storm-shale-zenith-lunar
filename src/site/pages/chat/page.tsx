import IgChat from "../ig/ig-chat.tsx";

// Chat page — the Instagram-style DM screen is the whole app after unlock.
export default function ChatPage({ onExit }: { onExit: () => void }) {
  return <IgChat onExit={onExit} />;
}
