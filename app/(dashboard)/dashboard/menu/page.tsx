"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Modifier } from "@dnd-kit/core";
import {
  GripVertical,
  MoreHorizontal,
  Plus,
  Search,
  ImageIcon,
  Clock,
  Copy,
  Trash2,
  Edit,
  Loader2,
  UtensilsCrossed,
  CheckSquare,
} from "lucide-react";

import { mockMenus, mockCategories, mockItems } from "@/mock/menu";
import type { Menu, Category, Item, ItemTag } from "@/types";
import { cn, formatPrice, generateId } from "@/lib/utils";
import { useT } from "@/lib/i18n";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { MenuItemSheet } from "@/components/dashboard/menu-item-sheet";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_LIMIT = 30;

// ─── Tag config ───────────────────────────────────────────────────────────────

const TAG_CONFIG: Record<ItemTag, { label: string; className: string }> = {
  spicy:      { label: "Spicy",       className: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400" },
  new:        { label: "New",         className: "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400" },
  popular:    { label: "Popular",     className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  vegan:      { label: "Vegan",       className: "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400" },
  halal:      { label: "Halal",       className: "bg-teal-100   text-teal-700   dark:bg-teal-900/30   dark:text-teal-400" },
  bestseller: { label: "Bestseller",  className: "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400" },
  chefs_pick: { label: "Chef's Pick", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

// ─── Restrict to vertical axis ────────────────────────────────────────────────

const restrictToVerticalAxis: Modifier = ({ transform }) => {
  return { ...transform, x: 0 };
};

// ─── Sortable row ─────────────────────────────────────────────────────────────

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };

  const dragHandle = (
    <button
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </div>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            {t.dashCancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => { onConfirm(); onOpenChange(false); }}
          >
            {t.dashDelete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Menu Dialog ──────────────────────────────────────────────────────────────

interface MenuDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  menu: Menu | null;
  onSave: (menu: Menu) => void;
}

function MenuDialog({ open, onOpenChange, menu, onSave }: MenuDialogProps) {
  const t = useT();
  const [name, setName]           = useState(menu?.name ?? "");
  const [description, setDesc]    = useState(menu?.description ?? "");
  const [availFrom, setAvailFrom] = useState(menu?.available_from ?? "");
  const [availTo, setAvailTo]     = useState(menu?.available_to ?? "");
  const [isActive, setIsActive]   = useState(menu?.is_active ?? true);
  const [saving, setSaving]       = useState(false);

  function handleOpenChange(v: boolean) {
    if (v) {
      setName(menu?.name ?? "");
      setDesc(menu?.description ?? "");
      setAvailFrom(menu?.available_from ?? "");
      setAvailTo(menu?.available_to ?? "");
      setIsActive(menu?.is_active ?? true);
      setSaving(false);
    }
    onOpenChange(v);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    const saved: Menu = {
      id:             menu?.id ?? generateId(),
      tenant_id:      menu?.tenant_id ?? "t1",
      name:           name.trim(),
      description:    description.trim() || undefined,
      is_active:      isActive,
      available_from: availFrom || undefined,
      available_to:   availTo || undefined,
      sort_order:     menu?.sort_order ?? 999,
    };
    setSaving(false);
    onSave(saved);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{menu ? t.mnu_editMenu : t.mnu_addMenu}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="menu-name">
              {t.name} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="menu-name"
              placeholder="e.g. All Day Menu"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="menu-description">{t.notes}</Label>
            <Input
              id="menu-description"
              placeholder={t.mnu_optionalDesc}
              value={description}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="menu-from">{t.mnu_availableFrom}</Label>
              <Input
                id="menu-from"
                type="time"
                value={availFrom}
                onChange={(e) => setAvailFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="menu-to">{t.mnu_availableTo}</Label>
              <Input
                id="menu-to"
                type="time"
                value={availTo}
                onChange={(e) => setAvailTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="menu-active" className="cursor-pointer">{t.mnu_active}</Label>
            <Switch id="menu-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            {t.dashCancel}
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {menu ? t.dashUpdate : t.mnu_addMenu}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Category Dialog ──────────────────────────────────────────────────────────

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: Category | null;
  menuId: string;
  onSave: (cat: Category) => void;
}

function CategoryDialog({ open, onOpenChange, category, menuId, onSave }: CategoryDialogProps) {
  const t = useT();
  const [name, setName]         = useState(category?.name ?? "");
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [saving, setSaving]     = useState(false);

  function handleOpenChange(v: boolean) {
    if (v) {
      setName(category?.name ?? "");
      setIsActive(category?.is_active ?? true);
      setSaving(false);
    }
    onOpenChange(v);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const saved: Category = {
      id:         category?.id ?? generateId(),
      tenant_id:  category?.tenant_id ?? "t1",
      menu_id:    menuId,
      name:       name.trim(),
      is_active:  isActive,
      sort_order: category?.sort_order ?? 999,
    };
    setSaving(false);
    onSave(saved);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{category ? t.mnu_editCategory : t.mnu_addCategory}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">
              {t.name} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cat-name"
              placeholder="e.g. Burgers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="cat-active" className="cursor-pointer">{t.mnu_active}</Label>
            <Switch id="cat-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            {t.dashCancel}
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {category ? t.dashUpdate : t.mnu_addCategory}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Format time helper ────────────────────────────────────────────────────────

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return mStr === "00" ? `${display} ${suffix}` : `${display}:${mStr} ${suffix}`;
}

// ─── Menus Panel ─────────────────────────────────────────────────────────────

interface MenusPanelProps {
  menus: Menu[];
  selectedMenuId: string | null;
  onSelectMenu: (id: string) => void;
  onMenusChange: (menus: Menu[]) => void;
}

function MenusPanel({ menus, selectedMenuId, onSelectMenu, onMenusChange }: MenusPanelProps) {
  const t = useT();
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editingMenu, setEditingMenu]   = useState<Menu | null>(null);
  const [deleteState, setDeleteState]   = useState<{ open: boolean; menu: Menu | null }>({ open: false, menu: null });

  function handleSave(saved: Menu) {
    const exists = menus.some((m) => m.id === saved.id);
    if (exists) {
      onMenusChange(menus.map((m) => (m.id === saved.id ? saved : m)));
      toast.success(t.mnu_menuUpdated);
    } else {
      onMenusChange([...menus, saved]);
      toast.success(t.mnu_menuAdded);
    }
  }

  function handleToggleActive(menu: Menu) {
    onMenusChange(menus.map((m) => m.id === menu.id ? { ...m, is_active: !m.is_active } : m));
  }

  function handleDuplicate(menu: Menu) {
    const dup: Menu = { ...menu, id: generateId(), name: `${menu.name} (copy)`, sort_order: menus.length + 1 };
    onMenusChange([...menus, dup]);
    toast.success(t.mnu_menuDuplicated);
  }

  function handleDelete(menu: Menu) {
    onMenusChange(menus.filter((m) => m.id !== menu.id));
    toast.success(t.mnu_menuDeleted);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.mnu_menusSection}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {menus.map((menu) => {
          const avail =
            menu.available_from && menu.available_to
              ? `${formatTime(menu.available_from)} – ${formatTime(menu.available_to)}`
              : null;
          const isSelected = menu.id === selectedMenuId;

          return (
            <div
              key={menu.id}
              className={cn(
                "group flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-border/50 hover:bg-muted/50 transition-colors",
                isSelected && "bg-muted"
              )}
              onClick={() => onSelectMenu(menu.id)}
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
                  menu.is_active ? "bg-green-500" : "bg-muted-foreground/30"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", isSelected && "text-foreground")}>
                  {menu.name}
                </p>
                {avail && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                    {avail}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 h-6 w-6"
                    />
                  }
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <span className="sr-only">Menu actions</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setEditingMenu(menu);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      {t.dashEdit}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleToggleActive(menu);
                      }}
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      {menu.is_active ? t.mnu_deactivate : t.mnu_activate}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDuplicate(menu);
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {t.mnu_duplicate}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setDeleteState({ open: true, menu });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t.dashDelete}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => { setEditingMenu(null); setDialogOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5" />
          {t.mnu_addMenu}
        </Button>
      </div>

      <MenuDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        menu={editingMenu}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={deleteState.open}
        onOpenChange={(v) => setDeleteState((s) => ({ ...s, open: v }))}
        title={t.mnu_deleteMenu}
        description={`${t.mnu_cannotUndo}`}
        onConfirm={() => deleteState.menu && handleDelete(deleteState.menu)}
      />
    </div>
  );
}

// ─── Categories Panel ─────────────────────────────────────────────────────────

interface CategoriesPanelProps {
  categories: Category[];
  selectedMenuId: string | null;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onCategoriesChange: (cats: Category[]) => void;
  itemCounts: Record<string, number>;
}

function CategoriesPanel({
  categories,
  selectedMenuId,
  selectedCategoryId,
  onSelectCategory,
  onCategoriesChange,
  itemCounts,
}: CategoriesPanelProps) {
  const t = useT();
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editingCat, setEditingCat]   = useState<Category | null>(null);
  const [deleteState, setDeleteState] = useState<{ open: boolean; cat: Category | null }>({ open: false, cat: null });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      onCategoriesChange(arrayMove(categories, oldIndex, newIndex));
    }
  }

  function handleSave(saved: Category) {
    const exists = categories.some((c) => c.id === saved.id);
    if (exists) {
      onCategoriesChange(categories.map((c) => (c.id === saved.id ? saved : c)));
      toast.success(t.mnu_categoryUpdated);
    } else {
      onCategoriesChange([...categories, saved]);
      toast.success(t.mnu_categoryAdded);
    }
  }

  function handleToggleActive(cat: Category) {
    onCategoriesChange(categories.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
  }

  function handleDelete(cat: Category) {
    onCategoriesChange(categories.filter((c) => c.id !== cat.id));
    if (selectedCategoryId === cat.id) onSelectCategory(null);
    toast.success(t.mnu_categoryDeleted);
  }

  if (!selectedMenuId) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center gap-2">
        <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{t.mnu_selectMenuFirst}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.mnu_categoriesSection}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {categories.map((cat) => {
              const count = itemCounts[cat.id] ?? 0;
              const isSelected = cat.id === selectedCategoryId;

              return (
                <SortableRow key={cat.id} id={cat.id}>
                  {(dragHandle) => (
                    <div
                      className={cn(
                        "group flex items-center gap-1.5 px-2 py-2 border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors",
                        isSelected && "bg-muted"
                      )}
                      onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                    >
                      {dragHandle}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-sm truncate", isSelected && "font-medium")}>
                            {cat.name}
                          </span>
                          <Badge variant="secondary" className="h-4 px-1.5 text-[10px] flex-shrink-0">
                            {count}
                          </Badge>
                        </div>
                      </div>

                      <Switch
                        size="sm"
                        checked={cat.is_active}
                        onCheckedChange={() => handleToggleActive(cat)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="opacity-0 group-hover:opacity-100 flex-shrink-0 h-6 w-6"
                            />
                          }
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                          <span className="sr-only">Category actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setEditingCat(cat);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              {t.dashEdit}
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setDeleteState({ open: true, cat });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {t.dashDelete}
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </SortableRow>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      <div className="p-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => { setEditingCat(null); setDialogOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5" />
          {t.mnu_addCategory}
        </Button>
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCat}
        menuId={selectedMenuId}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={deleteState.open}
        onOpenChange={(v) => setDeleteState((s) => ({ ...s, open: v }))}
        title={t.mnu_deleteCategory}
        description={t.mnu_cannotUndo}
        onConfirm={() => deleteState.cat && handleDelete(deleteState.cat)}
      />
    </div>
  );
}

// ─── Items Panel ──────────────────────────────────────────────────────────────

interface ItemsPanelProps {
  items: Item[];
  categories: Category[];
  selectedCategoryId: string | null;
  onItemsChange: (items: Item[]) => void;
  totalItemCount: number;
}

function ItemsPanel({
  items,
  categories,
  selectedCategoryId,
  onItemsChange,
  totalItemCount,
}: ItemsPanelProps) {
  const t = useT();
  const [search, setSearch]             = useState("");
  const [categoryFilter, setCatFilter]  = useState<string>("all");
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen]       = useState(false);
  const [editingItem, setEditingItem]   = useState<Item | null>(null);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [deleteState, setDeleteState]   = useState<{ open: boolean; item: Item | null }>({ open: false, item: null });

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const catMatch = categoryFilter === "all" || item.category_id === categoryFilter;
      const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [items, categoryFilter, search]);

  const catById = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [categories]);

  const usagePct = Math.min(100, Math.round((totalItemCount / ITEM_LIMIT) * 100));
  const atLimit  = totalItemCount >= ITEM_LIMIT;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === visibleItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleItems.map((i) => i.id)));
    }
  }

  function handleToggleAvailability(item: Item) {
    onItemsChange(items.map((i) => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    toast.success(item.is_available ? t.mnu_markUnavailable : t.mnu_markAvailable);
  }

  function handleDuplicate(item: Item) {
    const dup: Item = { ...item, id: generateId(), name: `${item.name} (copy)`, sort_order: items.length + 1 };
    onItemsChange([...items, dup]);
    toast.success(t.mnu_itemDuplicated);
  }

  function handleDelete(item: Item) {
    onItemsChange(items.filter((i) => i.id !== item.id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
    toast.success(t.mnu_itemDeleted);
  }

  function handleSave(saved: Item) {
    const exists = items.some((i) => i.id === saved.id);
    if (exists) {
      onItemsChange(items.map((i) => (i.id === saved.id ? saved : i)));
    } else {
      onItemsChange([...items, saved]);
    }
  }

  function bulkToggleAvailability(makeAvailable: boolean) {
    onItemsChange(items.map((i) => selectedIds.has(i.id) ? { ...i, is_available: makeAvailable } : i));
    toast.success(`${selectedIds.size} ${makeAvailable ? t.mnu_markAvailable : t.mnu_markUnavailable}`);
    setSelectedIds(new Set());
  }

  function bulkDelete() {
    onItemsChange(items.filter((i) => !selectedIds.has(i.id)));
    toast.success(`${selectedIds.size} ${t.mnu_itemDeleted}`);
    setSelectedIds(new Set());
  }

  function bulkMoveToCategory(catId: string) {
    onItemsChange(items.map((i) => selectedIds.has(i.id) ? { ...i, category_id: catId } : i));
    toast.success(`${selectedIds.size} ${t.mnu_moveToCategory}`);
    setSelectedIds(new Set());
    setBulkMoveOpen(false);
  }

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Plan usage bar */}
      <div className="px-4 pt-3 pb-2 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            {totalItemCount} / {ITEM_LIMIT} {t.mnu_itemsUsed}
          </span>
          {atLimit && (
            <span className="text-xs font-medium text-destructive">
              {t.mnu_upgradePlan}
            </span>
          )}
        </div>
        <Progress value={usagePct} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t.mnu_searchItems}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={(v) => setCatFilter(v as string)}
        >
          <SelectTrigger size="sm" className="min-w-[130px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.mnu_allCategories}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          disabled={atLimit}
          onClick={() => { setEditingItem(null); setSheetOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5" />
          {t.mnu_addItem}
        </Button>
      </div>

      {/* Bulk actions toolbar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-border flex-wrap"
          >
            <span className="text-sm font-medium">{selectedIds.size} {t.mnu_selected}</span>
            <Separator orientation="vertical" className="h-4" />
            <Button size="xs" variant="outline" onClick={() => bulkToggleAvailability(true)}>{t.mnu_markAvailable}</Button>
            <Button size="xs" variant="outline" onClick={() => bulkToggleAvailability(false)}>{t.mnu_markUnavailable}</Button>

            <DropdownMenu open={bulkMoveOpen} onOpenChange={setBulkMoveOpen}>
              <DropdownMenuTrigger render={<Button size="xs" variant="outline" />}>
                {t.mnu_moveToCategory}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {categories.map((cat) => (
                    <DropdownMenuItem key={cat.id} onClick={() => bulkMoveToCategory(cat.id)}>
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="xs" variant="destructive" onClick={bulkDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              {t.dashDelete}
            </Button>
            <Button size="xs" variant="ghost" className="ml-auto" onClick={() => setSelectedIds(new Set())}>
              {t.mnu_clear}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center px-4">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <UtensilsCrossed className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-medium">{t.mnu_noItemsFound}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? t.mnu_tryDifferentSearch : t.mnu_addFirstItemHint}
              </p>
            </div>
            {!search && (
              <Button size="sm" variant="outline" disabled={atLimit} onClick={() => { setEditingItem(null); setSheetOpen(true); }}>
                <Plus className="h-3.5 w-3.5" />
                {t.mnu_addFirstItemBtn}
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Column header */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30 text-xs text-muted-foreground sticky top-0 z-10">
              <Checkbox
                checked={selectedIds.size > 0 && selectedIds.size === visibleItems.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="flex-1">{t.mnu_colItem}</span>
              <span className="w-24 text-right hidden sm:block">{t.mnu_colCategory}</span>
              <span className="w-16 text-right">{t.mnu_colPrice}</span>
              <span className="w-12 text-center">{t.mnu_colAvail}</span>
              <span className="w-8" />
            </div>

            {visibleItems.map((item) => {
              const thumb   = item.image_urls[0] ?? null;
              const catName = catById[item.category_id] ?? "—";

              return (
                <div
                  key={item.id}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-2.5 border-b border-border/50 hover:bg-muted/30 transition-colors",
                    selectedIds.has(item.id) && "bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                  />

                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-md object-cover flex-shrink-0 border border-border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex-shrink-0 flex items-center justify-center border border-border">
                      <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium truncate">{item.name}</span>
                      {item.tags.slice(0, 3).map((tag) => {
                        const cfg = TAG_CONFIG[tag];
                        if (!cfg) return null;
                        return (
                          <span
                            key={tag}
                            className={cn(
                              "inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium",
                              cfg.className
                            )}
                          >
                            {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>
                    )}
                  </div>

                  <span className="w-24 text-xs text-muted-foreground truncate text-right hidden sm:block">
                    {catName}
                  </span>

                  <span className="w-16 text-sm font-medium text-right flex-shrink-0">
                    {formatPrice(item.price)}
                  </span>

                  <div className="w-12 flex justify-center flex-shrink-0">
                    <Switch
                      size="sm"
                      checked={item.is_available}
                      onCheckedChange={() => handleToggleAvailability(item)}
                    />
                  </div>

                  <div className="w-8 flex justify-center flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 group-hover:opacity-100"
                          />
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Item actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="left" align="start">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => { setEditingItem(item); setSheetOpen(true); }}>
                            <Edit className="h-3.5 w-3.5" />
                            {t.dashEdit}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                            <Copy className="h-3.5 w-3.5" />
                            {t.mnu_duplicate}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteState({ open: true, item })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t.dashDelete}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Item sheet */}
      <MenuItemSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        item={editingItem}
        categories={categories}
        defaultCategoryId={selectedCategoryId ?? categories[0]?.id}
        onSave={handleSave}
        onDelete={(id) => onItemsChange(items.filter((i) => i.id !== id))}
      />

      <DeleteConfirmDialog
        open={deleteState.open}
        onOpenChange={(v) => setDeleteState((s) => ({ ...s, open: v }))}
        title={t.mnu_deleteItem}
        description={t.mnu_cannotUndo}
        onConfirm={() => deleteState.item && handleDelete(deleteState.item)}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const t = useT();
  const [menus, setMenus]           = useState<Menu[]>(mockMenus);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [items, setItems]           = useState<Item[]>(mockItems);
  const [selectedMenuId, setSelectedMenuId]         = useState<string | null>(mockMenus[0]?.id ?? null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const menuCategories = useMemo(
    () =>
      categories
        .filter((c) => c.menu_id === selectedMenuId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [categories, selectedMenuId]
  );

  const menuCategoryIds = useMemo(
    () => new Set(menuCategories.map((c) => c.id)),
    [menuCategories]
  );

  const visibleItems = useMemo(
    () => items.filter((i) => menuCategoryIds.has(i.category_id)),
    [items, menuCategoryIds]
  );

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => { counts[i.category_id] = (counts[i.category_id] ?? 0) + 1; });
    return counts;
  }, [items]);

  function handleSelectMenu(id: string) {
    setSelectedMenuId(id);
    setSelectedCategoryId(null);
  }

  function handleCategoriesChange(updated: Category[]) {
    const reOrdered = updated.map((c, idx) => ({ ...c, sort_order: idx + 1 }));
    setCategories((prev) => {
      const others = prev.filter((c) => c.menu_id !== selectedMenuId);
      return [...others, ...reOrdered];
    });
  }

  function mergeItemsChange(updated: Item[]) {
    setItems((prev) => {
      const prevVisibleIds = new Set(visibleItems.map((i) => i.id));
      const kept = prev.filter((i) => !prevVisibleIds.has(i.id));
      return [...kept, ...updated];
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold">{t.mnu_pageTitle}</h1>
          <p className="text-xs text-muted-foreground">{t.mnu_pageSubtitle}</p>
        </div>
      </div>

      {/* Desktop: 3-panel layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-[180px] flex-shrink-0 border-r border-border overflow-hidden">
          <MenusPanel
            menus={menus}
            selectedMenuId={selectedMenuId}
            onSelectMenu={handleSelectMenu}
            onMenusChange={setMenus}
          />
        </div>
        <div className="w-[220px] flex-shrink-0 border-r border-border overflow-hidden">
          <CategoriesPanel
            categories={menuCategories}
            selectedMenuId={selectedMenuId}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onCategoriesChange={handleCategoriesChange}
            itemCounts={itemCounts}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <ItemsPanel
            items={visibleItems}
            categories={menuCategories}
            selectedCategoryId={selectedCategoryId}
            onItemsChange={mergeItemsChange}
            totalItemCount={items.length}
          />
        </div>
      </div>

      {/* Mobile: Tabs */}
      <div className="md:hidden flex-1 overflow-hidden">
        <Tabs defaultValue="menus" className="h-full">
          <TabsList variant="default" className="w-full rounded-none border-b border-border h-10">
            <TabsTrigger value="menus" className="flex-1">{t.mnu_menusSection}</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1">{t.mnu_categoriesSection}</TabsTrigger>
            <TabsTrigger value="items" className="flex-1">{t.mnu_itemsSection}</TabsTrigger>
          </TabsList>
          <TabsContent value="menus" className="h-[calc(100%-2.5rem)] overflow-hidden">
            <MenusPanel
              menus={menus}
              selectedMenuId={selectedMenuId}
              onSelectMenu={handleSelectMenu}
              onMenusChange={setMenus}
            />
          </TabsContent>
          <TabsContent value="categories" className="h-[calc(100%-2.5rem)] overflow-hidden">
            <CategoriesPanel
              categories={menuCategories}
              selectedMenuId={selectedMenuId}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              onCategoriesChange={handleCategoriesChange}
              itemCounts={itemCounts}
            />
          </TabsContent>
          <TabsContent value="items" className="h-[calc(100%-2.5rem)] overflow-hidden">
            <ItemsPanel
              items={visibleItems}
              categories={menuCategories}
              selectedCategoryId={selectedCategoryId}
              onItemsChange={mergeItemsChange}
              totalItemCount={items.length}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
