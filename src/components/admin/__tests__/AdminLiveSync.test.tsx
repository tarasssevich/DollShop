import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminLiveSyncProvider, useAdminLiveSync } from "../AdminLiveSyncProvider";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock actions
vi.mock("@/actions/admin/live-sync", () => ({
  getAdminLiveStateAction: vi.fn().mockResolvedValue({
    stateHash: "mock-state-hash-12345",
    timestamp: new Date().toISOString(),
    activeReservations: [],
    pendingOrdersCount: 0,
    newRequestsCount: 0,
    availableProductsCount: 5,
    soldProductsCount: 2,
    latestEvent: null,
  }),
  adminReleaseReservationAction: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Admin Live Sync Provider & Hook", () => {
  it("экспортирует AdminLiveSyncProvider и useAdminLiveSync", () => {
    expect(typeof AdminLiveSyncProvider).toBe("function");
    expect(typeof useAdminLiveSync).toBe("function");
  });

  it("выбрасывает понятную ошибку при вызове useAdminLiveSync вне контекста провайдера", () => {
    function OrphanConsumer() {
      useAdminLiveSync();
      return null;
    }

    expect(() => {
      renderToStaticMarkup(<OrphanConsumer />);
    }).toThrow("useAdminLiveSync должен использоваться внутри AdminLiveSyncProvider");
  });

  it("успешно рендерит дочерние элементы внутри AdminLiveSyncProvider", () => {
    function ConsumerChild() {
      const { pendingOrdersCount } = useAdminLiveSync();
      return <div data-testid="pending">{pendingOrdersCount}</div>;
    }

    const html = renderToStaticMarkup(
      <AdminLiveSyncProvider>
        <ConsumerChild />
      </AdminLiveSyncProvider>
    );

    expect(html).toContain('data-testid="pending"');
    expect(html).toContain("0");
  });
});
