import { describe, it, expect } from "vitest";
import { createOrderSchema, orderCustomerSchema } from "../order";

describe("order schemas & validation", () => {
  it("validates and normalizes customer phone number", () => {
    const validData = {
      name: "Анна Ковалева",
      phone: "8 (029) 123-45-67",
      email: "anna@example.com",
    };

    const parsed = orderCustomerSchema.parse(validData);
    expect(parsed.phone).toBe("+375291234567");
    expect(parsed.name).toBe("Анна Ковалева");
  });

  it("fails customer validation if phone is not Belarusian", () => {
    const invalidData = {
      name: "Иван Иванов",
      phone: "+7 (999) 000-00-00",
    };

    expect(() => orderCustomerSchema.parse(invalidData)).toThrow();
  });

  it("validates full order input for postal dispatch", () => {
    const orderInput = {
      dollId: "doll-001",
      customer: {
        name: "Елена Смирнова",
        phone: "+375 44 765 43 21",
      },
      receiving: {
        method: "postal",
        city: "Гомель",
        postalAddress: "Отделение связи № 45, 246045",
        costByn: 5,
      },
      termsAccepted: true,
    };

    const parsed = createOrderSchema.parse(orderInput);
    expect(parsed.customer.phone).toBe("+375447654321");
    expect(parsed.receiving.method).toBe("postal");
    expect(parsed.receiving.city).toBe("Гомель");
  });

  it("validates full order input for self-pickup in Minsk", () => {
    const orderInput = {
      dollId: "doll-001",
      customer: {
        name: "Александра Минская",
        phone: "+375 29 111 22 33",
      },
      receiving: {
        method: "pickup",
        costByn: 0,
      },
      termsAccepted: true,
    };

    const parsed = createOrderSchema.parse(orderInput);
    expect(parsed.customer.phone).toBe("+375291112233");
    expect(parsed.receiving.method).toBe("pickup");
    expect(parsed.receiving.costByn).toBe(0);
  });

  it("fails order validation if postal address is missing for postal method", () => {
    const orderInput = {
      dollId: "doll-001",
      customer: {
        name: "Елена Смирнова",
        phone: "+375 44 765 43 21",
      },
      receiving: {
        method: "postal",
        city: "Гомель",
        costByn: 5,
      },
      termsAccepted: true,
    };

    expect(() => createOrderSchema.parse(orderInput)).toThrow();
  });

  it("fails order validation if terms are not accepted", () => {
    const orderInput = {
      dollId: "doll-001",
      customer: {
        name: "Елена Смирнова",
        phone: "+375 44 765 43 21",
      },
      receiving: {
        method: "pickup",
        costByn: 0,
      },
      termsAccepted: false,
    };

    expect(() => createOrderSchema.parse(orderInput)).toThrow();
  });
});
