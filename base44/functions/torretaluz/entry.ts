import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Torreta de Luz — Semáforo por zona/portal
 *
 * GET /  → devuelve el estado de TODAS las zonas
 * GET /  con body { zone: "maquina3" } → devuelve solo esa zona
 *
 * Zonas disponibles:
 *   maquina3   → Máquina 3   (TriggerPortal)
 *   maquina1   → Máquina 1
 *   maquina2   → Máquina 2
 *   maquina4   → Máquina 4
 *   kanban     → Zona Kanban
 *
 * Lógica semáforo (por zona = production_line):
 *   ROJO    → hay trigger "unassigned" (no visto aún)
 *   AMARILLO → hay trigger "in_progress" (siendo atendido, sin "unassigned")
 *   VERDE    → no hay triggers activos (todo resuelto o sin alertas)
 *
 * Respuesta por zona:
 *   { zone, signal: "RED"|"YELLOW"|"GREEN", label, active_triggers, message }
 */

const ZONE_MAP = {
  maquina3: "Máquina 3",
  maquina1: "Máquina 1",
  maquina2: "Máquina 2",
  maquina4: "Máquina 4",
  kanban:   "Zona Kanban",
};

function getSignal(triggers) {
  const active = triggers.filter(t => t.status !== "resolved");
  const unassigned = active.filter(t => t.status === "unassigned");
  const inProgress = active.filter(t => t.status === "in_progress");

  if (unassigned.length > 0) {
    return {
      signal: "RED",
      label: "ROJO — Sin atender",
      message: `${unassigned.length} alerta(s) sin atender`,
      active_triggers: active.length,
      unassigned: unassigned.length,
      in_progress: inProgress.length,
    };
  }
  if (inProgress.length > 0) {
    return {
      signal: "YELLOW",
      label: "AMARILLO — En atención",
      message: `${inProgress.length} alerta(s) siendo atendida(s)`,
      active_triggers: active.length,
      unassigned: 0,
      in_progress: inProgress.length,
    };
  }
  return {
    signal: "GREEN",
    label: "VERDE — Todo en orden",
    message: "Sin alertas activas",
    active_triggers: 0,
    unassigned: 0,
    in_progress: 0,
  };
}

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Parse optional zone filter from body or query param
    let requestedZone = null;
    const url = new URL(req.url);
    const zoneParam = url.searchParams.get("zone");
    if (zoneParam) requestedZone = zoneParam.toLowerCase();

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.zone) requestedZone = body.zone.toLowerCase();
      } catch (_) { /* no body */ }
    }

    // Validate zone if provided
    if (requestedZone && !ZONE_MAP[requestedZone]) {
      return Response.json(
        {
          error: "Zona no válida",
          valid_zones: Object.keys(ZONE_MAP),
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch all active (non-resolved) triggers
    const allTriggers = await base44.asServiceRole.entities.Trigger.filter({ status: "unassigned" });
    const inProgressTriggers = await base44.asServiceRole.entities.Trigger.filter({ status: "in_progress" });
    const combined = [...allTriggers, ...inProgressTriggers];

    const timestamp = new Date().toISOString();

    if (requestedZone) {
      // Single zone response
      const productionLine = ZONE_MAP[requestedZone];
      const zoneTriggers = combined.filter(t => t.production_line === productionLine);
      const signalData = getSignal(zoneTriggers);

      return Response.json(
        {
          zone: requestedZone,
          production_line: productionLine,
          ...signalData,
          timestamp,
        },
        { headers: corsHeaders }
      );
    }

    // All zones response
    const result = {};
    for (const [zoneKey, productionLine] of Object.entries(ZONE_MAP)) {
      const zoneTriggers = combined.filter(t => t.production_line === productionLine);
      result[zoneKey] = {
        zone: zoneKey,
        production_line: productionLine,
        ...getSignal(zoneTriggers),
      };
    }

    return Response.json(
      {
        semaforo: result,
        summary: {
          red:    Object.values(result).filter(z => z.signal === "RED").length,
          yellow: Object.values(result).filter(z => z.signal === "YELLOW").length,
          green:  Object.values(result).filter(z => z.signal === "GREEN").length,
        },
        timestamp,
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
});