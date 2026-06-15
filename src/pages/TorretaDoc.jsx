import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw } from "lucide-react";

const ease = [0.25, 0.1, 0.25, 1];

const ZONES = [
  { key: "maquina3", label: "Máquina 3",   description: "Portal principal de escasez" },
  { key: "maquina1", label: "Máquina 1",   description: "Portal Máquina 1" },
  { key: "maquina2", label: "Máquina 2",   description: "Portal Máquina 2" },
  { key: "maquina4", label: "Máquina 4",   description: "Portal Máquina 4" },
  { key: "kanban",   label: "Zona Kanban", description: "Centro de distribución" },
];

const SIGNAL_CONFIG = {
  RED:    { color: "#FF3B30", bg: "rgba(255,59,48,0.08)",  border: "rgba(255,59,48,0.25)",  label: "ROJO",     dot: "#FF3B30" },
  YELLOW: { color: "#FF9F0A", bg: "rgba(255,159,10,0.08)", border: "rgba(255,159,10,0.25)", label: "AMARILLO", dot: "#FF9F0A" },
  GREEN:  { color: "#34C759", bg: "rgba(52,199,89,0.08)",  border: "rgba(52,199,89,0.25)",  label: "VERDE",    dot: "#34C759" },
};

function TrafficLight({ signal }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "#1D1D1F", borderRadius: 14, padding: "12px 10px", width: 40 }}>
      {["RED", "YELLOW", "GREEN"].map((s) => {
        const active = signal === s;
        const colors = { RED: "#FF3B30", YELLOW: "#FF9F0A", GREEN: "#34C759" };
        return (
          <motion.div
            key={s}
            animate={active ? { opacity: [1, 0.6, 1], scale: [1, 1.05, 1] } : { opacity: 1 }}
            transition={active ? { duration: 1.5, repeat: Infinity } : {}}
            style={{
              width: 18, height: 18, borderRadius: 9999,
              background: active ? colors[s] : "rgba(255,255,255,0.08)",
              boxShadow: active ? `0 0 10px ${colors[s]}90` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function ZoneRow({ zone, data, loading }) {
  const cfg = data ? SIGNAL_CONFIG[data.signal] : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, background: "#FFFFFF", marginBottom: 8 }}>
      <TrafficLight signal={data?.signal} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>{zone.label}</p>
          {cfg && (
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, borderRadius: 6, padding: "2px 8px" }}>
              {cfg.label}
            </span>
          )}
        </div>
        <p style={{ fontSize: 11, color: "#86868B", margin: 0, fontFamily: "'SF Mono','JetBrains Mono',monospace" }}>
          ?zone={zone.key}
        </p>
        {data && (
          <p style={{ fontSize: 11, color: "#6E6E73", marginTop: 2 }}>{data.message}</p>
        )}
      </div>
      {loading && <RefreshCw size={13} style={{ color: "#AEAEB2", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />}
    </div>
  );
}

export default function TorretaDoc() {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("torretaluz", {});
      setLiveData(res.data);
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 8000);
    return () => clearInterval(iv);
  }, []);

  const summary = liveData?.summary;

  return (
    <div className="min-h-screen pb-24 lg:pb-10" style={{ background: "#FFFFFF" }}>

      {/* Header */}
      <div style={{ padding: "40px 40px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6E6E73", textTransform: "uppercase", marginBottom: 8 }}>
          API — Torretas de Luz
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#1D1D1F", margin: 0 }}>
            Semáforo en Vivo
          </h1>
          <button
            onClick={fetchStatus}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.10)", background: "transparent", fontSize: 12, color: "#6E6E73", cursor: "pointer" }}
          >
            <RefreshCw size={12} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
            Actualizar
          </button>
        </div>
        {lastUpdate && (
          <p style={{ fontSize: 11, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#AEAEB2", marginTop: 6 }}>
            Última actualización: {lastUpdate.toLocaleTimeString("es-MX")}
          </p>
        )}
      </div>

      {/* Summary badges */}
      {summary && (
        <div style={{ padding: "20px 40px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "ROJO",     value: summary.red,    color: "#FF3B30", bg: "rgba(255,59,48,0.07)"  },
            { label: "AMARILLO", value: summary.yellow, color: "#FF9F0A", bg: "rgba(255,159,10,0.07)" },
            { label: "VERDE",    value: summary.green,  color: "#34C759", bg: "rgba(52,199,89,0.07)"  },
          ].map(b => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: b.bg, borderRadius: 10, border: `1px solid ${b.color}22` }}>
              <div style={{ width: 8, height: 8, borderRadius: 9999, background: b.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: b.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{b.label}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#1D1D1F", fontVariantNumeric: "tabular-nums" }}>{b.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Zone rows */}
      <div style={{ padding: "24px 40px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", marginBottom: 12 }}>
          Estado por Zona
        </p>
        {ZONES.map((zone) => (
          <ZoneRow
            key={zone.key}
            zone={zone}
            data={liveData?.semaforo?.[zone.key]}
            loading={loading}
          />
        ))}
      </div>

      {/* Endpoint reference */}
      <div style={{ padding: "32px 40px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", marginBottom: 12 }}>
          Referencia de Endpoints
        </p>
        <div style={{ border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, overflow: "hidden" }}>
          {/* All zones */}
          <div style={{ padding: "16px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(0,113,227,0.08)", border: "1px solid rgba(0,113,227,0.20)", color: "#0071E3", borderRadius: 6, padding: "2px 8px", letterSpacing: "0.06em" }}>GET</span>
              <code style={{ fontSize: 12, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#1D1D1F" }}>/torretaluz</code>
            </div>
            <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>Devuelve el estado semáforo de <strong>todas</strong> las zonas + resumen.</p>
          </div>
          {/* Single zone */}
          <div style={{ padding: "16px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(0,113,227,0.08)", border: "1px solid rgba(0,113,227,0.20)", color: "#0071E3", borderRadius: 6, padding: "2px 8px", letterSpacing: "0.06em" }}>GET</span>
              <code style={{ fontSize: 12, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#1D1D1F" }}>/torretaluz?zone=maquina3</code>
            </div>
            <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>Devuelve el estado de <strong>una zona específica</strong>.</p>
          </div>
          {/* Zones table */}
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#6E6E73", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Valores válidos para <code>zone</code></p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ZONES.map(z => (
                <div key={z.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "rgba(0,0,0,0.02)", borderRadius: 8 }}>
                  <code style={{ fontSize: 12, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#0071E3", minWidth: 90 }}>{z.key}</code>
                  <span style={{ fontSize: 12, color: "#6E6E73" }}>{z.label} — {z.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Signal reference */}
      <div style={{ padding: "24px 40px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", marginBottom: 12 }}>
          Señales del Semáforo
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { signal: "RED",    title: "ROJO",     when: "Hay ≥1 alerta sin atender (unassigned)", action: "Torreta LUZ ROJA — acción inmediata requerida", color: "#FF3B30" },
            { signal: "YELLOW", title: "AMARILLO", when: "Hay alertas en progreso, pero ninguna sin atender (in_progress)", action: "Torreta LUZ AMARILLA — en proceso de resolución", color: "#FF9F0A" },
            { signal: "GREEN",  title: "VERDE",    when: "Sin alertas activas (todo resuelto o sin triggers)", action: "Torreta LUZ VERDE — operación normal", color: "#34C759" },
          ].map(item => {
            const cfg = SIGNAL_CONFIG[item.signal];
            return (
              <div key={item.signal} style={{ display: "flex", gap: 14, padding: "14px 16px", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: 9999, background: item.color, flexShrink: 0, marginTop: 3 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: item.color, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: "#3A3A3C", margin: "0 0 2px" }}><strong>Cuándo:</strong> {item.when}</p>
                  <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}><strong>Señal:</strong> {item.action}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Example response */}
      <div style={{ padding: "0 40px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E6E73", marginBottom: 12 }}>
          Ejemplo de Respuesta (zona única)
        </p>
        <pre style={{ background: "#1D1D1F", borderRadius: 12, padding: "16px 20px", fontSize: 11, fontFamily: "'SF Mono','JetBrains Mono',monospace", color: "#A8FF78", overflowX: "auto", lineHeight: 1.7, margin: 0 }}>
{`{
  "zone": "maquina3",
  "production_line": "Máquina 3",
  "signal": "RED",
  "label": "ROJO — Sin atender",
  "message": "2 alerta(s) sin atender",
  "active_triggers": 2,
  "unassigned": 2,
  "in_progress": 0,
  "timestamp": "2026-06-15T10:32:00.000Z"
}`}
        </pre>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}