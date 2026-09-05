"use client";

import { useSyncExternalStore } from "react";

let isOpen = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return isOpen;
}

export const chatStore = {
  openChat: () => {
    isOpen = true;
    listeners.forEach((l) => l());
  },
  closeChat: () => {
    isOpen = false;
    listeners.forEach((l) => l());
  },
  toggleChat: () => {
    isOpen = !isOpen;
    listeners.forEach((l) => l());
  },
};

export function useChatStore() {
  const open = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return {
    isOpen: open,
    openChat: chatStore.openChat,
    closeChat: chatStore.closeChat,
    toggleChat: chatStore.toggleChat,
  };
}
