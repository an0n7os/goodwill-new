"use client";

import React, { useState, useTransition } from "react";
import type { getCatalogSetup } from "@/lib/adminActions";
import { saveCategory, deleteCategory, saveBrand, deleteBrand } from "@/lib/adminActions";
import { toast } from "@/components/admin/Toaster";
import { Plus, Pencil, Trash2, X, Star, FolderTree, Tag } from "lucide-react";

type Setup = Awaited<ReturnType<typeof getCatalogSetup>>;
type Category = Setup["categories"][number];
type Brand = Setup["brands"][number];

type CategoryForm = { id?: string; name: string; nameML: string; parentId: string; sortOrder: string; isActive: boolean };
type BrandForm = { id?: string; name: string; logo: string; tagline: string; sortOrder: string; isFeatured: boolean };

export default function CatalogClient({ categories, brands }: Setup) {
  const [tab, setTab] = useState<"categories" | "brands">("categories");
  const [isPending, startTransition] = useTransition();
  const [catForm, setCatForm] = useState<CategoryForm | null>(null);
  const [brandForm, setBrandForm] = useState<BrandForm | null>(null);

  const topLevel = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);
  const orphans = categories.filter((c) => c.parentId && !categories.some((p) => p.id === c.parentId));

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, ok: string, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.success) return toast.error(res.error || "Something went wrong.");
      toast.success(ok);
      after?.();
    });

  const submitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm) return;
    run(
      () => saveCategory({ ...catForm, parentId: catForm.parentId || null, sortOrder: Number(catForm.sortOrder) || 0 }),
      catForm.id ? "Category updated." : "Category added.",
      () => setCatForm(null)
    );
  };

  const submitBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm) return;
    run(
      () => saveBrand({ ...brandForm, sortOrder: Number(brandForm.sortOrder) || 0 }),
      brandForm.id ? "Brand updated." : "Brand added.",
      () => setBrandForm(null)
    );
  };

  const editCategory = (c: Category) =>
    setCatForm({ id: c.id, name: c.name, nameML: c.nameML || "", parentId: c.parentId || "", sortOrder: String(c.sortOrder), isActive: c.isActive });
  const editBrand = (b: Brand) =>
    setBrandForm({ id: b.id, name: b.name, logo: b.logo || "", tagline: b.tagline || "", sortOrder: String(b.sortOrder), isFeatured: b.isFeatured });

  const CategoryRow = ({ c, child }: { c: Category; child?: boolean }) => (
    <tr className="hover:bg-slate-50/60">
      <td>
        <div className={`flex items-center gap-2 ${child ? "pl-6" : ""}`}>
          {child && <span className="text-slate-300">└</span>}
          <span className={`font-medium ${c.isActive ? "text-ink" : "text-slate-400 line-through"}`}>{c.name}</span>
          {c.nameML && <span className="text-xs text-slate-400">{c.nameML}</span>}
        </div>
      </td>
      <td className="font-mono text-xs text-slate-400">{c.slug}</td>
      <td className="text-slate-500">{c._count.products}</td>
      <td className="text-slate-500">{c.sortOrder}</td>
      <td>
        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${c.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {c.isActive ? "Visible" : "Hidden"}
        </span>
      </td>
      <td>
        <div className="flex justify-end gap-1">
          <button onClick={() => editCategory(c)} title="Edit" className="p-2 rounded-lg text-slate-400 hover:text-ink hover:bg-paper cursor-pointer">
            <Pencil size={15} />
          </button>
          <button
            onClick={() => window.confirm(`Delete category "${c.name}"?`) && run(() => deleteCategory(c.id), "Category deleted.")}
            disabled={isPending}
            title="Delete"
            className="p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-white border border-ink/[0.07] text-sm font-medium">
          {(
            [
              ["categories", `Categories (${categories.length})`, FolderTree],
              ["brands", `Brands (${brands.length})`, Tag],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`h-9 px-4 rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer ${tab === key ? "bg-ink text-white" : "text-slate-500 hover:text-ink"}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        {tab === "categories" ? (
          <button onClick={() => setCatForm({ name: "", nameML: "", parentId: "", sortOrder: "0", isActive: true })} className="adm-btn">
            <Plus size={15} /> New category
          </button>
        ) : (
          <button onClick={() => setBrandForm({ name: "", logo: "", tagline: "", sortOrder: "0", isFeatured: false })} className="adm-btn">
            <Plus size={15} /> New brand
          </button>
        )}
      </div>

      <div className="adm-card overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "categories" ? (
            <table className="adm-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topLevel.map((c) => (
                  <React.Fragment key={c.id}>
                    <CategoryRow c={c} />
                    {childrenOf(c.id).map((ch) => (
                      <CategoryRow key={ch.id} c={ch} child />
                    ))}
                  </React.Fragment>
                ))}
                {orphans.map((c) => (
                  <CategoryRow key={c.id} c={c} />
                ))}
              </tbody>
            </table>
          ) : (
            <table className="adm-table w-full">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Featured</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg border border-slate-100 bg-white overflow-hidden flex items-center justify-center text-xs font-semibold text-slate-400">
                          {b.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.logo} alt="" className="w-full h-full object-contain" />
                          ) : (
                            b.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-ink">{b.name}</div>
                          {b.tagline && <div className="text-xs text-slate-400">{b.tagline}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-400">{b.slug}</td>
                    <td className="text-slate-500">{b._count.products}</td>
                    <td>{b.isFeatured ? <Star size={15} className="text-gold" fill="currentColor" /> : <span className="text-slate-300">—</span>}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => editBrand(b)} title="Edit" className="p-2 rounded-lg text-slate-400 hover:text-ink hover:bg-paper cursor-pointer">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => window.confirm(`Delete brand "${b.name}"?`) && run(() => deleteBrand(b.id), "Brand deleted.")}
                          disabled={isPending}
                          title="Delete"
                          className="p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {catForm && (
        <Modal title={catForm.id ? "Edit category" : "New category"} onClose={() => setCatForm(null)} onSubmit={submitCategory} pending={isPending}>
          <div className="col-span-2">
            <label className="adm-label">Name</label>
            <input required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="adm-input" />
          </div>
          <div className="col-span-2">
            <label className="adm-label">Malayalam name (optional)</label>
            <input value={catForm.nameML} onChange={(e) => setCatForm({ ...catForm, nameML: e.target.value })} className="adm-input" />
          </div>
          <div>
            <label className="adm-label">Parent</label>
            <select value={catForm.parentId} onChange={(e) => setCatForm({ ...catForm, parentId: e.target.value })} className="adm-input">
              <option value="">— Top level —</option>
              {topLevel
                .filter((c) => c.id !== catForm.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="adm-label">Sort order</label>
            <input type="number" value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: e.target.value })} className="adm-input" />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={catForm.isActive} onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })} />
            Visible on the website
          </label>
        </Modal>
      )}

      {brandForm && (
        <Modal title={brandForm.id ? "Edit brand" : "New brand"} onClose={() => setBrandForm(null)} onSubmit={submitBrand} pending={isPending}>
          <div className="col-span-2">
            <label className="adm-label">Name</label>
            <input required value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} className="adm-input" />
          </div>
          <div className="col-span-2">
            <label className="adm-label">Logo URL (optional)</label>
            <input value={brandForm.logo} onChange={(e) => setBrandForm({ ...brandForm, logo: e.target.value })} placeholder="/brands/philips.png" className="adm-input" />
          </div>
          <div className="col-span-2">
            <label className="adm-label">Tagline (optional)</label>
            <input value={brandForm.tagline} onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })} className="adm-input" />
          </div>
          <div>
            <label className="adm-label">Sort order</label>
            <input type="number" value={brandForm.sortOrder} onChange={(e) => setBrandForm({ ...brandForm, sortOrder: e.target.value })} className="adm-input" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 self-end h-10">
            <input type="checkbox" checked={brandForm.isFeatured} onChange={(e) => setBrandForm({ ...brandForm, isFeatured: e.target.checked })} />
            Featured brand
          </label>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  onSubmit,
  pending,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="adm-card w-full max-w-md p-6 flex flex-col gap-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-full text-slate-400 hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">{children}</div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="adm-btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="adm-btn">
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
