'use client'

import { useState, useEffect, useMemo } from 'react'
import { useProfile } from '@/lib/profile/useProfile'
import { useWallet } from '@/lib/wallet/compatibility'
import Link from 'next/link'
import { BrandLoader } from '@/components/brand-loader'

export function ProfileManager() {
  const { isConnected, currentAddress } = useWallet()
  const { profile, loading, error, updateProfile } = useProfile()
  
  // Determine active wallet (Bitcoin only)
  const activeWalletAddress = useMemo(() => {
    return currentAddress
  }, [currentAddress])
  
  const activeWalletConnected = isConnected
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatarUrl: '',
    twitterUrl: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        twitterUrl: profile.twitterUrl || '',
      })
      setAvatarPreview(profile.avatarUrl || null)
      // Don't auto-enter edit mode when profile loads
      setIsEditing(false)
    } else if (activeWalletConnected && activeWalletAddress && !loading) {
      // Only reset form for new profile if we're not still loading
      // This prevents clearing the form while profile is being fetched
      setFormData({
        username: '',
        displayName: '',
        bio: '',
        avatarUrl: '',
        twitterUrl: '',
      })
      setAvatarPreview(null)
      setIsEditing(true)
    }
  }, [profile, activeWalletConnected, activeWalletAddress, loading])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeWalletAddress) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Image must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    setSaveError(null)

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)

      // Upload to blob storage
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('wallet_address', activeWalletAddress)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      
      // Update form data with the uploaded URL
      if (data.url) {
        setFormData(prev => ({ ...prev, avatarUrl: data.url }))
      } else {
        throw new Error('Upload succeeded but no URL returned')
      }
      
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl)
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      setSaveError(error.message || 'Failed to upload avatar')
      setAvatarPreview(formData.avatarUrl || null)
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('[ProfileManager] Form submitted manually by user')
    console.log('[ProfileManager] Form data:', formData)
    
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    if (!formData.username.trim()) {
      setSaveError('Username is required')
      setSaving(false)
      return
    }

    const success = await updateProfile({
      username: formData.username.trim(),
      displayName: formData.displayName?.trim() || undefined,
      bio: formData.bio?.trim() || undefined,
      avatarUrl: formData.avatarUrl?.trim() || undefined,
      twitterUrl: formData.twitterUrl?.trim() || undefined,
    })

    if (success) {
      setSaveSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } else {
      setSaveError('Failed to save profile')
    }

    setSaving(false)
  }

  if (!activeWalletConnected || !activeWalletAddress) {
    return (
      <div className="hg-card rounded-2xl border border-white/[0.1] bg-[#131318] p-6">
        <p className="text-zinc-500">Please connect your wallet to create a profile</p>
      </div>
    )
  }

  if (loading && !profile) {
    return (
      <div className="rounded-2xl border border-white/[0.1] bg-[#131318]">
        <BrandLoader variant="card" label="Loading profile" />
      </div>
    )
  }

  return (
    <div className="hg-card hg-rise rounded-2xl border border-white/[0.1] bg-[#131318] p-5 relative overflow-hidden col-span-1 sm:col-span-2">
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Account information
            </h2>
            <p className="text-zinc-500 text-sm">Manage your profile</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="hg-btn-glow px-4 py-2 bg-[#2DE2FF] hover:opacity-90 text-[#0a0a0c] rounded-full font-bold transition-all text-sm whitespace-nowrap"
            >
              {profile ? 'Edit profile' : 'Create profile'}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#0a0a0c] border border-[#EF4444]/50 text-[#EF4444] rounded-xl text-sm">
            {error}
          </div>
        )}

        {saveError && (
          <div className="mb-4 p-3 bg-[#0a0a0c] border border-[#EF4444]/50 text-[#EF4444] rounded-xl text-sm">
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-4 p-3 bg-[#0a0a0c] border border-[#2DE2FF]/50 text-[#2DE2FF] rounded-xl text-sm">
            Profile saved successfully
          </div>
        )}

        {/* Single column layout for better mobile/sidebar compatibility */}
        <div className="space-y-6">
          {/* Profile Information */}
          <div className="space-y-6">

            {isEditing ? (
              <form 
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit(e)
          }} 
          className="space-y-4"
          onKeyDown={(e) => {
            // Prevent accidental form submission on Enter key
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'submit') {
              e.preventDefault()
            }
          }}
        >
              {/* Avatar First */}
              <div className="rounded-xl border border-white/[0.1] bg-[#0c0c10] p-5">
                <label className="block text-sm font-medium text-zinc-400 mb-4">
                  Avatar
                </label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <label
                      htmlFor="avatar-upload"
                      className="cursor-pointer group"
                      title="Click to upload avatar"
                    >
                      <div className="w-28 h-28 rounded-full border-2 border-white/15 group-hover:border-[#2DE2FF]/50 transition-all overflow-hidden bg-[#131318] flex items-center justify-center relative">
                        {avatarPreview || formData.avatarUrl ? (
                          <img
                            src={avatarPreview || formData.avatarUrl || ''}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-zinc-500 group-hover:text-[#2DE2FF] transition-colors">
                            <svg
                              className="w-8 h-8 mb-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-xs font-medium">Upload</span>
                          </div>
                        )}
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                            <BrandLoader variant="inline" label="Uploading" />
                          </div>
                        )}
                      </div>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={saving || uploadingAvatar}
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-zinc-400 mb-1 font-medium">
                      Click to upload an avatar
                    </p>
                    <p className="text-xs text-zinc-600">
                      Max 5MB · JPG, PNG, GIF, WebP
                    </p>
                    {formData.avatarUrl && (
                      <p className="text-xs text-[#2DE2FF] mt-2 font-semibold">
                        Avatar uploaded
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Username <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username"
                  required
                  pattern="^[a-zA-Z0-9_-]{3,50}$"
                  className="w-full p-3 rounded-xl border border-white/[0.1] bg-[#0c0c10] text-white placeholder-zinc-600 focus:border-[#2DE2FF] focus:ring-2 focus:ring-[#2DE2FF]/20 focus:outline-none transition-all"
                  disabled={saving}
                />
                <p className="text-xs text-zinc-600 mt-1">
                  3–50 characters · letters, numbers, underscores, hyphens
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Display name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Your display name"
                  maxLength={100}
                  className="w-full p-3 rounded-xl border border-white/[0.1] bg-[#0c0c10] text-white placeholder-zinc-600 focus:border-[#2DE2FF] focus:ring-2 focus:ring-[#2DE2FF]/20 focus:outline-none"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                  className="w-full p-3 rounded-xl border border-white/[0.1] bg-[#0c0c10] text-white placeholder-zinc-600 focus:border-[#2DE2FF] focus:ring-2 focus:ring-[#2DE2FF]/20 focus:outline-none resize-none"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Twitter / X</label>
                <input
                  type="url"
                  value={formData.twitterUrl}
                  onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                  placeholder="https://x.com/username"
                  className="w-full p-3 rounded-xl border border-white/[0.1] bg-[#0c0c10] text-white placeholder-zinc-600 focus:border-[#2DE2FF] focus:ring-2 focus:ring-[#2DE2FF]/20 focus:outline-none"
                  disabled={saving}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="hg-btn-glow px-6 py-2.5 bg-gradient-to-r from-[#2DE2FF] via-[#A855F7] to-[#FF2BD6] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0c] rounded-full font-bold transition-all"
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
                {profile && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setSaveError(null)
                      if (profile) {
                        setFormData({
                          username: profile.username || '',
                          displayName: profile.displayName || '',
                          bio: profile.bio || '',
                          avatarUrl: profile.avatarUrl || '',
                          twitterUrl: profile.twitterUrl || '',
                        })
                        setAvatarPreview(profile.avatarUrl || null)
                      } else {
                        setAvatarPreview(null)
                      }
                    }}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-full border border-white/15 hover:border-white/25 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white font-semibold transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : profile ? (
            <div className="space-y-6">
              {/* Avatar First */}
              {profile.avatarUrl && (
                <div className="rounded-xl border border-white/[0.1] bg-[#0c0c10] p-5">
                  <p className="text-sm text-zinc-500 mb-3 font-medium">Avatar</p>
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName || profile.username}
                    className="w-28 h-28 rounded-full object-cover border-2 border-white/15"
                  />
                </div>
              )}
              <div>
                <p className="text-sm text-white/70 mb-1">Username</p>
                <p className="text-white font-semibold text-lg">@{profile.username}</p>
              </div>
              {profile.displayName && (
                <div>
                  <p className="text-sm text-white/70 mb-1">Display Name</p>
                  <p className="text-white text-lg">{profile.displayName}</p>
                </div>
              )}
              {profile.bio && (
                <div>
                  <p className="text-sm text-white/70 mb-1">Bio</p>
                  <p className="text-white">{profile.bio}</p>
                </div>
              )}
              {profile.twitterUrl && (
                <div>
                  <p className="text-sm text-white/70 mb-1">Twitter/X</p>
                  <a
                    href={profile.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2DE2FF] hover:text-[#2DE2FF] transition-colors flex items-center gap-2"
                  >
                    <span>{profile.twitterUrl}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
              
            </div>
          ) : null}
          
          {/* Wallet Address Section */}
          {activeWalletConnected && activeWalletAddress && (
            <div className="rounded-xl border border-white/[0.1] bg-[#0c0c10] p-4">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">
                Wallet address
              </h3>
              <div className="p-3 rounded-lg border border-white/[0.08] bg-[#0a0a0c]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-mono text-xs break-all">{currentAddress || 'Not connected'}</p>
                  </div>
                  <div className="ml-2">
                    {profile && profile.walletAddress === currentAddress ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/15 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30">
                        Saved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FBBF24]/10 text-[#FBBF24] rounded-full text-xs font-semibold border border-[#FBBF24]/30">
                        Not saved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

