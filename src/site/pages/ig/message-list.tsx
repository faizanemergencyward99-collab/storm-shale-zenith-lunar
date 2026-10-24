// Virtualised message list: only rows on screen are mounted, so scrolling
// stays smooth with thousands of messages. Older pages load on scroll-up and
// are prepended without moving what you are looking at.
import { forwardRef, memo, useMemo, useRef, type MutableRefObject } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import type { ChatMessage, Sender } from "@/site/lib/cloud-chat.ts";
import MessageRow, { Avatar, type GroupPos, type RowHandlers } from "./message-row.tsx";
import { shouldAnimate } from "./anim.ts";
import { fmtSeparator, firstName } from "./util.ts";

const START = 1_000_000;
const SEPARATOR_GAP = 30 * 60 * 1000;

interface Props {
  messages: ChatMessage[];
  me: Sender;
  other: Sender;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  loadOlder: () => Promise<number>;
  detached: boolean;
  loadNewer: () => Promise<number>;
  term: string;
  currentHitId: string | null;
  flashId: string | null;
  liftedId: string | null;
  uploading: Set<string>;
  progress: Record<string, { done: number; total: number }>;
  compressing: { id: string; pct: number } | null;
  otherTyping: boolean;
  handlers: RowHandlers;
  listRef: MutableRefObject<VirtuosoHandle | null>;
  onAtBottom: (v: boolean) => void;
}

function Typing({ other }: { other: Sender }) {
  return (
    <div className="ig-row" data-side="in" data-pos="single" data-testid="typing-indicator">
      <div className="ig-line">
        <span className="ig-avatar-slot"><Avatar who={other} /></span>
        <div className="ig-typing"><i /><i /><i /></div>
      </div>
    </div>
  );
}

const Scroller = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function Scroller(props, ref) {
  return <div {...props} ref={ref} className="ig-scroller" data-testid="chat-scroller" />;
});

interface Ctx { loadingOlder: boolean; otherTyping: boolean; other: Sender }
const ListHead = ({ context }: { context?: Ctx }) => (
  <div className="ig-list-head">{context?.loadingOlder && <span className="ig-spin" data-testid="loading-older" />}</div>
);
const ListFoot = ({ context }: { context?: Ctx }) => (
  <div className="ig-list-foot">{context?.otherTyping && <Typing other={context.other} />}</div>
);
const COMPONENTS = { Scroller, Header: ListHead, Footer: ListFoot };

function MessageList(p: Props) {
  const { messages, me, other } = p;
  const firstIdx = useRef(START);
  const prevFirstId = useRef<string | null>(null);
  const firstItemIndex = useMemo(() => {
    if (messages.length) {
      const prevId = prevFirstId.current;
      if (prevId && messages[0].id !== prevId) {
        const k = messages.findIndex((m) => m.id === prevId);
        if (k > 0) firstIdx.current -= k;
      }
      prevFirstId.current = messages[0].id;
    }
    return firstIdx.current;
  }, [messages]);

  const ids = useMemo(() => new Set(messages.map((m) => m.id)), [messages]);

  // `i` can briefly fall outside the array while a freshly prepended page and
  // the new firstItemIndex land in different renders — never read blind.
  const sep = (i: number) => {
    const cur = messages[i];
    const prev = messages[i - 1];
    if (!cur) return false;
    return !prev || cur.timestamp - prev.timestamp > SEPARATOR_GAP;
  };
  const joins = (a: ChatMessage | undefined, b: ChatMessage | undefined, bIdx: number) =>
    !!a && !!b && a.sender === b.sender && !sep(bIdx) && !b.replySnapshot;

  const itemContent = (index: number, m: ChatMessage) => {
    const i = index - firstItemIndex;
    const mine = m.sender === me;
    const withPrev = joins(messages[i - 1], m, i);
    const withNext = joins(m, messages[i + 1], i + 1);
    const pos: GroupPos = withPrev && withNext ? "middle" : withPrev ? "last" : withNext ? "first" : "single";
    let label: string | null = null;
    if (m.replySnapshot) {
      const toMe = m.replySnapshot.sender === me;
      label = mine ? (toMe ? "You replied to yourself" : "You replied") : toMe ? `${firstName(other)} replied to you` : `${firstName(other)} replied`;
    }
    return (
      <MessageRow
        msg={m}
        mine={mine}
        pos={pos}
        timeLabel={sep(i) ? fmtSeparator(m.timestamp) : null}
        showAvatar={!mine && (pos === "last" || pos === "single")}
        other={other}
        label={label}
        quoteMissing={!!m.replyToId && !ids.has(m.replyToId) && !p.hasMoreOlder}
        term={p.term}
        current={p.currentHitId === m.id}
        flash={p.flashId === m.id}
        hidden={p.liftedId === m.id}
        uploading={p.uploading.has(m.id)}
        progress={p.progress[m.id] ?? null}
        compressPct={p.compressing?.id === m.id ? p.compressing.pct : null}
        animate={shouldAnimate(m.id, m.timestamp)}
        handlers={p.handlers}
      />
    );
  };

  return (
    <Virtuoso
      ref={p.listRef}
      className="ig-virtuoso"
      data={messages}
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={{ index: Math.max(0, messages.length - 1), align: "end" }}
      computeItemKey={(_, m) => m.id}
      itemContent={itemContent}
      alignToBottom
      followOutput={(atBottom) => (atBottom && !p.detached ? "smooth" : false)}
      atBottomThreshold={90}
      atBottomStateChange={p.onAtBottom}
      startReached={() => { void p.loadOlder(); }}
      endReached={() => { if (p.detached) void p.loadNewer(); }}
      increaseViewportBy={{ top: 700, bottom: 300 }}
      context={{ loadingOlder: p.loadingOlder, otherTyping: p.otherTyping, other }}
      components={COMPONENTS}
    />
  );
}

export default memo(MessageList);
