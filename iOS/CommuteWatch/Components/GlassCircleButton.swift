import SwiftUI

struct GlassCircleButton<Label: View>: View {
    let action: () -> Void
    @ViewBuilder let label: () -> Label

    var body: some View {
        Button(action: action) {
            label()
                .frame(width: 46, height: 46)
                .modifier(GlassCircleSurface())
        }
        .buttonStyle(.plain)
    }
}

private struct GlassCircleSurface: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content
                .glassEffect(.regular.interactive(), in: Circle())
                .shadow(color: Color.black.opacity(0.12), radius: 18, y: 10)
        } else {
            content
                .background(
                    Circle()
                        .fill(.ultraThinMaterial)
                        .overlay(
                            Circle()
                                .stroke(Color.white.opacity(0.62), lineWidth: 1)
                        )
                )
                .shadow(color: Color.black.opacity(0.12), radius: 18, y: 10)
        }
    }
}
