'use client'

import React from 'react'

interface CollectionSettingsStepProps {
  collectionDescription: string
  setCollectionDescription: (value: string) => void
  bannerUrl: string
  setBannerUrl: (value: string) => void
  mobileUrl: string
  setMobileUrl: (value: string) => void
  audioUrl: string
  setAudioUrl: (value: string) => void
  videoUrl: string
  setVideoUrl: (value: string) => void
  twitterUrl: string
  setTwitterUrl: (value: string) => void
  discordUrl: string
  setDiscordUrl: (value: string) => void
  telegramUrl: string
  setTelegramUrl: (value: string) => void
  websiteUrl: string
  setWebsiteUrl: (value: string) => void
  creatorRoyaltyWallet: string
  setCreatorRoyaltyWallet: (value: string) => void
  extendLastPhase: boolean
  setExtendLastPhase: (value: boolean) => void
  capSupply: number | null
  setCapSupply: (value: number | null) => void
  totalSupply: number
  mintType: 'hidden' | 'choices' | 'agent_only' | 'agent_and_human'
  setMintType: (value: 'hidden' | 'choices' | 'agent_only' | 'agent_and_human') => void
  uploadingBanner: boolean
  uploadingMobile: boolean
  uploadingAudio: boolean
  bannerFileName: string
  mobileFileName: string
  audioFileName: string
  onUploadMedia: (kind: 'banner' | 'mobile' | 'audio', file: File) => void
  onOpenPromoModal: (mode: 'banner' | 'mobile') => void
  onSave: () => void
  saving: boolean
}

const inputCls =
  'w-full px-4 py-3 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none focus:ring-2 focus:ring-[#2DE2FF]/20'

const ghostBtnCls =
  'inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:text-white transition-colors disabled:opacity-50'

