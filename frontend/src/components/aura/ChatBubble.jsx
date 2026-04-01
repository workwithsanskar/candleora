import PropTypes from "prop-types";
import { m } from "framer-motion";
import MessageActions from "./MessageActions";

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <span className="text-[11px] font-medium tracking-[0.08em] text-white/58">
        Preparing your reply
      </span>
      <div className="flex items-center gap-1.5" aria-label="Aura is typing">
        {Array.from({ length: 3 }).map((_, index) => (
          <m.span
            key={index}
            className="inline-block h-2 w-2 rounded-full bg-white/78 shadow-[0_0_16px_rgba(255,255,255,0.18)]"
            animate={{ opacity: [0.28, 1, 0.28], y: [0, -2, 0], scale: [0.94, 1.08, 0.94] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.14, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ message, isTyping = false, children = null, onAction }) {
  const isUser = message.role === "user";
  const hasRichContent = Boolean(children);
  const bubbleClassName = isUser
    ? "max-w-[82%] rounded-[24px] rounded-br-[10px] bg-black text-white"
    : `${
        isTyping
          ? "w-auto max-w-[280px]"
          : hasRichContent
            ? "w-full max-w-[92%] sm:max-w-[90%]"
            : "max-w-[88%]"
      } rounded-[24px] rounded-bl-[10px] border border-white/12 bg-white/10 text-white backdrop-blur-xl`;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <m.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className={`${bubbleClassName} px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.2)]`}
      >
        {!isUser ? (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/48">
            Aura
          </p>
        ) : null}

        {isTyping ? (
          <TypingIndicator />
        ) : (
          <>
            {message.content ? <p className="text-sm leading-6 text-inherit">{message.content}</p> : null}
            <MessageActions actions={message.actions} onAction={onAction} />
            {children ? <div className="mt-3 space-y-3">{children}</div> : null}
          </>
        )}
      </m.div>
    </div>
  );
}

ChatBubble.propTypes = {
  children: PropTypes.node,
  isTyping: PropTypes.bool,
  message: PropTypes.shape({
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        href: PropTypes.string,
        label: PropTypes.string.isRequired,
        type: PropTypes.string,
        payload: PropTypes.object,
      }),
    ),
    content: PropTypes.string,
    role: PropTypes.oneOf(["assistant", "user"]).isRequired,
  }).isRequired,
  onAction: PropTypes.func,
};

export default ChatBubble;
