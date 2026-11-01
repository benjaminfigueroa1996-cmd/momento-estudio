import SwiftUI

@main
struct MomentoEstacionApp: App {
    @StateObject private var store = StationStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .preferredColorScheme(.light)
                .statusBarHidden(true)
                .persistentSystemOverlays(.hidden)
                .onAppear { UIApplication.shared.isIdleTimerDisabled = true } // la pantalla no se apaga durante el evento
        }
    }
}

struct RootView: View {
    @EnvironmentObject var store: StationStore
    var body: some View {
        Group {
            if store.token == nil { PairView() } else { StationFlow() }
        }
        .background(Theme.marfil.ignoresSafeArea())
    }
}

enum Theme {
    static let carbon = Color(red: 0x24/255, green: 0x23/255, blue: 0x21/255)
    static let marfil = Color(red: 0xF7/255, green: 0xF3/255, blue: 0xED/255)
    static let blanco = Color(red: 0xFF/255, green: 0xFE/255, blue: 0xFC/255)
    static let champagne = Color(red: 0xB7/255, green: 0x9A/255, blue: 0x70/255)
    static let piedra = Color(red: 0x8C/255, green: 0x87/255, blue: 0x80/255)
    static func serif(_ size: CGFloat) -> Font { .system(size: size, weight: .regular, design: .serif) }
}
