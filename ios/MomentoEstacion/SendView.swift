import SwiftUI

struct SendView: View {
    let photo: Photo
    let jpeg: Data
    let onBack: () -> Void
    let onSend: ([String], String?) -> Void
    @State private var screen = true
    @State private var album = true
    @State private var message = ""

    var body: some View {
        HStack(spacing: 48) {
            if let img = UIImage(data: jpeg) {
                Image(uiImage: img).resizable().scaledToFit().clipShape(RoundedRectangle(cornerRadius: 8)).frame(maxWidth: .infinity)
            }
            VStack(alignment: .leading, spacing: 20) {
                Text("¿Dónde la compartimos?").font(Theme.serif(44))
                Toggle(isOn: $screen) { VStack(alignment: .leading) { Text("Pantalla del evento").font(.title3); Text("Se proyecta durante la celebración").foregroundStyle(Theme.piedra) } }
                Toggle(isOn: $album) { VStack(alignment: .leading) { Text("Álbum compartido").font(.title3); Text("Los invitados podrán verla y descargarla").foregroundStyle(Theme.piedra) } }
                if screen {
                    TextField("Mensaje para la pantalla (opcional)", text: $message, axis: .vertical)
                        .lineLimit(3).padding(16).background(Theme.blanco).clipShape(RoundedRectangle(cornerRadius: 12))
                        .onChange(of: message) { _, v in if v.count > 280 { message = String(v.prefix(280)) } }
                }
                Text("Elige al menos un destino. Los anfitriones reciben tu creación en ambos casos.").font(.footnote).foregroundStyle(Theme.piedra)
                HStack {
                    Button("Volver a editar", action: onBack).tint(Theme.carbon)
                    Spacer()
                    Button {
                        onSend([screen ? "screen" : nil, album ? "album" : nil].compactMap { $0 }, screen ? message : nil)
                    } label: { Text("Enviar").font(.title3.weight(.semibold)).frame(width: 180, height: 56) }
                    .buttonStyle(.borderedProminent).tint(Theme.carbon).clipShape(Capsule())
                    .disabled(!screen && !album)
                }
            }
            .toggleStyle(.switch).tint(Theme.champagne)
            .frame(maxWidth: 460)
        }
        .padding(48)
    }
}
