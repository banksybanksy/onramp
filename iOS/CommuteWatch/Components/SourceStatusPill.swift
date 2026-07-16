import SwiftUI

struct SourceStatusPill: View {
    let status: SourceStatus

    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(status.mode.foregroundColor)
                .frame(width: 7, height: 7)
            Text("\(status.label) \(status.mode.rawValue)")
                .font(.caption2.weight(.semibold))
                .textCase(.uppercase)
        }
        .foregroundStyle(status.mode.foregroundColor)
        .padding(.horizontal, 11)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(Color.white.opacity(0.44))
        )
        .modifier(StatusPillGlassModifier(tint: status.mode.foregroundColor))
    }
}

struct StatusPillGlassModifier: ViewModifier {
    let tint: Color

    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content
                .glassEffect(.clear, in: Capsule())
                .overlay(Capsule().strokeBorder(tint.opacity(0.14), lineWidth: 0.75))
                .shadow(color: Color.black.opacity(0.05), radius: 10, y: 6)
        } else {
            content
                .background(Color.white.opacity(0.82), in: Capsule())
                .shadow(color: Color.black.opacity(0.05), radius: 10, y: 6)
        }
    }
}
