import SwiftUI
import PencilKit

/// Lienzo PencilKit: presión, inclinación y baja latencia del Apple Pencil.
/// drawingPolicy = .pencilOnly → la palma y los dedos no dibujan (rechazo de palma).
struct CanvasView: UIViewRepresentable {
    @Binding var canvas: PKCanvasView
    let toolPicker: PKToolPicker

    func makeUIView(context: Context) -> PKCanvasView {
        canvas.drawingPolicy = .pencilOnly
        canvas.backgroundColor = .clear
        canvas.isOpaque = false
        canvas.tool = PKInkingTool(.pen, color: UIColor(red: 0.14, green: 0.14, blue: 0.13, alpha: 1), width: 6)
        toolPicker.addObserver(canvas)
        toolPicker.setVisible(true, forFirstResponder: canvas)
        DispatchQueue.main.async { canvas.becomeFirstResponder() }
        return canvas
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {}
}
