import { useNavigate } from "@tanstack/react-router";
import { MapPin, Mic, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CATEGORIES, CITIES, type City } from "@/data/catalog";
import { liveBusinessesQ } from "@/lib/public-data";
import { useCity } from "./city";
import { cn } from "@/lib/utils";

export function SearchBar({ size = "lg", initial = "" }: { size?: "lg" | "sm"; initial?: string }) {
  const { city, setCity } = useCity();
  const [q, setQ] = useState(initial);
  const [area, setArea] = useState("");
  const [focus, setFocus] = useState(false);
  const navigate = useNavigate();
  const { data: live = [] } = useQuery(liveBusinessesQ);
  const areas = [...new Set(live.filter((b) => b.city === city).map((b) => b.area).filter(Boolean))].sort();
  const sugg = q.trim() ? [
    ...CATEGORIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())).map((c) => ({ label: c.name, context: "Category" })),
    ...live.filter((b) => b.city === city && b.name.toLowerCase().includes(q.toLowerCase())).slice(0, 4).map((b) => ({ label: b.name, context: b.area })),
  ].slice(0, 7) : [];
  const go = (term: string) => { setFocus(false); navigate({ to: "/search", search: { q: term, city, ...(area ? { area } : {}) } }); };
  const voiceSearch = () => {
    type Recognition = { lang: string; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; start: () => void };
    type Recognizer = new () => Recognition;
    const speech = window as typeof window & { SpeechRecognition?: Recognizer; webkitSpeechRecognition?: Recognizer };
    const RecognitionClass = speech.SpeechRecognition ?? speech.webkitSpeechRecognition;
    if (!RecognitionClass) { toast.info("Voice search isn't supported in this browser. Try typing your search."); return; }
    const recognition = new RecognitionClass();
    recognition.lang = "en-IN";
    recognition.onresult = (event) => { const transcript = event.results[0]?.[0]?.transcript?.trim(); if (transcript) { setQ(transcript); go(transcript); } };
    recognition.onerror = () => toast.error("Voice search couldn't start. Check microphone permission.");
    try { recognition.start(); } catch { toast.error("Voice search is unavailable right now."); }
  };
  const lg = size === "lg";
  return (
    <form onSubmit={(e) => { e.preventDefault(); go(q); }} className={cn("relative flex w-full items-stretch rounded-2xl border bg-card", lg ? "h-16 p-1.5 shadow-lift" : "h-11 p-1")}>
      <label className={cn("flex items-center gap-1.5 border-r pl-3 pr-2", !lg && "hidden sm:flex")}>
        <MapPin className="size-4 text-coral" />
        <span className="sr-only">City</span>
        <select value={city} onChange={(e) => { setCity(e.target.value as City); setArea(""); }} className="cursor-pointer bg-transparent text-sm font-semibold outline-none">
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      {lg && areas.length > 0 && <label className="hidden max-w-40 items-center border-r pr-2 sm:flex"><span className="sr-only">Locality</span><select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Locality" className="w-full max-w-36 cursor-pointer truncate bg-transparent text-xs font-semibold outline-none"><option value="">All localities</option>{areas.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>}
      <input
        value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder={lg ? "Search for restaurants, doctors, AC repair…" : "Search anything"}
        aria-label="Search" className={cn("min-w-0 flex-1 bg-transparent px-3 outline-none", lg ? "text-base" : "text-sm")}
      />
      {lg && <button type="button" onClick={voiceSearch} aria-label="Voice search" className="hidden px-3 text-muted-foreground hover:text-foreground sm:block"><Mic className="size-5" /></button>}
      <button type="submit" aria-label="Search" className={cn("grid place-items-center rounded-xl bg-primary font-bold text-primary-foreground", lg ? "px-6" : "px-3")}>
        <span className="flex items-center gap-2"><Search className="size-5" />{lg && <span className="hidden sm:inline">Search</span>}</span>
      </button>
      {focus && sugg.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-popover p-1 shadow-lift">
          {sugg.map((s) => (
            <li key={`${s.context}-${s.label}`}>
              <button type="button" onMouseDown={() => go(s.label)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-muted">
                <span className="font-semibold">{s.label}</span><span className="text-xs text-muted-foreground">{s.context}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
