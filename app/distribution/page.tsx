import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DistributionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('tier').eq('id', user.id).single()

  return (
    <AppLayout tier={profile?.tier}>
      <div className="mb-8">
        <h1 className="text-4xl" style={{ fontFamily: 'Fraunces, serif', letterSpacing: '-0.03em' }}>Music Distribution</h1>
        <p className="mt-1" style={{ color: '#8A8786' }}>Submit your music to all major streaming platforms.</p>
      </div>

      <div className="card max-w-xl">
        <h2 className="text-xl mb-4">New Submission</h2>
        <div className="space-y-4">
          <div>
            <label className="label block mb-1.5">Release Title</label>
            <input className="input" placeholder="My New Album" />
          </div>
          <div>
            <label className="label block mb-1.5">Artist Name</label>
            <input className="input" placeholder="Your artist name" />
          </div>
          <div>
            <label className="label block mb-1.5">Release Date</label>
            <input type="date" className="input" />
          </div>
          <div>
            <label className="label block mb-1.5">Genre</label>
            <select className="input">
              <option value="">Select genre</option>
              {['Hip-Hop', 'R&B', 'Pop', 'Country', 'EDM', 'Latin', 'Indie', 'Electronic', 'Rock', 'Other'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label block mb-1.5">Audio Files</label>
            <div
              className="rounded-lg flex flex-col items-center justify-center py-10 text-center cursor-pointer"
              style={{ border: '2px dashed #E2DED8', backgroundColor: '#F2EFEA' }}
            >
              <p className="text-sm font-medium mb-1">Drop audio files here</p>
              <p className="text-xs" style={{ color: '#8A8786' }}>WAV or FLAC, 44.1kHz, 16-bit minimum</p>
            </div>
          </div>
          <button className="btn-primary">Submit for Distribution</button>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-md" style={{ backgroundColor: '#F2EFEA', border: '1px solid #E2DED8' }}>
        <p className="text-sm" style={{ color: '#8A8786' }}>Distribution submissions are reviewed within 2–3 business days.</p>
      </div>

      <div className="card mt-8">
        <p className="label mb-4">Submission History</p>
        <p className="text-sm py-6 text-center" style={{ color: '#8A8786' }}>No submissions yet.</p>
      </div>
    </AppLayout>
  )
}
