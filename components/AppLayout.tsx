import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  tier?: string
}

export default function AppLayout({ children, tier = 'free' }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <Sidebar tier={tier} />
      <main className="flex-1 ml-56">
        <div className="max-w-5xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  )
}
