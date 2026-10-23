"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { reserveProductAction } from "@/actions/reserve";
import { notifyCartChanged } from "@/lib/reservation/events";

interface QuickReserveButtonProps {
  productId: string;
  slug: string;
  dollName: string;
}

export function QuickReserveButton({
  productId,
  slug,
  dollName,
}: QuickReserveButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleReserve = () => {
    startTransition(async () => {
      try {
        const res = await reserveProductAction({ productId, slug });
        if (res.success) {
          toast.success(`Бронь на «${dollName}» зафиксирована на 15 минут!`);
          notifyCartChanged();
          router.refresh();
        } else {
          toast.error(res.error || "Не удалось забронировать куклу.");
        }
      } catch {
        toast.error("Произошла ошибка при бронировании.");
      }
    });
  };

  return (
    <Button
      size="lg"
      variant="default"
      disabled={isPending}
      onClick={handleReserve}
      className="w-full sm:w-auto rounded-full px-6 shadow-xs"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span>Бронируем...</span>
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4 mr-2" />
          <span>Забронировать на 15 мин</span>
        </>
      )}
    </Button>
  );
}
