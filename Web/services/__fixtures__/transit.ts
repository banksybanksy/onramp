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

// 511's `format=json` service alerts: the GTFS-Realtime shape in PascalCase,
// with numeric enums (Effect 4 = DETOUR, 9 = STOP_MOVED).
export const bay511JsonPayload = {
  Header: { GtfsRealtimeVersion: "1.0", Incrementality: 0, Timestamp: 1760275800 },
  Entity: [
    {
      Id: "AC_San Pablo Ave. at West Grand Ave. Stop Closed",
      Alert: {
        ActivePeriod: [{ Start: 1760275800 }],
        InformedEntity: [{ AgencyId: "AC", StopId: "55660" }],
        Cause: 9,
        Effect: 9,
        Url: { Translation: [{ Text: "https://www.actransit.org/node/30900", Language: "en" }] },
        HeaderText: {
          Translation: [
            { Text: "San Pablo at W Grand Stop Closed", Language: "en" },
            { Text: "Parada cerrada en San Pablo y W Grand", Language: "es" }
          ]
        },
        DescriptionText: {
          Translation: [{ Text: "San Pablo Ave. at West Grand Ave. stop closed.", Language: "en" }]
        }
      }
    },
    {
      Id: "BA_service_suspended",
      Alert: {
        InformedEntity: [{ AgencyId: "BA", RouteId: "YL-N" }],
        Effect: 1,
        HeaderText: {
          Translation: [{ Text: "No Yellow Line service north of MacArthur", Language: "en" }]
        }
      }
    },
    {
      Id: "AC_stop_closed",
      Alert: {
        InformedEntity: [{ AgencyId: "AC", RouteId: "6", StopId: "55661" }],
        Effect: 1,
        HeaderText: { Translation: [{ Text: "Telegraph at 40th Stop Closed", Language: "en" }] }
      }
    },
    {
      Id: "SF_N_detour",
      Alert: {
        InformedEntity: [{ AgencyId: "SF", RouteId: "N" }],
        Effect: 4,
        HeaderText: { Translation: [{ Text: "N Judah detour", Language: "en" }] }
      }
    }
  ]
};