export function CollectionSettingsStep({
  collectionDescription,
  setCollectionDescription,
  bannerUrl,
  setBannerUrl,
  mobileUrl,
  setMobileUrl,
  audioUrl,
  setAudioUrl,
  videoUrl,
  setVideoUrl,
  twitterUrl,
  setTwitterUrl,
  discordUrl,
  setDiscordUrl,
  telegramUrl,
  setTelegramUrl,
  websiteUrl,
  setWebsiteUrl,
  creatorRoyaltyWallet,
  setCreatorRoyaltyWallet,
  extendLastPhase,
  setExtendLastPhase,
  capSupply,
  setCapSupply,
  totalSupply,
  mintType,
  setMintType,
  uploadingBanner,
  uploadingMobile,
  uploadingAudio,
  bannerFileName,
  mobileFileName,
  audioFileName,
  onUploadMedia,
  onOpenPromoModal,
  onSave,
  saving,
}: CollectionSettingsStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2DE2FF]/70 mb-1">
          Step 1
        </p>
        <h2 className="text-xl font-bold text-white">Collection settings</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Collection description</label>
          <textarea
            value={collectionDescription}
            onChange={(e) => setCollectionDescription(e.target.value)}
            rows={4}
            placeholder="Write a short description that appears on the launchpad..."
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Banner image *</label>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                id="bannerUpload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    onUploadMedia('banner', f)
                  }
                  e.currentTarget.value = ''
                }}
                disabled={uploadingBanner}
                className="hidden"
              />
              <label
                htmlFor="bannerUpload"
                className={`hg-btn-glow inline-flex h-10 px-5 items-center rounded-full text-sm font-bold cursor-pointer transition-colors ${
                  uploadingBanner
                    ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
                    : 'bg-[#2DE2FF] text-[#0a0a0c]'
                }`}
              >
                {uploadingBanner ? 'Uploading...' : 'Upload banner'}
              </label>
              <button
                type="button"
                onClick={() => onOpenPromoModal('banner')}
                disabled={uploadingBanner}
                className={ghostBtnCls}
              >
                Choose from history
              </button>
              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => setBannerUrl('')}
                  className="inline-flex h-10 px-4 items-center rounded-full text-sm font-semibold text-[#FF2BD6] hover:bg-[#FF2BD6]/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {bannerUrl && (
              <>
                <input type="text" value={bannerUrl} readOnly className={inputCls} />
                <div className="mt-1">
                  <img
                    src={bannerUrl}
                    alt="Banner preview"
                    className="h-20 rounded-xl border border-white/[0.1]"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Mobile / thumbnail image</label>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                id="mobileUpload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    onUploadMedia('mobile', f)
                  }
                  e.currentTarget.value = ''
                }}
                disabled={uploadingMobile}
                className="hidden"
              />
              <label
                htmlFor="mobileUpload"
                className={`inline-flex h-10 px-5 items-center rounded-full text-sm font-bold cursor-pointer transition-colors ${
                  uploadingMobile
                    ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
                    : 'bg-[#FF2BD6] text-[#0a0a0c] hover:opacity-90'
                }`}
              >
                {uploadingMobile ? 'Uploading...' : 'Upload thumbnail'}
              </label>
              <button
                type="button"
                onClick={() => onOpenPromoModal('mobile')}
                disabled={uploadingMobile}
                className={ghostBtnCls}
              >
                Choose from history
              </button>
              {mobileUrl && (
                <button
                  type="button"
                  onClick={() => setMobileUrl('')}
                  className="inline-flex h-10 px-4 items-center rounded-full text-sm font-semibold text-[#FF2BD6] hover:bg-[#FF2BD6]/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {mobileUrl && (
              <>
                <input type="text" value={mobileUrl} readOnly className={inputCls} />
                <div className="mt-1">
                  <img
                    src={mobileUrl}
                    alt="Mobile/Thumbnail preview"
                    className="h-20 w-20 object-cover rounded-xl border border-white/[0.1]"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Background music (MP3)</label>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                id="audioUpload"
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    onUploadMedia('audio', f)
                  }
                  e.currentTarget.value = ''
                }}
                disabled={uploadingAudio}
                className="hidden"
              />
              <label
                htmlFor="audioUpload"
                className={`inline-flex h-10 px-5 items-center rounded-full text-sm font-bold cursor-pointer transition-colors ${
                  uploadingAudio
                    ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
                    : 'bg-[#FF2BD6] text-[#0a0a0c] hover:opacity-90'
                }`}
              >
                {uploadingAudio ? 'Uploading...' : 'Upload audio'}
              </label>
              {audioUrl && (
                <button
                  type="button"
                  onClick={() => setAudioUrl('')}
                  className="inline-flex h-10 px-4 items-center rounded-full text-sm font-semibold text-[#FF2BD6] hover:bg-[#FF2BD6]/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {audioUrl && (
              <>
                <input type="text" value={audioUrl} readOnly className={inputCls} />
                <div className="mt-1">
                  <audio src={audioUrl} controls className="h-10 w-full max-w-md" />
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">YouTube video URL</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className={inputCls}
          />
        </div>

        <div className="border-t border-white/[0.06] pt-8 space-y-5">
          <h3 className="text-base font-semibold text-white">Social links</h3>
          <div className="grid gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Twitter / X URL</label>
              <input
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://twitter.com/yourhandle"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Discord URL</label>
              <input
                type="url"
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
                placeholder="https://discord.gg/yourinvite"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Telegram URL</label>
              <input
                type="url"
                value={telegramUrl}
                onChange={(e) => setTelegramUrl(e.target.value)}
                placeholder="https://t.me/yourchannel"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Creator payment wallet (EVM address) *
          </label>
          <p className="text-xs text-zinc-500 mb-2">
            Mint payments go to this address. Defaults to your connected wallet.
          </p>
          <input
            type="text"
            value={creatorRoyaltyWallet}
            onChange={(e) => setCreatorRoyaltyWallet(e.target.value)}
            placeholder="Your Robinhood Chain wallet (0x...)"
            className={`${inputCls} font-mono text-sm`}
          />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0c0c10] px-4 py-3">
          <input
            type="checkbox"
            id="extendLastPhase"
            checked={extendLastPhase}
            onChange={(e) => setExtendLastPhase(e.target.checked)}
            className="w-4 h-4 text-[#2DE2FF] bg-[#131318] border-white/[0.1] rounded focus:ring-[#2DE2FF]"
          />
          <label htmlFor="extendLastPhase" className="text-sm text-zinc-300">
            Extend last phase until mint out (ignore end time)
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Cap supply</label>
          <input
            type="number"
            value={capSupply !== null ? capSupply : ''}
            onChange={(e) => {
              const value = e.target.value === '' ? null : parseInt(e.target.value, 10)
              if (value === null || (value >= 0 && value <= totalSupply)) {
                setCapSupply(value)
              }
            }}
            min={0}
            max={totalSupply}
            placeholder={totalSupply.toString()}
            className={inputCls}
          />
          <p className="text-xs text-zinc-500 mt-2">
            Maximum number of mints allowed. Defaults to total supply ({totalSupply}).
            {capSupply !== null && capSupply < totalSupply && ` Minting will stop at ${capSupply} instead of ${totalSupply}.`}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-3">Mint type</label>
          <div className="space-y-3">
            {([
              ['hidden', '🎲 Mystery Mint', 'Default system — random NFT assignment when minting'],
              ['choices', '🎯 Choose Your NFT', 'Paginated browsing — users select specific NFTs to mint'],
              ['agent_only', '🤖 Agent Only', 'Only AI agents can mint via API — no manual mint button'],
              ['agent_and_human', '🤖+👤 Agent + Human', 'Both AI agents and humans can mint — agents use API, humans use the mint button'],
            ] as const).map(([value, title, desc]) => (
              <label
                key={value}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  mintType === value
                    ? 'border-[#2DE2FF]/40 bg-[#2DE2FF]/[0.06]'
                    : 'border-white/[0.08] bg-[#0c0c10] hover:border-white/[0.15]'
                }`}
              >
                <input
                  type="radio"
                  name="mintType"
                  value={value}
                  checked={mintType === value}
                  onChange={(e) => setMintType(e.target.value as typeof mintType)}
                  className="w-4 h-4 mt-0.5 text-[#2DE2FF] bg-[#131318] border-white/[0.1]"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{title}</div>
                  <div className="text-sm text-zinc-500 mt-0.5">{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-white/[0.06]">
        <button
          onClick={onSave}
          disabled={saving}
          className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save & continue'}
        </button>
      </div>
    </div>
  )
}
