import "./globals.css";

export const metadata = {
    title: "Hero Section",
    description: "Navbar and hero section built with Next.js"
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
