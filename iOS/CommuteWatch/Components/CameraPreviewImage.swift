import SwiftUI

struct CameraPreviewImage: View {
    let thumbnailURL: String?

    var body: some View {
        if let thumbnailURL, let url = URL(string: thumbnailURL) {
            AsyncImage(url: url) { phase in
                switch phase {
                case let .success(image):
                    image
                        .resizable()
                        .scaledToFill()
                case .failure:
                    placeholder
                case .empty:
                    placeholder
                @unknown default:
                    placeholder
                }
            }
        } else {
            placeholder
        }
    }

    private var placeholder: some View {
        ZStack {
            LinearGradient(
                colors: [Color.cwCameraSoft, Color.white],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Image(systemName: "camera.viewfinder")
                .font(.system(size: 30, weight: .medium))
                .foregroundStyle(Color.cwCamera)
        }
    }
}
