"use client";

import React, { useState, useTransition } from "react";
import { updateStockInline, updatePriceInline, createProductAdmin, updateProductAdmin } from "@/lib/actions";
import { Search, Save, X, Edit2, CheckCircle2, ShieldAlert, Loader, Plus, Upload, Download } from "lucide-react";

interface ProductsManagementClientProps {
  products: any[];
  categories: any[];
  brands: any[];
}

export default function ProductsManagementClient({
  products,
  categories,
  brands,
}: ProductsManagementClientProps) {
  const [isPending, startTransition] = useTransition();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");

  // Table Inline Edit States
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState<number>(0);

  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<number>(0);

  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);
  const [successRowId, setSuccessRowId] = useState<string | null>(null);

  // --- Modal Add/Edit Product States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editProductId, setEditProductId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formNameML, setFormNameML] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDescriptionML, setFormDescriptionML] = useState("");
  const [formMrp, setFormMrp] = useState<number>(0);
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formGstRate, setFormGstRate] = useState<number>(18);
  const [formUnit, setFormUnit] = useState("piece");
  const [formStock, setFormStock] = useState<number>(0);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");

  // Client-side Filter
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.brand?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? prod.category?.slug === categoryFilter : true;
    const matchesBrand = brandFilter ? prod.brand?.slug === brandFilter : true;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  // Handle price save inline
  const handleSavePrice = (productId: string, variantId: string | null, newPrice: number) => {
    const uniqueId = variantId ? `${productId}-${variantId}` : productId;
    setLoadingRowId(uniqueId);

    startTransition(async () => {
      const res = await updatePriceInline(productId, variantId, newPrice);
      setLoadingRowId(null);
      if (res.success) {
        setEditingPriceId(null);
        setSuccessRowId(uniqueId);
        setTimeout(() => setSuccessRowId(null), 1500);
      } else {
        alert("Failed to update price.");
      }
    });
  };

  // Handle stock save inline
  const handleSaveStock = (productId: string, variantId: string | null, newStock: number) => {
    const uniqueId = variantId ? `${productId}-${variantId}` : productId;
    setLoadingRowId(uniqueId);

    startTransition(async () => {
      const res = await updateStockInline(productId, variantId, newStock);
      setLoadingRowId(null);
      if (res.success) {
        setEditingStockId(null);
        setSuccessRowId(uniqueId);
        setTimeout(() => setSuccessRowId(null), 1500);
      } else {
        alert("Failed to update stock.");
      }
    });
  };

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditProductId(null);
    setFormName("");
    setFormNameML("");
    setFormSlug("");
    setFormSku("");
    setFormDescription("");
    setFormDescriptionML("");
    setFormMrp(0);
    setFormPrice(0);
    setFormCostPrice(0);
    setFormGstRate(18);
    setFormUnit("piece");
    setFormStock(0);
    setFormCategoryId(categories[0]?.id || "");
    setFormBrandId(brands[0]?.id || "");
    setFormImageUrl("");
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (prod: any) => {
    setModalMode("edit");
    setEditProductId(prod.id);
    setFormName(prod.name);
    setFormNameML(prod.nameML || "");
    setFormSlug(prod.slug);
    setFormSku(prod.sku);
    setFormDescription(prod.description || "");
    setFormDescriptionML(prod.descriptionML || "");
    setFormMrp(prod.mrp);
    setFormPrice(prod.price);
    setFormCostPrice(prod.costPrice || 0);
    setFormGstRate(prod.gstRate);
    setFormUnit(prod.unit);
    setFormStock(prod.stock);
    setFormCategoryId(prod.categoryId);
    setFormBrandId(prod.brandId || "");
    setFormImageUrl(prod.images?.[0]?.url || "");
    setIsModalOpen(true);
  };

  // Handle Modal Form Submit
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRowId("modal");

    const payload = {
      name: formName,
      nameML: formNameML,
      slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      sku: formSku,
      description: formDescription,
      descriptionML: formDescriptionML,
      mrp: Number(formMrp),
      price: Number(formPrice),
      costPrice: Number(formCostPrice),
      gstRate: Number(formGstRate),
      unit: formUnit,
      stock: Number(formStock),
      categoryId: formCategoryId,
      brandId: formBrandId || undefined,
      imageUrl: formImageUrl,
    };

    startTransition(async () => {
      let res;
      if (modalMode === "add") {
        res = await createProductAdmin(payload);
      } else {
        res = await updateProductAdmin(editProductId!, payload);
      }
      setLoadingRowId(null);
      if (res.success) {
        setIsModalOpen(false);
        alert(modalMode === "add" ? "Product added successfully!" : "Product updated successfully!");
      } else {
        alert(res.error || "Failed to save product.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search, Filters & Add Product Action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, SKU, brand..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 bg-slate-50 text-sm"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-ink hover:bg-gold text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </button>

          <label className="bg-ink hover:bg-ink-2 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 flex-shrink-0 cursor-pointer">
            <Upload size={14} />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
                  if (lines.length < 2) {
                    alert("CSV file must have a header row and at least 1 product row.");
                    return;
                  }
                  const rows = [];
                  for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].split(",");
                    if (parts.length >= 3) {
                      rows.push({
                        name: parts[0]?.trim(),
                        sku: parts[1]?.trim(),
                        price: parseFloat(parts[2]),
                        mrp: parseFloat(parts[3] || parts[2]),
                        stock: parseInt(parts[4] || "10"),
                        categoryName: parts[5]?.trim() || "Electrical",
                        brandName: parts[6]?.trim() || "General",
                        imageUrl: parts[7]?.trim() || "",
                      });
                    }
                  }
                  const { bulkImportProducts } = await import("@/lib/actions");
                  const res = await bulkImportProducts(rows);
                  if (res.success) {
                    alert(`Import finished! ${res.createdCount} products imported successfully.`);
                  } else {
                    alert(res.error || "Failed to import CSV.");
                  }
                } catch (err: any) {
                  alert("Error reading CSV file: " + err.message);
                }
              }}
            />
          </label>

          <button
            onClick={() => {
              if (products.length === 0) {
                alert("No products available to export.");
                return;
              }
              const header = "Name,SKU,Price,MRP,Stock,Category,Brand\n";
              const rows = products
                .map(
                  (p) =>
                    `"${p.name}","${p.sku}",${p.price},${p.mrp},${p.stock},"${p.category?.name || ""}","${
                      p.brand?.name || ""
                    }"`
                )
                .join("\n");
              const blob = new Blob([header + rows], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `Goodwill_Inventory_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Categories select */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Brands select */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Brands</option>
            {brands.map((br) => (
              <option key={br.id} value={br.slug}>
                {br.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Product Details</th>
                <th className="py-4 px-4">Brand</th>
                <th className="py-4 px-4">SKU</th>
                <th className="py-4 px-4">Selling Price</th>
                <th className="py-4 px-4">Stock Qty</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod) => {
                  const uniqueId = prod.id;
                  const isLoading = loadingRowId === uniqueId;
                  const isSuccess = successRowId === uniqueId;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & Category */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{prod.name}</span>
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            {prod.category?.name}
                          </span>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-4 px-4 text-slate-600">
                        {prod.brand?.name || "-"}
                      </td>

                      {/* SKU */}
                      <td className="py-4 px-4 font-mono text-slate-500 uppercase">
                        {prod.sku}
                      </td>

                      {/* Price (Editable) */}
                      <td className="py-4 px-4">
                        {editingPriceId === prod.id ? (
                          <div className="flex items-center gap-1.5 max-w-[120px]">
                            <span className="text-slate-400">₹</span>
                            <input
                              type="number"
                              value={editingPriceVal}
                              onChange={(e) => setEditingPriceVal(Number(e.target.value))}
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded focus:outline-none text-xs font-bold"
                            />
                            <button
                              onClick={() => handleSavePrice(prod.id, null, editingPriceVal)}
                              disabled={isPending}
                              className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="text-red-500 hover:text-red-600 cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingPriceId(prod.id);
                              setEditingPriceVal(prod.price);
                            }}
                            className="flex items-center gap-1.5 hover:text-ink border border-transparent hover:border-slate-200 hover:bg-white px-2 py-1 rounded transition-all group cursor-pointer"
                          >
                            <span>₹{prod.price}</span>
                            <Edit2 size={12} className="text-slate-300 group-hover:text-gold transition-colors" />
                          </button>
                        )}
                      </td>

                      {/* Stock (Editable) */}
                      <td className="py-4 px-4">
                        {editingStockId === prod.id ? (
                          <div className="flex items-center gap-1.5 max-w-[120px]">
                            <input
                              type="number"
                              value={editingStockVal}
                              onChange={(e) => setEditingStockVal(Number(e.target.value))}
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded focus:outline-none text-xs font-bold"
                            />
                            <button
                              onClick={() => handleSaveStock(prod.id, null, editingStockVal)}
                              disabled={isPending}
                              className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="text-red-500 hover:text-red-600 cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingStockId(prod.id);
                              setEditingStockVal(prod.stock);
                            }}
                            className="flex items-center gap-1.5 hover:text-ink border border-transparent hover:border-slate-200 hover:bg-white px-2 py-1 rounded transition-all group cursor-pointer"
                          >
                            <span className={prod.stock <= prod.lowStockAlert ? "text-red-600 font-bold" : ""}>
                              {prod.stock} {prod.unit}s
                            </span>
                            <Edit2 size={12} className="text-slate-300 group-hover:text-gold transition-colors" />
                          </button>
                        )}
                      </td>

                      {/* Status / Feedbacks */}
                      <td className="py-4 px-4">
                        {isLoading ? (
                          <div className="flex items-center gap-1 text-gold-dark font-bold">
                            <Loader size={12} className="animate-spin" />
                            <span>Saving</span>
                          </div>
                        ) : isSuccess ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-bold animate-fade-in">
                            <CheckCircle2 size={12} />
                            <span>Saved</span>
                          </div>
                        ) : prod.stock <= prod.lowStockAlert ? (
                          <div className="flex items-center gap-1 text-red-600 font-bold">
                            <ShieldAlert size={12} />
                            <span>Low Stock</span>
                          </div>
                        ) : (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold uppercase text-[11px] tracking-wider">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-gold/40 hover:bg-paper hover:text-ink font-semibold text-sm transition-all cursor-pointer"
                        >
                          Edit Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 px-6 text-center text-slate-400 font-semibold">
                    No products matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-fade-in relative flex flex-col gap-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-ink tracking-tight">
                {modalMode === "add" ? "Add New Product" : "Edit Product Details"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full border border-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="flex flex-col gap-4 text-xs font-bold text-slate-700">
              {/* Product Name */}
              <div className="flex flex-col gap-1.5">
                <label>Product Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Legrand Arteor Switch"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 text-xs font-semibold"
                />
              </div>

              {/* Slug & SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label>URL Slug (Optional)</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. legrand-arteor-switch"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>SKU (Stock Keeping Unit) *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. LEG-ART-SW"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 text-xs font-semibold uppercase"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide details about specs, build, and features..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 text-xs font-semibold"
                ></textarea>
              </div>

              {/* Pricing details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label>MRP (INR) *</label>
                  <input
                    type="number"
                    required
                    value={formMrp}
                    onChange={(e) => setFormMrp(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Selling Price *</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Cost Price (INR)</label>
                  <input
                    type="number"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>GST Rate (%)</label>
                  <input
                    type="number"
                    value={formGstRate}
                    onChange={(e) => setFormGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Stock, Unit & Category linkings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label>Stock Qty *</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Stock Unit *</label>
                  <input
                    type="text"
                    required
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="e.g. piece / roll / bundle"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Category *</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none text-xs font-semibold cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Brand</label>
                  <select
                    value={formBrandId}
                    onChange={(e) => setFormBrandId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none text-xs font-semibold cursor-pointer"
                  >
                    <option value="">None</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Image URL */}
              <div className="flex flex-col gap-1.5">
                <label>Product Image URL</label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 text-xs font-semibold"
                />
              </div>

              {/* Modal footer submit */}
              <div className="flex gap-4 mt-4 border-t border-slate-100 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 uppercase tracking-wider font-bold transition-all text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-ink hover:bg-gold text-white font-bold text-[11px] uppercase tracking-wider px-6 py-2.5 rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isPending ? (
                    <Loader size={12} className="animate-spin" />
                  ) : (
                    <span>Save Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
