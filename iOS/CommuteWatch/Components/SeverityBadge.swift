import SwiftUI

struct SeverityBadge: View {
    let severity: Severity
    var compact: Bool = false

    var body: some View {
        Text(severity.displayTitle)
            .font(compact ? .caption2.weight(.semibold) : .caption.weight(.semibold))
            .foregroundStyle(severity.accentColor)
            .padding(.horizontal, compact ? 8 : 10)
            .padding(.vertical, compact ? 5 : 6)
            .background(severity.backgroundColor, in: Capsule())
            .overlay(
                Capsule()
                    .stroke(severity.accentColor.opacity(0.18), lineWidth: 1)
            )
    }
}

#Preview {
    HStack {
        SeverityBadge(severity: .minor)
        SeverityBadge(severity: .major)
        SeverityBadge(severity: .critical)
    }
    .padding()
}
