import type { Prisma, Category, Brand } from "@prisma/client";

export type CatalogueProduct = Prisma.ProductGetPayload<{
  include: { brand: true; category: { include: { parent: true } }; images: true; variants: true };
}>;
export type CatalogueCategory = Category & { children?: Category[] };
export type CatalogueBrand = Brand;
export type StoreOrder = Prisma.OrderGetPayload<{ include: { customer: true; items: true } }>;
export type StoreCustomer = Prisma.CustomerGetPayload<{ include: { orders: true } }>;
