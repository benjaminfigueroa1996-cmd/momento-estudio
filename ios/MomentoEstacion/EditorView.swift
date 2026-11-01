import SwiftUI
import PencilKit

struct TextItem: Identifiable { let id = UUID(); var text: String; var color: Color; var pos: CGPoint /* 0…1 */; var size: CGFloat /* relativo al ancho */ }

/// Editor: la foto a pantalla completa, PencilKit encima y textos movibles.
/// La foto original nunca se modifica: se exporta una imagen nueva.
struct EditorView: View {
    let photo: Photo
    let onCancel: () -> Void
    let onSave: (Data) -> Void

    @State private var image: UIImage?
    @State private var canvas = PKCanvasView()
    @State private var toolPicker = PKToolPicker()
    @State private var texts: [TextItem] = []
    @State private var editingText = ""
    @State private var showTextField = false
    @State private var canvasSize: CGSize = .zero

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 28) {
                Button("Cancelar", action: onCancel)
                Spacer()
                Button { canvas.undoManager?.undo() } label: { Image(systemName: "arrow.uturn.backward") }.accessibilityLabel("Deshacer")
                Button { canvas.undoManager?.redo() } label: { Image(systemName: "arrow.uturn.forward") }.accessibilityLabel("Rehacer")
                Button { showTextField = true } label: { Image(systemName: "textformat") }.accessibilityLabel("Agregar texto")
                Button("Limpiar") { canvas.drawing = PKDrawing(); texts = [] }
                Spacer()
                Button { save() } label: { Text("Guardar").fontWeight(.semibold).padding(.horizontal, 24).padding(.vertical, 12).background(Theme.carbon).foregroundStyle(Theme.blanco).clipShape(Capsule()) }
                    .disabled(image == nil)
            }
            .font(.title3).tint(Theme.carbon).padding(.horizontal, 28).padding(.vertical, 16)

            GeometryReader { geo in
                ZStack {
                    if let image {
                        let fitted = fit(image.size, in: geo.size)
                        ZStack {
                            Image(uiImage: image).resizable().frame(width: fitted.width, height: fitted.height)
                            CanvasView(canvas: $canvas, toolPicker: toolPicker).frame(width: fitted.width, height: fitted.height)
                            ForEach($texts) { $t in
                                Text(t.text).font(.system(size: t.size * fitted.width, design: .serif)).foregroundStyle(t.color)
                                    .position(x: t.pos.x * fitted.width, y: t.pos.y * fitted.height)
                                    .gesture(DragGesture().onChanged { v in
                                        t.pos = CGPoint(x: min(max(v.location.x / fitted.width, 0), 1), y: min(max(v.location.y / fitted.height, 0), 1))
                                    })
                            }
                        }
                        .frame(width: fitted.width, height: fitted.height)
                        .onAppear { canvasSize = fitted }
                        .onChange(of: geo.size) { _, s in canvasSize = fit(image.size, in: s) }
                    } else {
                        ProgressView("Cargando foto…")
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .padding(.bottom, 90) // espacio para la paleta de herramientas de PencilKit (colores, grosores, borrador)
        }
        .task { await load() }
        .alert("Agregar texto", isPresented: $showTextField) {
            TextField("Tu dedicatoria", text: $editingText)
            Button("Agregar") {
                if !editingText.isEmpty { texts.append(TextItem(text: editingText, color: Theme.blanco, pos: CGPoint(x: 0.5, y: 0.85), size: 0.05)) }
                editingText = ""
            }
            Button("Cancelar", role: .cancel) { editingText = "" }
        }
    }

    private func fit(_ s: CGSize, in box: CGSize) -> CGSize {
        let k = min(box.width / s.width, box.height / s.height)
        return CGSize(width: s.width * k, height: s.height * k)
    }

    private func load() async {
        guard let (data, _) = try? await URLSession.shared.data(from: photo.display), let img = UIImage(data: data) else { return }
        image = img
    }

    /// Exporta a la resolución de la foto (no a la de la pantalla).
    private func save() {
        guard let image, canvasSize.width > 0 else { return }
        let px = CGSize(width: image.size.width * image.scale, height: image.size.height * image.scale)
        let k = px.width / canvasSize.width
        let format = UIGraphicsImageRendererFormat.default(); format.scale = 1
        let out = UIGraphicsImageRenderer(size: px, format: format).image { _ in
            let rect = CGRect(origin: .zero, size: px)
            image.draw(in: rect)
            canvas.drawing.image(from: CGRect(origin: .zero, size: canvasSize), scale: k).draw(in: rect)
            for t in texts {
                let font = UIFont(descriptor: UIFont.systemFont(ofSize: t.size * px.width).fontDescriptor.withDesign(.serif) ?? UIFont.systemFont(ofSize: 10).fontDescriptor, size: t.size * px.width)
                let str = NSAttributedString(string: t.text, attributes: [.font: font, .foregroundColor: UIColor(t.color)])
                let sz = str.size()
                str.draw(at: CGPoint(x: t.pos.x * px.width - sz.width / 2, y: t.pos.y * px.height - sz.height / 2))
            }
        }
        if let jpeg = out.jpegData(compressionQuality: 0.92) { onSave(jpeg) }
    }
}
