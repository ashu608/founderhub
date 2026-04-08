// src/store/ideas.store.js
import { create } from "zustand";

export const useIdeasStore = create((set) => ({
  activeSort: "trending",
  activeTag:  null,
  setSort: (sort) => set({ activeSort: sort }),
  setTag:  (tag)  => set({ activeTag: tag }),
  reset:   ()     => set({ activeSort: "trending", activeTag: null }),
}));

// src/store/notifications.store.js — in same file for brevity, split if preferred
import { create as createNotif } from "zustand";

export const useNotifStore = createNotif((set) => ({
  items:       [],
  unreadCount: 0,
  add:     (n)  => set(s => ({ items: [n, ...s.items], unreadCount: s.unreadCount + 1 })),
  setAll:  (ns) => set({ items: ns, unreadCount: ns.filter(n => !n.isRead).length }),
  markRead:()   => set(s => ({ items: s.items.map(n => ({ ...n, isRead: true })), unreadCount: 0 })),
}));