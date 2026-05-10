import { useState, useEffect, useCallback } from "react";

let _show = null;

export function useToast() {
  const [state, setState] = useState({
    msg: "",
    visible: false,
    exiting: false,
  });

  useEffect(() => {
    _show = (msg) => {
      setState({ msg, visible: true, exiting: false });
      setTimeout(() => setState((s) => ({ ...s, exiting: true })), 1900);
      setTimeout(
        () => setState({ msg: "", visible: false, exiting: false }),
        2200,
      );
    };
    return () => {
      _show = null;
    };
  }, []);

  return state;
}

export function showToast(msg) {
  if (_show) _show(msg);
}

export default function Toast({ state }) {
  if (!state.visible) return null;
  return (
    <div
      className={`
        fixed bottom-20 left-1/2 z-50
        bg-amber-400 text-slate-950
        font-mono text-xs font-semibold uppercase tracking-wider
        px-5 py-3 rounded-full whitespace-nowrap shadow-xl
        ${state.exiting ? "toast-exit" : "toast-enter"}
      `}
    >
      {state.msg}
    </div>
  );
}
