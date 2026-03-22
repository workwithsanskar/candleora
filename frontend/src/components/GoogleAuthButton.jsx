import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let googleScriptPromise;

function loadGoogleScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google sign-in could not be loaded.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Google sign-in could not be loaded."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

function GoogleAuthButton({ onCredential, text, disabled, width }) {
  const containerRef = useRef(null);
  const credentialHandlerRef = useRef(onCredential);
  const [loadError, setLoadError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  credentialHandlerRef.current = onCredential;

  useEffect(() => {
    if (!clientId || !containerRef.current) {
      return undefined;
    }

    let isMounted = true;

    loadGoogleScript()
      .then(() => {
        if (!isMounted || !containerRef.current || !window.google?.accounts?.id) {
          return;
        }

        containerRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              Promise.resolve(credentialHandlerRef.current(response.credential)).catch(() => {});
            }
          },
          context: text === "signup_with" ? "signup" : "signin",
          ux_mode: "popup",
        });

        const resolvedWidth = Math.min(width, containerRef.current.clientWidth || width);

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          text,
          shape: "pill",
          width: resolvedWidth,
        });
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error.message);
        }
      });

    return () => {
      isMounted = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [clientId, text]);

  if (!clientId) {
    return (
      <p className="text-sm text-brand-muted">
        Add `VITE_GOOGLE_CLIENT_ID` to enable Google sign in.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={disabled ? "pointer-events-none opacity-60" : ""}
      />
      {loadError && <p className="text-sm font-semibold text-red-600">{loadError}</p>}
    </div>
  );
}

GoogleAuthButton.propTypes = {
  onCredential: PropTypes.func.isRequired,
  text: PropTypes.oneOf(["signin_with", "signup_with", "continue_with"]),
  disabled: PropTypes.bool,
  width: PropTypes.number,
};

GoogleAuthButton.defaultProps = {
  text: "continue_with",
  disabled: false,
  width: 320,
};

export default GoogleAuthButton;
