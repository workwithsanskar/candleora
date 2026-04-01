import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import ChatBubble from "./aura/ChatBubble";
import CollectionCard from "./aura/CollectionCard";
import OrderCard from "./aura/OrderCard";
import ProductCard from "./aura/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { chatApi } from "../services/api";
import { formatApiError } from "../utils/format";
import {
  buildAuraChatStorageKey,
  clearStoredJson,
  readStoredJson,
  writeStoredJson,
} from "../utils/storage";

const DEFAULT_SUGGESTIONS = ["Gift ideas", "Track order", "What's in my cart"];
const WELCOME_COPY = "Hi, I'm Aura \u2728 Looking for the perfect candle, your cart, or help with an order?";
const EMPTY_STATE_COPY = "Let's find your perfect vibe.";
const ERROR_COPY = "Something went wrong... but I'm still here to help \u2728";
const HIDDEN_ROUTE_PREFIXES = [
  "/checkout",
  "/order-confirmation",
];
const HIDDEN_EXACT_ROUTES = new Set(["/login", "/signup", "/verify-email"]);

function buildMessage(payload) {
  return {
    id: payload.id ?? createMessageId(),
    role: payload.role,
    type: payload.type ?? "text",
    content: payload.content ?? "",
    data: payload.data ?? null,
    suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
    actions: Array.isArray(payload.actions) ? payload.actions : [],
  };
}

function createWelcomeMessage() {
  return buildMessage({
    id: "aura-welcome",
    role: "assistant",
    type: "text",
    content: WELCOME_COPY,
    data: WELCOME_COPY,
    suggestions: DEFAULT_SUGGESTIONS,
  });
}

function readInitialMessages(storageKey) {
  const storedMessages = readStoredJson(storageKey, []);
  return Array.isArray(storedMessages) && storedMessages.length
    ? storedMessages
    : [createWelcomeMessage()];
}

function createMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `aura-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeIntentMessage(value) {
  return String(value ?? "").toLowerCase().trim();
}

function buildAuraChatScope(isAuthenticated, user) {
  if (!isAuthenticated) {
    return "guest";
  }

  const accountIdentity = user?.id ?? user?.email ?? user?.phone ?? null;
  if (!accountIdentity) {
    return "signed-in-pending";
  }

  return `user:${String(accountIdentity).trim().toLowerCase()}`;
}

function isCartSnapshotIntent(value) {
  const normalized = normalizeIntentMessage(value);
  return [
    "what's in my cart",
    "what is in my cart",
    "my cart",
    "show cart",
    "cart summary",
    "cart items",
  ].some((phrase) => normalized.includes(phrase));
}

function isWishlistSnapshotIntent(value) {
  const normalized = normalizeIntentMessage(value);
  return [
    "my wishlist",
    "show wishlist",
    "wishlist",
    "saved items",
    "saved candles",
    "favorites",
    "favourites",
  ].some((phrase) => normalized.includes(phrase));
}

function buildCartSummaryFromState(items, grandTotal) {
  const totalItems = items.reduce((count, item) => count + Number(item.quantity ?? 0), 0);

  return {
    title: totalItems ? "Your current cart" : "Your cart is empty",
    actionLabel: totalItems ? "View cart" : "Explore shop",
    actionPath: totalItems ? "/cart" : "/shop",
    totalItems,
    totalAmount: Number(grandTotal ?? 0),
    items: items.slice(0, 3).map((item) => ({
      productId: Number(item.productId ?? item.id),
      slug: item.slug ?? "",
      productName: item.productName,
      imageUrl: item.imageUrl ?? "",
      occasionTag: item.occasionTag ?? "",
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      lineTotal: Number(item.lineTotal ?? 0),
    })),
  };
}

function buildWishlistSummaryFromState(items) {
  return {
    title: items.length ? "Your saved candles" : "Your wishlist is empty",
    actionLabel: items.length ? "View wishlist" : "Explore shop",
    actionPath: items.length ? "/wishlist" : "/shop",
    totalItems: items.length,
    totalAmount: items.reduce((total, item) => total + Number(item.price ?? 0), 0),
    items: items.slice(0, 3).map((item) => ({
      productId: Number(item.id),
      slug: item.slug ?? "",
      productName: item.name,
      imageUrl: item.imageUrl ?? "",
      occasionTag: item.occasionTag ?? "",
      unitPrice: Number(item.price ?? 0),
      lineTotal: Number(item.price ?? 0),
    })),
  };
}

function shouldHideAura(pathname) {
  if (HIDDEN_EXACT_ROUTES.has(pathname)) {
    return true;
  }

  if (pathname.startsWith("/orders/")) {
    return true;
  }

  return HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function AuraChatbot() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated, user } = useAuth();
  const { items, grandTotal } = useCart();
  const { items: wishlistItems } = useWishlist();
  const chatStorageKey = useMemo(
    () => buildAuraChatStorageKey(buildAuraChatScope(isAuthenticated, user)),
    [isAuthenticated, user?.email, user?.id, user?.phone],
  );
  const scrollHostRef = useRef(null);
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState(() => readInitialMessages(chatStorageKey));
  const [hydratedStorageKey, setHydratedStorageKey] = useState(chatStorageKey);
  const messagesRef = useRef(messages);
  const isHiddenForRoute = shouldHideAura(location.pathname);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (hydratedStorageKey !== chatStorageKey) {
      return;
    }

    writeStoredJson(hydratedStorageKey, messages.slice(-24));
  }, [chatStorageKey, hydratedStorageKey, messages]);

  useEffect(() => {
    if (hydratedStorageKey === chatStorageKey) {
      return;
    }

    const nextMessages = readInitialMessages(chatStorageKey);
    messagesRef.current = nextMessages;
    setDraft("");
    setIsTyping(false);
    setHydratedStorageKey(chatStorageKey);

    startTransition(() => {
      setMessages(nextMessages);
    });
  }, [chatStorageKey, hydratedStorageKey]);

  useEffect(() => {
    if (isHiddenForRoute && isOpen) {
      setIsOpen(false);
    }
  }, [isHiddenForRoute, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || location.pathname !== "/faq") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/faq" || isOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsOpen(true);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, location.pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const host = scrollHostRef.current;
    if (!host) {
      return;
    }

    host.scrollTo({
      top: host.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [isOpen, isTyping, messages, prefersReducedMotion]);

  const handleConversationWheel = (event) => {
    event.stopPropagation();
  };

  const activeSuggestions = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === "assistant" && Array.isArray(message.suggestions) && message.suggestions.length) {
        return message.suggestions;
      }
    }

    return DEFAULT_SUGGESTIONS;
  }, [messages]);

  const hasOnlyWelcomeMessage =
    messages.length === 1 && messages[0]?.role === "assistant" && messages[0]?.id === "aura-welcome";

  const appendMessage = (nextMessage) => {
    startTransition(() => {
      setMessages((currentMessages) => {
        const nextMessages = [...currentMessages, nextMessage];
        messagesRef.current = nextMessages;
        return nextMessages;
      });
    });
  };

  const logAuraInteraction = (payload) => {
    void chatApi.logEvent({
      pagePath: location.pathname,
      chatScope: hydratedStorageKey,
      ...payload,
    }).catch(() => {});
  };

  const buildLocalSnapshotReply = (messageText) => {
    if (isCartSnapshotIntent(messageText)) {
      const summary = buildCartSummaryFromState(items, grandTotal);
      const hasItems = summary.totalItems > 0;

      return buildMessage({
        role: "assistant",
        type: "cart",
        content: hasItems
          ? "Here is your current CandleOra cart in one quick view."
          : "Your CandleOra cart is empty right now. I can pull a few beautiful options if you want to start fresh.",
        data: summary,
        suggestions: hasItems
          ? ["Gift ideas", "Best sellers", "My wishlist"]
          : ["Best sellers", "Gift ideas", "My wishlist"],
      });
    }

    if (isWishlistSnapshotIntent(messageText)) {
      const summary = buildWishlistSummaryFromState(wishlistItems);
      const hasItems = summary.totalItems > 0;

      return buildMessage({
        role: "assistant",
        type: "wishlist",
        content: hasItems
          ? "These are the CandleOra pieces you have saved so far."
          : "Your wishlist is empty at the moment. I can help you save a few gift-ready or best-selling candles next.",
        data: summary,
        suggestions: hasItems
          ? ["Gift ideas", "What's in my cart", "Best sellers"]
          : ["Best sellers", "Gift ideas", "What's in my cart"],
      });
    }

    return null;
  };

  const resetConversation = () => {
    const initialMessages = [createWelcomeMessage()];
    clearStoredJson(hydratedStorageKey);
    messagesRef.current = initialMessages;
    setDraft("");
    setIsTyping(false);

    startTransition(() => {
      setMessages(initialMessages);
    });

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleStructuredAction = (action) => {
    const actionType = String(action?.type ?? "").trim().toLowerCase();
    const payload = action?.payload ?? {};

    switch (actionType) {
      case "open_cart":
        navigate("/cart");
        return;
      case "open_checkout_step":
        navigate(`/checkout/${payload.step ?? "review"}`);
        return;
      case "view_product":
        if (payload.slug) {
          navigate(`/product/${payload.slug}`);
          return;
        }
        if (payload.productId) {
          navigate(`/product/${payload.productId}`);
          return;
        }
        navigate("/shop");
        return;
      case "view_order":
        if (payload.orderId) {
          navigate(`/orders/${payload.orderId}`);
          return;
        }
        navigate("/orders");
        return;
      case "apply_coupon":
        navigate("/cart");
        return;
      default:
        if (action?.href?.startsWith("/")) {
          navigate(action.href);
        }
    }
  };

  const sendMessage = async (rawMessage) => {
    const message = rawMessage.trim();
    if (!message || isTyping) {
      return;
    }

    setIsOpen(true);
    setDraft("");

    const userMessage = buildMessage({
      role: "user",
      type: "text",
      content: message,
      data: message,
    });
    const currentMessages = messagesRef.current;

    appendMessage(userMessage);

    const localSnapshotReply = buildLocalSnapshotReply(message);
    if (localSnapshotReply) {
      appendMessage(localSnapshotReply);
      return;
    }

    setIsTyping(true);

    try {
      const history = [...currentMessages, userMessage]
        .slice(-10)
        .map((entry) => ({ role: entry.role, content: entry.content }));

      const response = await chatApi.sendMessage({
        message,
        history,
        context: {
          pagePath: location.pathname,
          authenticated: isAuthenticated,
          customerName: user?.name ?? "",
          cartTotal: grandTotal,
          cartItems: items.map((item) => ({
            productId: Number(item.productId ?? item.id),
            slug: item.slug ?? "",
            productName: item.productName,
            imageUrl: item.imageUrl ?? "",
            occasionTag: item.occasionTag ?? "",
            quantity: Number(item.quantity ?? 0),
            unitPrice: Number(item.unitPrice ?? 0),
            lineTotal: Number(item.lineTotal ?? 0),
          })),
          wishlistItems: wishlistItems.map((item) => ({
            productId: Number(item.id),
            slug: item.slug ?? "",
            productName: item.name,
            imageUrl: item.imageUrl ?? "",
              occasionTag: item.occasionTag ?? "",
              price: Number(item.price ?? 0),
            })),
          chatScope: hydratedStorageKey,
        },
      });

      appendMessage(
        buildMessage({
          role: "assistant",
          type: response?.type ?? "text",
          content: response?.message ?? (typeof response?.data === "string" ? response.data : ""),
          data: response?.data ?? null,
          suggestions: response?.suggestions ?? DEFAULT_SUGGESTIONS,
          actions: response?.actions ?? [],
        }),
      );
    } catch (error) {
      appendMessage(
        buildMessage({
          role: "assistant",
          type: "text",
          content: `${ERROR_COPY} ${formatApiError(error)}`,
          data: `${ERROR_COPY} ${formatApiError(error)}`,
          suggestions: DEFAULT_SUGGESTIONS,
        }),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(draft);
  };

  const handleInputKeyDown = async (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    await sendMessage(draft);
  };

  const panelMotion = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, y: 16, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 14, scale: 0.97 },
        transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
      };

  if (isHiddenForRoute) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen ? (
          <m.button
            key="aura-launcher"
            type="button"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-5 right-5 z-[80] flex items-center gap-3 rounded-full border border-white/16 bg-black/85 px-4 py-3 text-left text-white shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl"
            aria-label="Open Aura by CandleOra"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3.8L13.9 8.3L18.6 10.2L13.9 12.1L12 16.6L10.1 12.1L5.4 10.2L10.1 8.3L12 3.8Z" />
                <path d="M17.8 15.8L18.7 18L20.9 18.9L18.7 19.8L17.8 22L16.9 19.8L14.7 18.9L16.9 18L17.8 15.8Z" />
              </svg>
            </span>

            <span className="hidden min-w-0 sm:block">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.26em] text-white/46">
                Aura by CandleOra
              </span>
              <span className="mt-1 block text-sm font-medium leading-5 text-white">
                Your personal candle concierge
              </span>
            </span>
          </m.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <m.section
            key="aura-panel"
            {...panelMotion}
            className="fixed bottom-4 right-4 z-[90] flex h-[min(78vh,720px)] w-[min(420px,calc(100vw-20px))] min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/12 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_44%),linear-gradient(180deg,_rgba(21,21,21,0.96),_rgba(8,8,8,0.96))] text-white shadow-[0_32px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl"
          >
            <header className="border-b border-white/10 px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/42">
                    Aura by CandleOra
                  </p>
                  <div className="mt-2 flex min-w-0 items-end gap-3">
                    <h2 className="shrink-0 font-display text-[1.65rem] leading-none text-white">
                      Luxury Concierge
                    </h2>
                    <p className="min-w-0 truncate pb-0.5 text-[12px] leading-none text-white/58">
                      Gifting, cart, candle care, wishlists, and order updates.
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={resetConversation}
                    className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/12 bg-white/6 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/76 transition hover:bg-white/12"
                  >
                    New chat
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/82 transition hover:bg-white/12"
                    aria-label="Close Aura"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
                      <path d="M6 6L18 18" strokeLinecap="round" />
                      <path d="M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </header>

            <div className="border-b border-white/8 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {activeSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      logAuraInteraction({
                        eventType: "SUGGESTION_CLICK",
                        intent: suggestion,
                        message: suggestion,
                      });
                      void sendMessage(suggestion);
                    }}
                    disabled={isTyping}
                    className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold text-white/82 transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={scrollHostRef}
              aria-label="Aura conversation"
              onWheelCapture={handleConversationWheel}
              className="mini-cart-scroll-view stealth-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 pr-2 scroll-smooth touch-pan-y"
            >
              <div className="space-y-3.5 pb-1">
                {hasOnlyWelcomeMessage ? (
                  <div className="rounded-[24px] border border-dashed border-white/14 bg-white/4 px-4 py-3 text-sm text-white/58">
                    {EMPTY_STATE_COPY}
                  </div>
                ) : null}

                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} onAction={handleStructuredAction}>
                    {message.type === "products" && Array.isArray(message.data)
                      ? message.data.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            analyticsContext={{
                              pagePath: location.pathname,
                              chatScope: hydratedStorageKey,
                              intent: "product_recommendation",
                            }}
                          />
                        ))
                      : null}

                    {message.type === "order" && message.data ? <OrderCard order={message.data} /> : null}
                    {message.type === "cart" && message.data ? <CollectionCard kind="cart" summary={message.data} /> : null}
                    {message.type === "wishlist" && message.data ? <CollectionCard kind="wishlist" summary={message.data} /> : null}
                  </ChatBubble>
                ))}

                {isTyping ? (
                  <ChatBubble
                    message={{ role: "assistant", content: "" }}
                    isTyping
                  />
                ) : null}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/10 px-4 py-4">
              <label className="sr-only" htmlFor="aura-message">
                Ask Aura
              </label>
              <div className="flex items-center gap-2 rounded-[24px] border border-white/12 bg-white/8 p-2 backdrop-blur-xl">
                <input
                  id="aura-message"
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Ask about gifts, orders, cart, or candle care"
                  className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/36"
                />

                <button
                  type="submit"
                  disabled={!draft.trim() || isTyping}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/88 disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label="Send message"
                >
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M5 12H18" strokeLinecap="round" />
                    <path d="M13 7L18 12L13 17" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </form>
          </m.section>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default AuraChatbot;
