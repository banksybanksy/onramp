import SwiftUI

private struct LiquidGlassCardModifier: ViewModifier {
    let cornerRadius: CGFloat
    let tint: Color
    let shadowOpacity: Double

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)

        content
            .modifier(SystemGlassSurface(shape: shape, tint: tint, shadowOpacity: shadowOpacity))
    }
}

extension View {
    func liquidGlassCard(
        cornerRadius: CGFloat = 28,
        tint: Color = .cwGlassTint,
        shadowOpacity: Double = 0.1
    ) -> some View {
        modifier(
            LiquidGlassCardModifier(
                cornerRadius: cornerRadius,
                tint: tint,
                shadowOpacity: shadowOpacity
            )
        )
    }
}

private struct SystemGlassSurface<S: Shape>: ViewModifier {
    let shape: S
    let tint: Color
    let shadowOpacity: Double

    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content
                .glassEffect(.regular, in: shape)
                .overlay(
                    shape
                        .stroke(tint.opacity(0.12), lineWidth: 0.75)
                )
                .shadow(color: Color.black.opacity(shadowOpacity), radius: 22, y: 10)
        } else {
            content
                .background(
                    shape
                        .fill(.ultraThinMaterial)
                        .overlay(
                            shape
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            Color.white.opacity(0.28),
                                            tint.opacity(0.14),
                                            Color.white.opacity(0.06)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                        )
                )
                .overlay(
                    shape
                        .stroke(Color.white.opacity(0.42), lineWidth: 1)
                )
                .shadow(color: Color.black.opacity(shadowOpacity), radius: 22, y: 10)
        }
    }
}
