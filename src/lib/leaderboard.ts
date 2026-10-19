import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-tab";

export function useLeaderboard(category: "total" | "tech" | "non_tech" = "total", page = 0) {
  return useQuery({
    queryKey: ["leaderboard", category, page],
    staleTime: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_participation_leaderboard", { _category: category, _page: page });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}

/** Standard competition ranking: equal points share a rank. */
export function rankRows<T>(rows: T[], score: (r: T) => number) {
  const sorted = [...rows].sort((a, b) => score(b) - score(a));
  let rank = 0, prev = Number.NaN;
  return sorted.map((r, i) => {
    const s = score(r);
    if (s !== prev) { rank = i + 1; prev = s; }
    return { row: r, rank, score: s };
  });
}
