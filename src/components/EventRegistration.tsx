import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-tab";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { canRegisterForEvent } from "@/lib/participation-rules";

export function useRegistrations() {
  const { user, isAdmin, isOrganiser, loading } = useAuth();
  return useQuery({
    queryKey: ["my-registrations", user?.id], enabled: !!user && !loading && canRegisterForEvent(isAdmin, isOrganiser), staleTime: 60000,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("event_registrations").select("*, events(title, venue)").eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });
}

export function EventRegistration({ eventId, title }: { eventId: string; title: string }) {
  const { user, profile, isAdmin, isOrganiser, loading } = useAuth();
  const { data = [] } = useRegistrations();
  const [ticket, setTicket] = useState(false);
  const registration = data.find((r) => r.event_id === eventId);

  if (loading) return null;
  if (!canRegisterForEvent(isAdmin, isOrganiser)) return <Button asChild variant="outline" className="mt-5 w-full"><Link to={isAdmin ? "/admin" : "/organiser-desk"}>{isAdmin ? "Admin portal" : "Attendance desk"}</Link></Button>;
  return <>
    {user ? <Button className="mt-5 w-full" variant={registration ? "default" : "outline"} onClick={() => setTicket(true)}>
      <QrCode className="h-4 w-4" />
      {registration ? "Registered · Show code" : "Show my attendance code"}
    </Button> : <Button asChild className="mt-5 w-full" variant="outline"><Link to="/auth" search={{ redirect: "/#events" }}>Sign in to participate</Link></Button>}
    <Dialog open={ticket} onOpenChange={setTicket}>
      <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="mx-auto rounded-lg bg-foreground p-3">{profile?.student_code && <QRCodeSVG value={profile.student_code} size={220} />}</div>
        <div className="text-center"><p className="text-xs uppercase text-muted-foreground">Your one attendance code</p><p className="mt-2 break-all font-mono text-xl text-ghost">{profile?.student_code}</p><Button variant="ghost" size="sm" onClick={async () => { try { if (profile) await navigator.clipboard.writeText(profile.student_code); toast.success("Code copied"); } catch { toast.error("Unable to copy code"); } }}><Copy className="h-4 w-4" />Copy code</Button></div>
        <p className="text-center text-sm text-muted-foreground">Show this QR or code to the organiser at the venue — they will register you and mark you present. You can only be in one event at a time.</p>
      </DialogContent>
    </Dialog>
  </>;
}
