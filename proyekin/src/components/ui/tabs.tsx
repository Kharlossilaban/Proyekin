"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

/**
 * Tabs (Base UI): panah kiri/kanan memindahkan dan mengaktifkan tab, Home/End ke tab pertama/terakhir,
 * Tab masuk ke panel. Daftar tab boleh digulir ke samping DI DALAM komponen (mis. di 375px) tanpa membuat
 * halaman overflow. Tinggi tab minimal 44px.
 */
function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex min-w-0 max-w-full flex-col gap-4", className)} {...props} />;
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <div data-slot="tabs-scroll" className="max-w-full overflow-x-auto border-b border-border">
      <TabsPrimitive.List
        data-slot="tabs-list"
        activateOnFocus
        className={cn("flex w-max min-w-full gap-1", className)}
        {...props}
      />
    </div>
  );
}

function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        "-mb-px inline-flex min-h-11 shrink-0 items-center justify-center border-b-2 border-transparent px-4",
        "text-sm font-medium whitespace-nowrap text-graphite transition-colors select-none",
        "hover:text-foreground",
        "data-active:border-brand-700 data-active:text-foreground",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        "data-disabled:cursor-not-allowed data-disabled:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn("min-w-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTab, TabsPanel };
