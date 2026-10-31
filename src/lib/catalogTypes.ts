import type { Prisma, Category, Brand } from "@/generated/prisma";
export type CatalogueListProduct = Awaited<ReturnType<typeof import('./liveCatalog').readProducts>>[number];

export type CatalogueProduct = Omit<Prisma.ProductGetPayload<{
  include: { brand: true; category: { include: { parent: true } }; images: true; variants: true };
}>, 'costPrice'>;
export type CatalogueCategory = Category & { children?: Category[] };
export type CatalogueBrand = Brand;
export type StoreOrder = Prisma.OrderGetPayload<{ include: { customer: true; items: true } }>;
export type StoreCustomer = Prisma.CustomerGetPayload<{ include: { orders: true } }>;
