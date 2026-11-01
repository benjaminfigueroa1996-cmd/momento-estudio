import Foundation

/// Cola persistente en disco: cada creación se guarda antes de subirla.
final class OfflineQueue {
    struct Item: Codable, Identifiable { let id: UUID; let originalId: String; let destinations: [String]; let message: String?; let created: Date }

    private let dir: URL = {
        let d = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("pendientes", isDirectory: true)
        try? FileManager.default.createDirectory(at: d, withIntermediateDirectories: true)
        return d
    }()
    private let lock = NSLock()

    var count: Int { all().count }

    func enqueue(jpeg: Data, originalId: String, destinations: [String], message: String?) -> Item {
        let item = Item(id: UUID(), originalId: originalId, destinations: destinations, message: message, created: Date())
        lock.lock(); defer { lock.unlock() }
        try? jpeg.write(to: dir.appendingPathComponent("\(item.id).jpg"), options: .atomic)
        try? JSONEncoder().encode(item).write(to: dir.appendingPathComponent("\(item.id).json"), options: .atomic)
        return item
    }

    func all() -> [Item] {
        lock.lock(); defer { lock.unlock() }
        let files = (try? FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)) ?? []
        return files.filter { $0.pathExtension == "json" }
            .compactMap { try? JSONDecoder().decode(Item.self, from: Data(contentsOf: $0)) }
            .sorted { $0.created < $1.created }
    }

    func data(for item: Item) -> Data? { try? Data(contentsOf: dir.appendingPathComponent("\(item.id).jpg")) }

    func remove(_ item: Item) {
        lock.lock(); defer { lock.unlock() }
        try? FileManager.default.removeItem(at: dir.appendingPathComponent("\(item.id).jpg"))
        try? FileManager.default.removeItem(at: dir.appendingPathComponent("\(item.id).json"))
    }
}
