import Foundation
import Security
import Network

@MainActor
final class StationStore: ObservableObject {
    @Published var token: String? = Keychain.read()
    @Published var eventName = ""
    @Published var hosts = ""
    @Published var photos: [Photo] = []
    @Published var error: String?
    @Published var pendingCount = 0

    let queue = OfflineQueue()
    private let monitor = NWPathMonitor()

    init() {
        pendingCount = queue.count
        monitor.pathUpdateHandler = { [weak self] path in
            if path.status == .satisfied { Task { await self?.flushQueue() } }
        }
        monitor.start(queue: .global(qos: .utility))
        // reintento periódico por si el wifi del salón está inestable
        Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in Task { await self?.flushQueue() } }
    }

    var api: API { API(token: token) }

    func pair(code: String) async {
        do {
            let p = try await API(token: nil).pair(code: code.uppercased())
            Keychain.save(p.token)
            token = p.token
            eventName = p.event.name
            await refresh()
        } catch { self.error = error.localizedDescription }
    }

    func refresh() async {
        do {
            let list = try await api.photos()
            eventName = list.event.name
            hosts = list.event.hosts
            photos = list.items
            error = nil
        } catch APIError.unauthorized { unpair() }
        catch { self.error = "Sin conexión. Las fotos se actualizarán al volver internet." }
    }

    /// Guarda primero en el iPad y luego intenta subir: nunca se pierde una creación.
    func submit(jpeg: Data, originalId: String, destinations: [String], message: String?) async {
        let item = queue.enqueue(jpeg: jpeg, originalId: originalId, destinations: destinations, message: message)
        pendingCount = queue.count
        await send(item)
    }

    func flushQueue() async {
        for item in queue.all() { await send(item) }
    }

    private func send(_ item: OfflineQueue.Item) async {
        guard let data = queue.data(for: item) else { return }
        do {
            try await api.upload(jpeg: data, originalId: item.originalId, destinations: item.destinations, message: item.message)
            queue.remove(item)
        } catch APIError.unauthorized { unpair() }
        catch { /* queda en cola; se reintenta */ }
        pendingCount = queue.count
    }

    func unpair() {
        Keychain.delete()
        token = nil
        photos = []
    }
}

enum Keychain {
    private static let account = "momento-estacion-token"
    static func save(_ value: String) {
        delete()
        SecItemAdd([kSecClass: kSecClassGenericPassword, kSecAttrAccount: account, kSecValueData: Data(value.utf8),
                    kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly] as CFDictionary, nil)
    }
    static func read() -> String? {
        var out: CFTypeRef?
        let q = [kSecClass: kSecClassGenericPassword, kSecAttrAccount: account, kSecReturnData: true, kSecMatchLimit: kSecMatchLimitOne] as CFDictionary
        guard SecItemCopyMatching(q, &out) == errSecSuccess, let d = out as? Data else { return nil }
        return String(data: d, encoding: .utf8)
    }
    static func delete() {
        SecItemDelete([kSecClass: kSecClassGenericPassword, kSecAttrAccount: account] as CFDictionary)
    }
}
