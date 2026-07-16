import Foundation

protocol CameraServicing {
    func fetchCameras() async throws -> ServiceResult<[CameraFeed]>
}

struct SampleCameraService: CameraServicing {
    func fetchCameras() async throws -> ServiceResult<[CameraFeed]> {
        ServiceResult(
            data: SampleDataCatalog.cameras,
            sourceStatus: SourceStatus(
                key: .cameras,
                label: "Cameras",
                ok: true,
                mode: .fallback,
                itemCount: SampleDataCatalog.cameras.count,
                updatedAt: ISO8601DateFormatter().string(from: .now),
                endpoint: nil,
                message: "Using bundled camera metadata, matching the current web fallback strategy."
            ),
            warnings: []
        )
    }
}

struct RemoteCameraService: CameraServicing {
    let apiClient: APIClient
    let endpoint: URL

    func fetchCameras() async throws -> ServiceResult<[CameraFeed]> {
        let payload = try await apiClient.fetch(endpoint, as: APIServiceEnvelope<[CameraFeed]>.self)
        return ServiceResult(data: payload.data, sourceStatus: payload.sourceStatus, warnings: payload.warnings)
    }
}
