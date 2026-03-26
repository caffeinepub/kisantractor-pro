import { Phone, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Party, PartyStats } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  onPartyTap: (party: Party) => void;
}

export default function Parties({ onPartyTap }: Props) {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];

  const [parties, setParties] = useState<Party[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, PartyStats>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!actor) return;
    try {
      const allParties = await actor.getAllParties();
      setParties(allParties);
      const statsEntries = await Promise.all(
        allParties.map(async (p) => {
          const stats = await actor.getPartyStats(p.name);
          return [p.name, stats] as [string, PartyStats];
        }),
      );
      setStatsMap(Object.fromEntries(statsEntries));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!actor || !name.trim()) return;
    setSaving(true);
    try {
      await actor.createParty({
        id: BigInt(0),
        name: name.trim(),
        phone: phone.trim(),
        village: "",
        createdAt: BigInt(0),
      });
      setName("");
      setPhone("");
      setShowForm(false);
      await load();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    if (!confirm(`${t.delete}?`)) return;
    try {
      await actor.deleteParty(id);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = parties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const inputClass =
    "w-full border border-border rounded-xl px-3 py-3 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm";

  if (loading)
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );

  return (
    <div className="pb-4">
      {/* Search + Add row */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-border">
        <div className="flex-1 flex items-center gap-2 border border-border rounded-full px-3 py-2 bg-muted">
          <Search size={15} className="text-muted-foreground flex-shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder={t.searchCustomer}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="parties.search_input"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")}>
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          data-ocid="parties.add_party.button"
          className="flex items-center gap-1 border border-primary text-primary rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap"
        >
          + {language === "gu" ? "નવો" : "New"}
        </button>
      </div>

      {/* Summary row */}
      <div className="px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">
            {parties.length} {language === "gu" ? "પક્ષકારો" : "Parties"}
          </span>
        </div>
        {(() => {
          const totalUdhar = Object.values(statsMap).reduce(
            (s, st) => s + st.udharBalance,
            0,
          );
          return totalUdhar > 0 ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-xs text-destructive font-semibold">
                ₹{totalUdhar.toLocaleString()}{" "}
                {language === "gu" ? "બાકી" : "pending"}
              </span>
            </div>
          ) : null;
        })()}
      </div>

      {/* Add Party Form */}
      {showForm && (
        <div className="mx-4 mb-3 bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-bold text-foreground text-sm">{t.addParty}</h2>
          <input
            className={inputClass}
            placeholder={`${t.partyName} *`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-ocid="parties.party_name.input"
          />
          <input
            className={inputClass}
            placeholder={t.phone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            data-ocid="parties.phone.input"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !name.trim()}
              data-ocid="parties.save.button"
              className="flex-1 bg-primary text-primary-foreground disabled:opacity-50 font-bold py-3 rounded-xl text-sm"
            >
              {saving ? t.loading : t.save}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              data-ocid="parties.cancel.button"
              className="flex-1 border border-border text-foreground font-bold py-3 rounded-xl text-sm"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Party List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4" data-ocid="parties.empty_state">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-muted-foreground text-sm font-medium">
            {t.noParties}
          </p>
        </div>
      ) : (
        <div className="bg-card mx-0 border-t border-border">
          {filtered.map((party, idx) => {
            const stats = statsMap[party.name];
            const udhar = stats?.udharBalance ?? 0;
            const earnings = stats?.totalEarnings ?? 0;
            return (
              <div
                key={Number(party.id)}
                className="border-b border-border"
                data-ocid={`parties.item.${idx + 1}`}
              >
                <div className="flex items-center px-4 py-3.5">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-base font-bold text-accent-foreground">
                      {party.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <button
                    type="button"
                    className="flex-1 text-left min-w-0"
                    onClick={() => onPartyTap(party)}
                  >
                    <p className="font-bold text-foreground text-sm leading-tight">
                      {party.name}
                    </p>
                    {party.phone && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Phone size={9} />
                        {party.phone}
                      </p>
                    )}
                  </button>

                  {/* Amount + Delete */}
                  <div className="flex items-center gap-2 ml-2">
                    <div className="text-right">
                      {earnings > 0 && (
                        <p className="text-sm font-bold text-primary">
                          ₹{earnings.toLocaleString()}
                        </p>
                      )}
                      {udhar > 0 && (
                        <p className="text-xs font-semibold text-destructive">
                          ₹{udhar.toLocaleString()}{" "}
                          {language === "gu" ? "બાકી" : "due"}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(party.id);
                      }}
                      data-ocid={`parties.delete_button.${idx + 1}`}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
