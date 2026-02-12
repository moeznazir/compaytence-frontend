"use client";

import { create } from "zustand";
import type { Notification } from "@/lib/types";

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  setNotifications: (items: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (item: Notification) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  unreadCount: 0,
  setNotifications: (items) =>
    set({
      items,
      unreadCount: items.filter((n) => !n.read).length,
    }),
  markAsRead: (id) =>
    set((state) => {
      const items = state.items.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        items,
        unreadCount: items.filter((n) => !n.read).length,
      };
    }),
  markAllAsRead: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  addNotification: (item) =>
    set((state) => ({
      items: [item, ...state.items],
      unreadCount: state.unreadCount + (item.read ? 0 : 1),
    })),
}));
