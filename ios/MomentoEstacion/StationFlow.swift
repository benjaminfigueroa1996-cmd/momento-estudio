import SwiftUI

/// Flujo de un invitado: elegir foto → intervenir → elegir destinos → listo → vuelve al inicio.
struct StationFlow: View {
    @EnvironmentObject var store: StationStore
    @State private var selected: Photo?
    @State private var result: Data?
    @State private var done = false
    @State private var lastTouch = Date()
    @State private var showOperator = false

    var body: some View {
        ZStack {
            if done {
                DoneView { reset() }
            } else if let selected, let result {
                SendView(photo: selected, jpeg: result, onBack: { self.result = nil }) { dest, msg in
                    Task { await store.submit(jpeg: result, originalId: selected.id, destinations: dest, message: msg) }
                    done = true
                }
            } else if let selected {
                EditorView(photo: selected, onCancel: { self.selected = nil }) { jpeg in result = jpeg }
            } else {
                PickerView(onOperator: { showOperator = true }) { selected = $0 }
            }
        }
        .contentShape(Rectangle())
        .simultaneousGesture(TapGesture().onEnded { lastTouch = Date() })
        .simultaneousGesture(DragGesture(minimumDistance: 0).onChanged { _ in lastTouch = Date() })
        .onReceive(Timer.publish(every: 5, on: .main, in: .common).autoconnect()) { now in
            // modo kiosco: sin uso por un rato, vuelve al estado inicial para el siguiente invitado
            if selected != nil && now.timeIntervalSince(lastTouch) > Config.idleResetSeconds { reset() }
        }
        .sheet(isPresented: $showOperator) { OperatorView() }
        .task { await store.refresh() }
    }

    private func reset() {
        selected = nil; result = nil; done = false; lastTouch = Date()
        Task { await store.refresh() }
    }
}

struct PickerView: View {
    @EnvironmentObject var store: StationStore
    let onOperator: () -> Void
    let onPick: (Photo) -> Void
    private let cols = [GridItem(.adaptive(minimum: 220), spacing: 8)]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .lastTextBaseline) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(store.eventName).font(Theme.serif(52))
                        .onLongPressGesture(minimumDuration: 3, perform: onOperator) // acceso oculto del operador
                    Text("Elige una foto y déjale una dedicatoria escrita a mano").font(.title3).foregroundStyle(Theme.carbon.opacity(0.7))
                }
                Spacer()
                if store.pendingCount > 0 { Text("\(store.pendingCount) por enviar").font(.footnote).foregroundStyle(Theme.piedra) }
            }
            .padding(.horizontal, 40).padding(.top, 40).padding(.bottom, 24)

            if store.photos.isEmpty {
                Text(store.error ?? "Aún no hay fotos aprobadas. En cuanto los invitados compartan, aparecerán aquí.")
                    .font(.title3).foregroundStyle(Theme.piedra).padding(40)
                Spacer()
            } else {
                ScrollView {
                    LazyVGrid(columns: cols, spacing: 8) {
                        ForEach(store.photos) { p in
                            Button { onPick(p) } label: {
                                AsyncImage(url: p.thumb) { img in img.resizable().scaledToFill() } placeholder: { Theme.blanco }
                                    .frame(minHeight: 220).clipped()
                            }
                            .aspectRatio(1, contentMode: .fit).clipShape(RoundedRectangle(cornerRadius: 6))
                        }
                    }
                    .padding(.horizontal, 40).padding(.bottom, 40)
                }
                .refreshable { await store.refresh() }
            }
        }
    }
}

struct DoneView: View {
    let onNext: () -> Void
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "checkmark.circle").font(.system(size: 64, weight: .thin)).foregroundStyle(Theme.champagne)
            Text("Gracias por tu dedicatoria").font(Theme.serif(52))
            Text("Tu creación quedó guardada para los anfitriones.").font(.title3).foregroundStyle(Theme.carbon.opacity(0.7))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .task { try? await Task.sleep(for: .seconds(6)); onNext() }
        .onTapGesture(perform: onNext)
    }
}

struct OperatorView: View {
    @EnvironmentObject var store: StationStore
    @Environment(\.dismiss) var dismiss
    @State private var pin = ""
    var body: some View {
        VStack(spacing: 20) {
            Text("Operador").font(Theme.serif(36))
            SecureField("PIN", text: $pin).keyboardType(.numberPad).font(.title).frame(width: 200).textFieldStyle(.roundedBorder)
            if pin == Config.operatorPIN {
                Text("Pendientes de envío: \(store.pendingCount)")
                Button("Reintentar envíos ahora") { Task { await store.flushQueue() } }
                Button("Actualizar fotos") { Task { await store.refresh() } }
                Button("Desvincular este iPad", role: .destructive) { store.unpair(); dismiss() }
            }
            Button("Cerrar") { dismiss() }
        }
        .padding(40)
    }
}
