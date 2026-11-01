import Foundation

enum Config {
    /// Dirección de la plataforma. Cambiar antes de compilar para producción.
    static let baseURL = URL(string: "https://momentoestudio.cl")!
    /// Segundos sin uso antes de volver a la pantalla inicial.
    static let idleResetSeconds: TimeInterval = 90
    /// PIN del operador para salir del modo evento (cámbialo antes de cada temporada).
    static let operatorPIN = "2580"
}
