import Link from "next/link";
import { Sparkles, ArrowRight, Home, Compass } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 bg-alabaster">
      <Container className="max-w-xl text-center space-y-8">
        {/* Visual Badge */}
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-terracotta-subtle text-terracotta mx-auto shadow-xs">
          <Sparkles className="h-10 w-10 animate-pulse" />
        </div>

        <div className="space-y-3">
          <span className="text-xs uppercase tracking-widest text-muted font-semibold">
            Ошибка 404
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-espresso leading-tight">
            Страница упорхнула в сказочный лес
          </h1>
          <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
            Возможно, эта кукла уже обрела свой дом в частной коллекции, либо адрес
            был введен с ошибкой. Не переживайте — в мастерской еще много чудесных работ!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild size="lg" className="rounded-full shadow-sm w-full sm:w-auto px-7">
            <Link href="/kukly">
              <Compass className="h-4 w-4 mr-2" />
              Куклы в наличии
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="rounded-full w-full sm:w-auto">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              На главную
            </Link>
          </Button>
        </div>

        {/* Custom Order hint */}
        <p className="text-xs text-muted">
          Ищете конкретный образ? Вы можете{" "}
          <Link
            href="/na-zakaz"
            className="text-terracotta underline hover:text-terracotta-hover font-medium"
          >
            заказать куклу у мастера индивидуально
          </Link>
          .
        </p>
      </Container>
    </div>
  );
}
