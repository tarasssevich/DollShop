"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getAdminLiveStateAction,
  adminReleaseReservationAction,
  type ActiveReservationDto,
  type AdminLiveState,
} from "@/actions/admin/live-sync";

interface AdminLiveSyncContextType {
  activeReservations: ActiveReservationDto[];
  pendingOrdersCount: number;
  newRequestsCount: number;
  availableProductsCount: number;
  soldProductsCount: number;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  triggerSync: () => Promise<void>;
  releaseReservation: (productId: string) => Promise<boolean>;
}

const AdminLiveSyncContext = createContext<AdminLiveSyncContextType | null>(null);

export function useAdminLiveSync() {
  const ctx = useContext(AdminLiveSyncContext);
  if (!ctx) {
    throw new Error(
      "useAdminLiveSync должен использоваться внутри AdminLiveSyncProvider"
    );
  }
  return ctx;
}

/**
 * Нежный звуковой сигнал уведомления через Web Audio API.
 * 0 внешних файлов, не блокирует UI, деликатная тональность (D5 -> A5).
 */
function playNotificationSound() {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Игнорируем ограничения браузера на воспроизведение без клика
  }
}

export function AdminLiveSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [activeReservations, setActiveReservations] = useState<ActiveReservationDto[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [availableProductsCount, setAvailableProductsCount] = useState(0);
  const [soldProductsCount, setSoldProductsCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const prevHashRef = useRef<string | null>(null);
  const shownEventsRef = useRef<Set<string>>(new Set());
  const isFirstRunRef = useRef(true);

  const performSync = useCallback(
    async (isManual = false) => {
      // Не опрашиваем, если вкладка свёрнута (экономия батареи и сети)
      if (!isManual && typeof document !== "undefined" && document.hidden) {
        return;
      }

      try {
        setIsSyncing(true);
        const liveState: AdminLiveState = await getAdminLiveStateAction();

        setActiveReservations(liveState.activeReservations);
        setPendingOrdersCount(liveState.pendingOrdersCount);
        setNewRequestsCount(liveState.newRequestsCount);
        setAvailableProductsCount(liveState.availableProductsCount);
        setSoldProductsCount(liveState.soldProductsCount);
        setLastSyncedAt(new Date());

        const prevHash = prevHashRef.current;
        prevHashRef.current = liveState.stateHash;

        // Если это не первая загрузка и хеш изменился — значит на витрине что-то произошло!
        if (!isFirstRunRef.current && prevHash && prevHash !== liveState.stateHash) {
          // Мягко обновляем Server Components текущей страницы
          router.refresh();

          // Оповещаем мастера, если есть свежее событие
          if (liveState.latestEvent && !shownEventsRef.current.has(liveState.latestEvent.id)) {
            shownEventsRef.current.add(liveState.latestEvent.id);
            playNotificationSound();

            if (liveState.latestEvent.type === "reservation") {
              toast.info(liveState.latestEvent.title, {
                description: liveState.latestEvent.message,
                duration: 6000,
              });
            } else if (liveState.latestEvent.type === "order") {
              toast.success(liveState.latestEvent.title, {
                description: liveState.latestEvent.message,
                duration: 8000,
              });
            } else if (liveState.latestEvent.type === "request") {
              toast.info(liveState.latestEvent.title, {
                description: liveState.latestEvent.message,
                duration: 6000,
              });
            }
          }
        }

        if (isFirstRunRef.current) {
          isFirstRunRef.current = false;
        }
      } catch (err) {
        // Ошибки сети не должны крашить админку
        console.warn("Фоновая синхронизация панели мастера:", err);
      } finally {
        setIsSyncing(false);
      }
    },
    [router]
  );

  // Периодический поллинг каждые 3.5 секунды
  useEffect(() => {
    let isMounted = true;

    // Первый запрос сразу после монтирования
    const initialTimer = setTimeout(() => {
      if (isMounted) {
        performSync(true);
      }
    }, 0);

    const intervalId = setInterval(() => {
      if (isMounted) {
        performSync(false);
      }
    }, 3500);

    // Мгновенный запрос при возвращении пользователя во вкладку
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isMounted) {
        performSync(true);
      }
    };

    const handleFocus = () => {
      if (isMounted) {
        performSync(true);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [performSync]);

  // Принудительное снятие брони администратором
  const releaseReservation = useCallback(
    async (productId: string): Promise<boolean> => {
      try {
        setIsSyncing(true);
        const res = await adminReleaseReservationAction({ productId });
        if (!res.success) {
          toast.error("Ошибка снятия брони", {
            description: res.error || "Не удалось снять бронь с куклы",
          });
          return false;
        }

        toast.success("Бронь успешно снята!", {
          description: "Кукла мгновенно возвращена на витрину в продажу.",
        });

        // Немедленно убираем из локального стейта
        setActiveReservations((prev) => prev.filter((r) => r.productId !== productId));

        // Запускаем полную синхронизацию и обновление роутера
        await performSync(true);
        router.refresh();
        return true;
      } catch {
        toast.error("Непредвиденный сбой", {
          description: "Пожалуйста, обновите страницу и попробуйте снова.",
        });
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [performSync, router]
  );

  return (
    <AdminLiveSyncContext.Provider
      value={{
        activeReservations,
        pendingOrdersCount,
        newRequestsCount,
        availableProductsCount,
        soldProductsCount,
        isSyncing,
        lastSyncedAt,
        triggerSync: () => performSync(true),
        releaseReservation,
      }}
    >
      {children}
    </AdminLiveSyncContext.Provider>
  );
}
