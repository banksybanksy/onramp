// Trimmed from the three payload shapes 511 has returned for transit alerts.

export const gtfsRealtimePayload = {
  header: { gtfs_realtime_version: "2.0" },
  entity: [
    {
      id: "BA:5521",
      alert: {
        active_period: [{ start: 1760275800, end: 1760290200 }],
        informed_entity: [{ agency_id: "BA", route_id: "YL-S" }],
        header_text: {
          translation: [
            { text: "Retraso en 24th St Mission", language: "es" },
            { text: "Delays through 24th St Mission", language: "en" }
          ]
        },
        description_text: {
          translation: [{ text: "Signal problem near 24th St Mission.", language: "en" }]
        },
        effect: "SIGNIFICANT_DELAYS"
      }
    },
    { id: "not-an-alert", trip_update: {} }
  ]
};

export const alertsArrayPayload = {
  alerts: [
    {
      alertId: "SF-77",
      agency_id: "SF",
      headerText: "N Judah shuttle buses",
      informedEntities: [{ routeId: "N" }],
      severity: "severe"
    }
  ]
};

export const bareArrayPayload = [
  {
    title: "Caltrain weekend single tracking",
    operator: "CT",
    routes: ["Local", "Local"]
  },
  null,
  "not a record"
];
