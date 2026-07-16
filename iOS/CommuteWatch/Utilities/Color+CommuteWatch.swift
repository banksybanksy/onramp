import SwiftUI
import UIKit

extension Color {
    static let cwBackground = Color(uiColor: UIColor(red: 0.86, green: 0.90, blue: 0.93, alpha: 1))
    static let cwPanel = Color(uiColor: .secondarySystemBackground)
    static let cwPanelStrong = Color(uiColor: .systemBackground)
    static let cwPanelStroke = Color(uiColor: .separator).opacity(0.22)
    static let cwTextPrimary = Color.primary
    static let cwTextSecondary = Color.secondary
    static let cwTraffic = Color(hex: 0xC05A45)
    static let cwTrafficSoft = Color(hex: 0xF6E7E1)
    static let cwTransit = Color(hex: 0x3F6FCF)
    static let cwTransitSoft = Color(hex: 0xE8EEF9)
    static let cwCamera = Color(hex: 0x58789A)
    static let cwCameraSoft = Color(hex: 0xE7EEF3)
    static let cwRoute = Color(hex: 0x3263C7)
    static let cwGlassTint = Color(hex: 0xC9D5DE)

    init(hex: Int, alpha: Double = 1) {
        let red = Double((hex >> 16) & 0xFF) / 255.0
        let green = Double((hex >> 8) & 0xFF) / 255.0
        let blue = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: red, green: green, blue: blue, opacity: alpha)
    }
}

extension Severity {
    var accentColor: Color {
        switch self {
        case .minor:
            return Color(hex: 0x0EA5E9)
        case .major:
            return Color(hex: 0xD97706)
        case .critical:
            return Color(hex: 0xE11D48)
        }
    }

    var backgroundColor: Color {
        switch self {
        case .minor:
            return Color(hex: 0xE0F2FE)
        case .major:
            return Color(hex: 0xFEF3C7)
        case .critical:
            return Color(hex: 0xFFE4E6)
        }
    }
}

extension SourceStatusMode {
    var foregroundColor: Color {
        switch self {
        case .live:
            return Color(hex: 0x1B5E45)
        case .partial:
            return Color(hex: 0x8A5A18)
        case .fallback:
            return .secondary
        }
    }

    var backgroundColor: Color {
        switch self {
        case .live:
            return Color(hex: 0xE2F1EA)
        case .partial:
            return Color(hex: 0xF5ECD8)
        case .fallback:
            return Color(uiColor: .secondarySystemBackground)
        }
    }
}
