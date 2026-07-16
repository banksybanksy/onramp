import SwiftUI

struct IncidentCardView: View {
    let incident: Incident
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("\(incident.agency.rawValue) • \(incident.kindLabel)")
                            .font(.caption2.monospaced().weight(.medium))
                            .foregroundStyle(Color.cwTextSecondary)
                            .textCase(.uppercase)

                        Text(incident.title)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color.cwTextPrimary)
                            .multilineTextAlignment(.leading)

                        Text(incident.subtitle)
                            .font(.footnote)
                            .foregroundStyle(Color.cwTextSecondary)
                            .multilineTextAlignment(.leading)
                            .lineLimit(2)
                    }

                    Spacer(minLength: 0)
                    SeverityBadge(severity: incident.severity, compact: true)
                }

                HStack(spacing: 8) {
                    Text(AppFormatters.formatRelativeMinutes(incident.freshnessMinutes))
                        .font(.caption)
                        .foregroundStyle(Color.cwTextSecondary)

                    if incident.affectsMyCommute {
                        Text("My commute")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(Color.cwTransit)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 5)
                            .background(Color.cwTransitSoft, in: Capsule())
                    }
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(isSelected ? Color.white.opacity(0.95) : Color.white.opacity(0.72))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(isSelected ? Color.cwTextSecondary.opacity(0.35) : Color.cwPanelStroke, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}
