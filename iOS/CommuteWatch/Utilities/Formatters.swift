import Foundation

enum AppFormatters {
    private static let timestampParser: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let timestampParserFallback = ISO8601DateFormatter()

    private static let timestampFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "MMM d, h:mm a"
        return formatter
    }()

    static func parse(_ isoString: String?) -> Date? {
        guard let isoString, !isoString.isEmpty else {
            return nil
        }

        return timestampParser.date(from: isoString) ?? timestampParserFallback.date(from: isoString)
    }

    static func formatTimestamp(_ isoString: String?) -> String {
        guard let date = parse(isoString) else {
            return "Unknown"
        }

        return timestampFormatter.string(from: date)
    }

    static func formatRelativeMinutes(_ minutes: Int) -> String {
        if minutes < 1 {
            return "Updated just now"
        }

        if minutes < 60 {
            return "Updated \(minutes) min ago"
        }

        return "Updated \(Int(round(Double(minutes) / 60.0)))h ago"
    }

    static func formatDistanceKilometers(_ distance: Double) -> String {
        if distance < 1 {
            return "\(Int(round(distance * 1_000))) m"
        }

        let precision = distance < 10 ? "%.1f km" : "%.0f km"
        return String(format: precision, distance)
    }
}
