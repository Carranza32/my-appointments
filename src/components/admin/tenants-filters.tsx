"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";

type TenantsFiltersProps = {
  initialSearch: string;
  initialPlan: string;
};

export function TenantsFilters({ initialSearch, initialPlan }: TenantsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [plan, setPlan] = useState(initialPlan);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== initialSearch) {
        updateSearchParams(search, plan);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Handle plan dropdown change
  const handlePlanChange = (newPlan: string) => {
    setPlan(newPlan);
    updateSearchParams(search, newPlan);
  };

  const updateSearchParams = (searchValue: string, planValue: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    
    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    } else {
      params.delete("search");
    }

    if (planValue && planValue !== "ALL") {
      params.set("plan", planValue);
    } else {
      params.delete("plan");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:max-w-2xl bg-white/80 p-3 rounded-2xl border border-black/[0.06] backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#007AFF]" />
          ) : (
            <Search className="h-4 w-4 text-[#86868B]" />
          )}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o slug..."
          className="w-full pl-10 pr-4 py-2 text-xs font-normal bg-black/[0.03] text-[#1D1D1F] border border-black/[0.06] rounded-xl focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all placeholder:text-[#86868B]"
        />
      </div>

      {/* Plan Dropdown */}
      <div className="w-full sm:w-44">
        <select
          value={plan}
          onChange={(e) => handlePlanChange(e.target.value)}
          className="w-full px-3 py-2 text-xs font-normal bg-black/[0.03] text-[#1D1D1F] border border-black/[0.06] rounded-xl focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer"
        >
          <option value="ALL">Todos los planes</option>
          <option value="FREE">Plan FREE</option>
          <option value="PRO">Plan PRO</option>
        </select>
      </div>
    </div>
  );
}
