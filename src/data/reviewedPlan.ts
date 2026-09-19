import { skus, events } from "./kelarune";
import { forecastSku, RETURNS_RATE } from "../engine/forecastEngine";

// Published synthetic review, captured once independently of session scenarios.
// Prices, events and units belong to this version, never to the active scenario.
export const reviewedPlan = Object.freeze({
  id: "kelarune-2026-09-07",
  reviewedAt: "2026-09-07",
  forecasts: Object.freeze(
    Object.fromEntries(
      skus.map((sku) => [
        sku.id,
        Object.freeze(
          forecastSku(sku, 26, events).map((point) =>
            Object.freeze({
              weekStart: point.weekStart,
              units: point.previousForecast,
              sellingPrice: point.sellingPrice,
              returnsRate: RETURNS_RATE,
              revenue:
                point.previousForecast *
                point.sellingPrice *
                (1 - RETURNS_RATE),
            }),
          ),
        ),
      ]),
    ),
  ),
});
