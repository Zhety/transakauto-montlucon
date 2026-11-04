// Aperçu des pages d'un PDF en PNG (macOS, PDFKit), pour vérifier une plaquette
// sans l'ouvrir :  swift scripts/pdf2png.swift plaquette.pdf dossier-de-sortie [échelle]
import AppKit
import Foundation
import PDFKit

let args = CommandLine.arguments
guard args.count >= 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
    print("usage: swift scripts/pdf2png.swift <fichier.pdf> <dossier de sortie> [échelle, 1.4 par défaut]")
    exit(1)
}
let outDir = args[2]
let scale = CGFloat(args.count > 3 ? Double(args[3]) ?? 1.4 : 1.4)
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
print("pages:", doc.pageCount)

for index in 0..<doc.pageCount {
    guard let page = doc.page(at: index) else { continue }
    let bounds = page.bounds(for: .mediaBox)
    let size = NSSize(width: bounds.width * scale, height: bounds.height * scale)
    let image = NSImage(size: size)
    image.lockFocus()
    NSColor.white.setFill()
    NSRect(origin: .zero, size: size).fill()
    if let context = NSGraphicsContext.current?.cgContext {
        context.scaleBy(x: scale, y: scale)
        page.draw(with: .mediaBox, to: context)
    }
    image.unlockFocus()
    if let tiff = image.tiffRepresentation,
       let rep = NSBitmapImageRep(data: tiff),
       let png = rep.representation(using: .png, properties: [:]) {
        let path = "\(outDir)/page\(String(format: "%02d", index + 1)).png"
        try? png.write(to: URL(fileURLWithPath: path))
        print("wrote", path)
    }
}
