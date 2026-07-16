import SwiftUI

struct FilterChip: View {
    let title: String
    let isActive: Bool
    let activeBackground: Color
    let activeForeground: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(isActive ? activeForeground : Color.cwTextSecondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .modifier(
                    FilterChipSurface(
                        isActive: isActive,
                        activeBackground: activeBackground
                    )
                )
        }
        .buttonStyle(.plain)
    }
}

private struct FilterChipSurface: ViewModifier {
    let isActive: Bool
    let activeBackground: Color

    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content
                .background(
                    Capsule()
                        .fill(isActive ? activeBackground.opacity(0.12) : Color.white.opacity(0.1))
                )
                .glassEffect(isActive ? .regular.interactive() : .clear.interactive(), in: Capsule())
                .overlay(
                    Capsule()
                        .strokeBorder(isActive ? activeBackground.opacity(0.24) : Color.white.opacity(0.16), lineWidth: 0.75)
                )
        } else {
            content
                .background(
                    Capsule()
                        .fill(isActive ? activeBackground.opacity(0.12) : Color.white.opacity(0.78))
                )
                .overlay(
                    Capsule()
                        .stroke(isActive ? activeBackground.opacity(0.24) : Color.cwPanelStroke, lineWidth: 1)
                )
        }
    }
}
