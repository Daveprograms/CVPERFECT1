export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In the Next.js App Router, only `app/layout.tsx` should render <html>/<body>
  // and import global CSS. This layout is a segment wrapper only.
  return <div className="min-h-screen">{children}</div>
} 