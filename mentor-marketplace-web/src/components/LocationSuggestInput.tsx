import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

export type LocationSuggestion = {
  id: string;
  label: string;
  city: string;
  state?: string;
  country?: string;
};

type PhotonFeature = {
  properties: {
    osm_id?: number;
    name?: string;
    city?: string;
    locality?: string;
    county?: string;
    state?: string;
    country?: string;
    type?: string;
  };
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

type LocationSuggestInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** ISO 3166-1 alpha-2, e.g. "in" — biases results. */
  countryIso2?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
};

function toSuggestion(feature: PhotonFeature, index: number): LocationSuggestion | null {
  const p = feature.properties;
  const city = p.city || p.locality || p.name || p.county;
  if (!city) {
    return null;
  }
  const state = p.state;
  const country = p.country;
  return {
    id: String(p.osm_id ?? `${city}-${index}`),
    label: [city, state, country].filter(Boolean).join(", "),
    city,
    state,
    country,
  };
}

/**
 * City / area autocomplete via Komoot Photon (OpenStreetMap data).
 * No API key. Google Places / Mapbox would require a billed key.
 * Photon is CORS-friendly for browser use (unlike public Nominatim).
 */
export function LocationSuggestInput({
  value,
  onChange,
  countryIso2 = "in",
  placeholder = "Start typing a city…",
  className = "",
  inputClassName = "",
  id,
}: LocationSuggestInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const skipFetchRef = useRef(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }

    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q,
          limit: "8",
          lang: "en",
        });
        const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = (await res.json()) as PhotonResponse;
        const iso = countryIso2?.toLowerCase();
        const mapped = (data.features ?? [])
          .map((f, i) => toSuggestion(f, i))
          .filter((s): s is LocationSuggestion => s != null);

        const countryNames: Record<string, string[]> = {
          in: ["india"],
          us: ["united states", "usa"],
          gb: ["united kingdom", "uk"],
          au: ["australia"],
          ae: ["united arab emirates", "uae"],
          sg: ["singapore"],
          jp: ["japan"],
          de: ["germany"],
          fr: ["france"],
          cn: ["china"],
          kr: ["south korea", "korea"],
          my: ["malaysia"],
          pk: ["pakistan"],
          bd: ["bangladesh"],
          lk: ["sri lanka"],
          np: ["nepal"],
        };
        const aliases = iso ? countryNames[iso] ?? [] : [];
        const filtered =
          aliases.length === 0
            ? mapped
            : mapped.filter((s) => {
                const country = s.country?.toLowerCase() ?? "";
                if (!country) return true;
                return aliases.some((a) => country.includes(a));
              });
        const preferred = filtered.length > 0 ? filtered : mapped;

        const seen = new Set<string>();
        const unique = preferred.filter((s) => {
          const key = s.label.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setSuggestions(unique.slice(0, 6));
        setOpen(unique.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, countryIso2]);

  function selectSuggestion(s: LocationSuggestion) {
    skipFetchRef.current = true;
    setQuery(s.city);
    onChange(s.city);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        className={`pl-10 ${inputClassName}`}
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          onChange(next);
          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {loading && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          Searching…
        </span>
      )}
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-accent/15 text-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>
                  <span className="font-medium">{s.city}</span>
                  {(s.state || s.country) && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {[s.state, s.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
