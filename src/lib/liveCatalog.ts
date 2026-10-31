import { db } from './db';
import type { Prisma } from '@/generated/prisma';
import { cache } from 'react';

export type CatalogFilters = { search?: string; category?: string; brand?: string; minPrice?: number; maxPrice?: number; inStock?: boolean; sort?: string; limit?: number };
const include = { brand: true, category: { include: { parent: true } }, images: { orderBy: { sortOrder: 'asc' } }, variants: true } satisfies Prisma.ProductInclude;

export async function readProducts(filters: CatalogFilters = {}) {
  const products = [];
  const where: Prisma.ProductWhereInput = { isActive: true };
  if(filters.category) where.category = { OR: [{slug:filters.category},{parent:{slug:filters.category}}] };
  if(filters.brand) where.brand = {slug:filters.brand};
  if(filters.minPrice !== undefined || filters.maxPrice !== undefined) where.price = {gte:filters.minPrice,lte:filters.maxPrice};
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = filters.sort === 'price-low' ? [{price:'asc'}] : filters.sort === 'price-high' ? [{price:'desc'}] : filters.sort === 'popular' ? [{soldCount:'desc'}] : filters.sort === 'name-az' ? [{name:'asc'}] : [{createdAt:'desc'}];
  // Bound relation-query parameters on SQLite, including large catalogues.
  for (let skip = 0; ; skip += 200) {
    const batch = await db.product.findMany({ where, include: {...include, images:{orderBy:{sortOrder:'asc'},take:1}}, skip, take: 200, orderBy: [...orderBy,{id:'asc'}] });
    products.push(...batch);
    if(filters.limit && !filters.search && !filters.inStock && products.length >= filters.limit) break;
    if (batch.length < 200) break;
  }
  let result = products;
  if (filters.category) result = result.filter(p => p.category.slug === filters.category || p.category.parent?.slug === filters.category);
  if (filters.brand) result = result.filter(p => p.brand?.slug === filters.brand);
  if (filters.search?.trim()) {
    const query = filters.search.trim().toLowerCase();
    result = result.filter(p => [p.name, p.nameML, p.sku, p.description, p.brand?.name].some(value => value?.toLowerCase().includes(query)));
  }
  if (filters.minPrice !== undefined) result = result.filter(p => p.price >= filters.minPrice!);
  if (filters.maxPrice !== undefined) result = result.filter(p => p.price <= filters.maxPrice!);
  if (filters.inStock) result = result.filter(p => p.variants.length ? p.variants.some(v => v.stock > 0) : p.stock > 0);
  if (filters.sort === 'price-low') result.sort((a,b) => a.price-b.price);
  if (filters.sort === 'price-high') result.sort((a,b) => b.price-a.price);
  if (filters.sort === 'popular') result.sort((a,b) => b.soldCount-a.soldCount);
  if (filters.sort === 'name-az') result.sort((a,b) => a.name.localeCompare(b.name));
  if(filters.limit) result=result.slice(0,filters.limit);
  return result.map(p => ({
    specs:p.specs, id:p.id, slug:p.slug, name:p.name, nameML:p.nameML, sku:p.sku, unit:p.unit,
    price:p.price, mrp:p.mrp, stock:p.variants.length?p.variants.reduce((s,v)=>s+v.stock,0):p.stock, trackStock:p.trackStock, gstRate:p.gstRate,
    isActive:p.isActive, isFeatured:p.isFeatured, soldCount:p.soldCount,
    brand:p.brand ? {name:p.brand.name,slug:p.brand.slug} : null,
    category:{name:p.category.name,slug:p.category.slug,parent:p.category.parent ? {slug:p.category.parent.slug}:null},
    images:p.images.map(image=>({url:image.url})),
    variants:p.variants.map(v=>({id:v.id,name:v.name,sku:v.sku,price:v.price,stock:v.stock})),
  }));
}

export const readProduct = cache(async (idOrSlug: string) => {
  const product = await db.product.findFirst({ where: { isActive: true, OR: [{ id: idOrSlug }, { slug: idOrSlug }] }, include });
  if (!product) return null;
  const {costPrice, ...publicProduct} = product; void costPrice;
  return publicProduct;
});

export const readCategories = cache(async () => {
  return db.category.findMany({ where: { isActive: true }, include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } });
});
export const readBrands = cache(async () => db.brand.findMany({ orderBy: {name:'asc'} }));
export const readBanners = cache(async () => db.banner.findMany({where:{isActive:true},orderBy:{sortOrder:'asc'}}));
