import Foundation

protocol APIClient {
    func fetch<T: Decodable>(_ url: URL, as type: T.Type) async throws -> T
    func send<T: Decodable, Body: Encodable>(
        _ url: URL,
        method: String,
        body: Body,
        as type: T.Type
    ) async throws -> T
}

enum APIClientError: LocalizedError {
    case invalidResponse
    case statusCode(Int)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid server response."
        case let .statusCode(code):
            return "Request failed with status \(code)."
        }
    }
}

struct URLSessionAPIClient: APIClient {
    let session: URLSession
    let decoder: JSONDecoder
    let encoder: JSONEncoder

    init(
        session: URLSession = .shared,
        decoder: JSONDecoder = JSONDecoder(),
        encoder: JSONEncoder = JSONEncoder()
    ) {
        self.session = session
        self.decoder = decoder
        self.encoder = encoder
    }

    func fetch<T: Decodable>(_ url: URL, as type: T.Type) async throws -> T {
        var request = URLRequest(url: url)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        return try await perform(request, as: type)
    }

    func send<T: Decodable, Body: Encodable>(
        _ url: URL,
        method: String = "POST",
        body: Body,
        as type: T.Type
    ) async throws -> T {
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = try encoder.encode(body)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        return try await perform(request, as: type)
    }

    private func perform<T: Decodable>(_ request: URLRequest, as type: T.Type) async throws -> T {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw APIClientError.statusCode(httpResponse.statusCode)
        }

        return try decoder.decode(type, from: data)
    }
}
