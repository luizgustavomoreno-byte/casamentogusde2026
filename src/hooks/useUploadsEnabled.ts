import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUploadsEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  const refresh = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "uploads_enabled")
      .maybeSingle();
    // value armazenado como JSONB boolean
    const v = (data?.value as unknown) ?? true;
    setEnabled(v === true || v === "true");
  };

  useEffect(() => {
    void refresh();
    const ch = supabase
      .channel("app_settings_uploads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "key=eq.uploads_enabled" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, []);

  return { enabled, refresh };
}
