import "./globals.css";

export const metadata = {
  title: "Doux Bebé - Sistema de Gestión",
  description: "Plataforma de gestión para Corporación Doux Bebé",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-gray-50">{children}</body>
    </html>
  );
}
