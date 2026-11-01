import Foundation
import UIKit

struct Photo: Decodable, Identifiable, Hashable {
    let id: String
    let thumb: URL
    let display: URL
    let width: Int?
    let height: Int?
}

struct Ticket: Decodable { let mediaId: String; let original: URL; let display: URL; let thumb: URL }

enum APIError: LocalizedError {
    case server(String), unauthorized
    var errorDescription: String? {
        switch self {
        case .server(let m): return m
        case .unauthorized: return "Este iPad ya no está autorizado. Pide un nuevo código."
        }
    }
}

struct API {
    let token: String?

    private func request(_ path: String, method: String = "GET", body: [String: Any]? = nil) async throws -> Data {
        var req = URLRequest(url: Config.baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.timeoutInterval = 30
        if let token { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let (data, resp) = try await URLSession.shared.data(for: req)
        let status = (resp as? HTTPURLResponse)?.statusCode ?? 0
        if status == 401 && token != nil { throw APIError.unauthorized }
        guard (200..<300).contains(status) else {
            let msg = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? String
            throw APIError.server(msg ?? "Error de conexión (\(status)).")
        }
        return data
    }

    struct Pairing: Decodable { let token: String; let device: String; struct Ev: Decodable { let slug: String; let name: String }; let event: Ev }
    func pair(code: String) async throws -> Pairing {
        try JSONDecoder().decode(Pairing.self, from: await request("api/estacion/vincular", method: "POST", body: ["code": code]))
    }

    struct PhotoList: Decodable { struct Ev: Decodable { let name: String; let hosts: String }; let event: Ev; let items: [Photo] }
    func photos() async throws -> PhotoList {
        try JSONDecoder().decode(PhotoList.self, from: await request("api/estacion/fotos"))
    }

    /// Sube una versión intervenida: original JPEG + versión 2048 px + miniatura, y la enlaza a su foto original.
    func upload(jpeg: Data, originalId: String, destinations: [String], message: String?) async throws {
        struct T: Decodable { let ticket: Ticket }
        let t = try JSONDecoder().decode(T.self, from: await request("api/estacion/uploads", method: "POST", body: ["originalId": originalId, "size": jpeg.count])).ticket
        let image = UIImage(data: jpeg)
        try await put(t.original, jpeg)
        if let image {
            if let d = image.resized(maxSide: 2048).jpegData(compressionQuality: 0.86) { try await put(t.display, d) }
            if let s = image.resized(maxSide: 480).jpegData(compressionQuality: 0.8) { try await put(t.thumb, s) }
        }
        var body: [String: Any] = ["mediaId": t.mediaId, "originalId": originalId, "destinations": destinations]
        if let message, !message.isEmpty { body["message"] = message }
        if let image { body["width"] = Int(image.size.width * image.scale); body["height"] = Int(image.size.height * image.scale) }
        _ = try await request("api/estacion/complete", method: "POST", body: body)
    }

    private func put(_ url: URL, _ data: Data) async throws {
        var req = URLRequest(url: url)
        req.httpMethod = "PUT"
        req.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        let (_, resp) = try await URLSession.shared.upload(for: req, from: data)
        guard let h = resp as? HTTPURLResponse, (200..<300).contains(h.statusCode) else { throw APIError.server("No se pudo subir la imagen.") }
    }
}

extension UIImage {
    func resized(maxSide: CGFloat) -> UIImage {
        let px = CGSize(width: size.width * scale, height: size.height * scale)
        let k = min(1, maxSide / max(px.width, px.height))
        let target = CGSize(width: floor(px.width * k), height: floor(px.height * k))
        let format = UIGraphicsImageRendererFormat.default(); format.scale = 1
        return UIGraphicsImageRenderer(size: target, format: format).image { _ in draw(in: CGRect(origin: .zero, size: target)) }
    }
}
