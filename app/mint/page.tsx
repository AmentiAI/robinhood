'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'

export default function MintPage() {
  const [mounted, setMounted] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0c] overflow-hidden">
      <PageHeader
        title="Creator mint"
        subtitle="Pass holders get 50% off HoodGFX credits — mint coming soon"
        action={
          <a
            href="https://x.com/hoodgfx"
            target="_blank"
            rel="noopener noreferrer"
            className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
          >
            Follow on X
          </a>
        }
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section
          className={`hg-rise rounded-2xl border border-white/[0.1] bg-[#131318] p-5 sm:p-7 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-4 rounded-full border border-[#2DE2FF]/30 bg-[#2DE2FF]/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2DE2FF] animate-pulse" />
                <span className="text-[#2DE2FF] text-[11px] font-bold uppercase tracking-[0.16em]">
                  Mint coming soon
                </span>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#2DE2FF]/20 bg-gradient-to-br from-[#2DE2FF]/10 to-[#FF2BD6]/10 p-5 sm:p-6 mb-5">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, #2DE2FF, #A855F7, #FF2BD6, transparent)',
                  }}
                />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2DE2FF] mb-2">
                  Creator pass benefit
                </p>
                <p className="text-lg sm:text-xl font-bold text-white leading-snug">
                  <span className="hg-gradient-text">222 passes</span>
                  {' — owning a creator pass gets you '}
                  <span className="text-[#2DE2FF]">50% off</span>
                  {' HoodGFX credits'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="hg-btn-glow inline-flex h-11 px-6 items-center justify-center rounded-full border border-white/15 text-zinc-100 text-sm font-semibold hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-all"
                >
                  Preview platform
                </button>
                <a
                  href="https://x.com/hoodgfx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hg-btn-glow inline-flex h-11 px-6 items-center justify-center rounded-full bg-gradient-to-r from-[#2DE2FF] via-[#A855F7] to-[#FF2BD6] text-[#0a0a0c] text-sm font-bold"
                >
                  Follow on X
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'Accurate', label: 'AI creation', desc: 'Minimal credit burns' },
                { value: 'Instant', label: 'Speed', desc: 'Minutes not days' },
                { value: 'Premium', label: 'Quality', desc: 'Super high quality' },
                { value: '222', label: 'Limited', desc: 'Exclusive passes' },
              ].map((stat, idx) => (
                <div
                  key={stat.label}
                  className="hg-card hg-rise rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-4"
                  style={{ animationDelay: `${0.06 + idx * 0.05}s` }}
                >
                  <div className="text-xl font-bold text-[#2DE2FF] mb-1">{stat.value}</div>
                  <p className="text-sm font-semibold text-white mb-0.5">{stat.label}</p>
                  <p className="text-xs text-zinc-500">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-3">
          {[
            {
              title: 'Pass holders 50% off credits',
              desc: 'Permanent savings',
            },
            {
              title: 'Limited edition',
              desc: 'Only 222 passes exist',
            },
            {
              title: 'Priority access',
              desc: 'Early features & updates',
            },
          ].map((feature, idx) => (
            <div
              key={feature.title}
              className="hg-card hg-rise rounded-2xl border border-white/[0.1] bg-[#131318] p-5"
              style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
            >
              <div className="w-9 h-9 rounded-xl bg-[#2DE2FF]/15 border border-[#2DE2FF]/25 flex items-center justify-center mb-3">
                <span className="text-[#2DE2FF] text-sm font-bold">{idx + 1}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-xs text-zinc-500">{feature.desc}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { title: 'Smart generation', desc: 'AI vision' },
            { title: 'Custom styles', desc: 'Many styles' },
            { title: 'Lazy mode', desc: 'AI auto-creates layers & traits' },
            { title: 'Advanced settings', desc: 'Full control' },
          ].map((tech, idx) => (
            <div
              key={tech.title}
              className="hg-card hg-rise rounded-2xl border border-white/[0.1] bg-[#131318] p-4 text-center"
              style={{ animationDelay: `${0.16 + idx * 0.04}s` }}
            >
              <h3 className="text-sm font-bold text-white mb-1">{tech.title}</h3>
              <p className="text-xs text-zinc-500">{tech.desc}</p>
            </div>
          ))}
        </section>

        <section className="hg-rise hg-rise-delay-3 rounded-2xl border border-white/[0.1] bg-[#131318] p-5 sm:p-6">
          <div className="text-center mb-5">
            <h2 className="text-lg font-semibold text-white mb-1">Proudly partnered with</h2>
            <p className="text-xs text-zinc-500">Leading innovators in the Ordinals ecosystem</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {[
              { name: 'Ordzaar', desc: 'Premium Ordinals platform', logo: '/sponsors/ordzaar.png' },
              { name: 'Satgo', desc: 'Bitcoin ecosystem leader', logo: '/sponsors/satgo.png' },
              { name: 'Gamma', desc: 'Next-gen ordinal solutions', logo: '/sponsors/gama.png' },
            ].map((sponsor) => (
              <div
                key={sponsor.name}
                className="hg-card rounded-2xl border border-white/[0.08] bg-[#0c0c10] px-5 py-4 text-center"
              >
                <div className="mb-3 h-14 flex items-center justify-center">
                  {sponsor.name === 'Gamma' ? (
                    <img
                      src={sponsor.logo}
                      alt={`${sponsor.name} logo`}
                      className="object-contain max-h-14 max-w-[140px]"
                    />
                  ) : (
                    <Image
                      src={sponsor.logo}
                      alt={`${sponsor.name} logo`}
                      width={140}
                      height={56}
                      className="object-contain opacity-90"
                      style={{ maxHeight: '56px', maxWidth: '140px' }}
                      unoptimized
                    />
                  )}
                </div>
                <div className="text-base font-bold text-white mb-0.5">{sponsor.name}</div>
                <p className="text-xs text-zinc-500">{sponsor.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="py-4 text-center text-zinc-600 text-xs">
          © {new Date().getFullYear()} HoodGFX. All rights reserved.
        </footer>
      </div>

      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative bg-[#131318] border border-white/[0.1] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
              <h2 className="text-lg font-bold text-white">Platform preview</h2>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-2 rounded-full hover:bg-white/[0.06] transition-colors text-zinc-400 hover:text-white"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/3lqgSfQt-EU"
                title="Platform Preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
