import SwiftUI

struct PairView: View {
    @EnvironmentObject var store: StationStore
    @State private var code = ""
    @State private var busy = false

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Momento Estudio").font(.footnote).foregroundStyle(Theme.piedra)
            Text("Vincular este iPad").font(Theme.serif(56))
            Text("Escribe el código de 8 caracteres que aparece en el panel de administración, en Estaciones iPad.")
                .font(.title3).foregroundStyle(Theme.carbon.opacity(0.75)).frame(maxWidth: 560, alignment: .leading)
            TextField("XXXXXXXX", text: $code)
                .font(.system(size: 40, weight: .medium, design: .monospaced))
                .textInputAutocapitalization(.characters).autocorrectionDisabled()
                .padding(20).background(Theme.blanco).clipShape(RoundedRectangle(cornerRadius: 16))
                .frame(maxWidth: 420)
            if let e = store.error { Text(e).foregroundStyle(.red) }
            Button { Task { busy = true; await store.pair(code: code); busy = false } } label: {
                Text(busy ? "Vinculando…" : "Vincular").font(.title3.weight(.medium)).frame(width: 260, height: 60)
            }
            .buttonStyle(.borderedProminent).tint(Theme.carbon).clipShape(Capsule())
            .disabled(code.count != 8 || busy)
        }
        .padding(64).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}
