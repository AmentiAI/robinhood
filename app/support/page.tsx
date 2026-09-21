'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useWallet } from '@/lib/wallet/compatibility'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { BrandLoader } from '@/components/brand-loader'

interface Ticket {
  id: string
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  message_count?: number
}

interface Message {
  id: string
  message: string
  sender_type: 'user' | 'admin'
  sender_wallet_address: string | null
  created_at: string
}

export default function SupportPage() {
  const { isConnected: isBitcoinConnected, currentAddress } = useWallet()
  // Determine active wallet (Bitcoin only)
  const { activeWalletAddress, activeWalletConnected } = useMemo(() => {
    if (currentAddress && isBitcoinConnected) {
      return { activeWalletAddress: currentAddress, activeWalletConnected: true }
    }
    return { activeWalletAddress: null, activeWalletConnected: false }
  }, [currentAddress, isBitcoinConnected])
  
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [showNewTicketForm, setShowNewTicketForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load tickets when wallet is connected
  useEffect(() => {
    if (activeWalletConnected && activeWalletAddress) {
      loadTickets()
    } else {
      setTickets([])
      setSelectedTicket(null)
      setMessages([])
    }
  }, [activeWalletConnected, activeWalletAddress])

  // Poll for new messages when a ticket is selected
  useEffect(() => {
    if (!selectedTicket || !activeWalletAddress) return

    loadMessages(selectedTicket.id)
    
    // Poll every 5 seconds for new messages
    const interval = setInterval(() => {
      loadMessages(selectedTicket.id)
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedTicket, activeWalletAddress])

  const loadTickets = async () => {
    if (!activeWalletAddress) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/support/tickets?wallet_address=${encodeURIComponent(activeWalletAddress)}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load tickets' }))
        setError(errorData.error || `Failed to load tickets (${response.status})`)
      }
    } catch (err: any) {
      console.error('Error loading tickets:', err)
      setError(err?.message || 'Failed to load tickets. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (ticketId: string) => {
    if (!activeWalletAddress) return

    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages?wallet_address=${encodeURIComponent(activeWalletAddress)}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWalletAddress) {
      setError('Please connect your wallet')
      return
    }

    if (!subject.trim() || !initialMessage.trim()) {
      setError('Subject and message are required')
      return
    }

    setSending(true)
    setError(null)
    setRateLimitError(null)

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: activeWalletAddress,
          subject: subject.trim(),
          message: initialMessage.trim(),
        }),
      })

      if (response.status === 429) {
        const errorData = await response.json()
        setRateLimitError(errorData.error || 'Too many requests. Please wait a moment before creating another ticket.')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create ticket')
        return
      }

      const data = await response.json()
      setSubject('')
      setInitialMessage('')
      setShowNewTicketForm(false)
      await loadTickets()
      // Select the newly created ticket
      if (data.ticket) {
        setSelectedTicket(data.ticket)
        await loadMessages(data.ticket.id)
      }
    } catch (err) {
      console.error('Error creating ticket:', err)
      setError('Failed to create ticket')
    } finally {
      setSending(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !activeWalletAddress || !newMessage.trim()) return

    setSending(true)
    setError(null)
    setRateLimitError(null)

    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: activeWalletAddress,
          message: newMessage.trim(),
        }),
      })

      if (response.status === 429) {
        const errorData = await response.json()
        setRateLimitError(errorData.error || 'Too many requests. Please wait a moment before sending another message.')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to send message')
        return
      }

      setNewMessage('')
      await loadMessages(selectedTicket.id)
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-[#2DE2FF]/20 text-[#2DE2FF] border-white/[0.08]'
      case 'in_progress':
        return 'bg-[#FF2BD6]/20 text-[#FF2BD6] border-[#FF2BD6]/30'
      case 'resolved':
        return 'bg-[#2DE2FF]/20 text-[#2DE2FF] border-white/[0.08]'
      case 'closed':
        return 'bg-white/10 text-white/70 border-white/[0.08]'
      default:
        return 'bg-white/10 text-white/70 border-white/[0.08]'
    }
  }

  if (!activeWalletConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0c]">
        <PageHeader
          title="Support"
          subtitle="Get help with your account, collections, or any questions"
        />
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-xl mx-auto rounded-2xl border border-white/[0.08] bg-[#131318] p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Connect your wallet</h2>
            <p className="text-zinc-500 mb-5 text-sm">
              Connect to access support and submit tickets.
            </p>
            <Link
              href="/launchpad"
              className="inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold hover:bg-[#7aefff] transition-colors"
            >
              Go to launchpad
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Support"
        subtitle="Get help with your account, collections, or any questions"
      />

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">

          {error && (
            <div className="mb-6 p-4 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md border border-[#EF4444]/50 rounded-lg text-[#EF4444]">
              {error}
            </div>
          )}

          {rateLimitError && (
            <div className="mb-6 p-4 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md border border-[#FF2BD6]/50 rounded-lg text-[#FF2BD6]">
              {rateLimitError}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-1">
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md border-white/[0.08] rounded-xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Your Tickets</h2>
                  <button
                    onClick={() => {
                      setShowNewTicketForm(true)
                      setSelectedTicket(null)
                      setMessages([])
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-all duration-200"
                  >
                    + New Ticket
                  </button>
                </div>

                {showNewTicketForm ? (
                  <form onSubmit={handleCreateTicket} className="space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[#a8a8b8] mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full border-white/[0.08] rounded-lg px-4 py-2 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md text-white placeholder-gray-400 focus:border-[#2DE2FF] focus:ring-2 focus:ring-[#2DE2FF]/20 focus:outline-none"
                        placeholder="What do you need help with?"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#a8a8b8] mb-2">
                        Message *
                      </label>
                      <textarea
                        value={initialMessage}
                        onChange={(e) => setInitialMessage(e.target.value)}
                        className="w-full border-white/[0.08] rounded-lg px-4 py-2 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md text-white placeholder-gray-400 focus:border-[#2DE2FF] focus:ring-2 focus:ring-[#2DE2FF]/20 focus:outline-none"
                        placeholder="Describe your issue or question..."
                        rows={4}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={sending}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] hover:opacity-90 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                      >
                        {sending ? 'Creating...' : 'Create Ticket'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewTicketForm(false)
                          setSubject('')
                          setInitialMessage('')
                          setError(null)
                        }}
                        className="px-4 py-2 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md hover:bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md text-[#a8a8b8] rounded-lg font-semibold transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}

                {loading ? (
                  <div className="rounded-2xl border border-white/[0.1] bg-[#131318]">
                    <BrandLoader variant="card" label="Loading tickets" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-white/70">
                    <p className="mb-4">No tickets yet</p>
                    <p className="text-sm">Click "New Ticket" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setShowNewTicketForm(false)
                          loadMessages(ticket.id)
                        }}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                          selectedTicket?.id === ticket.id
                            ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                            : 'border-[#00E5FF]/30 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md hover:border-[#00E5FF]/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-white text-sm">{ticket.subject}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-[#a8a8b8]/80">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                        {ticket.message_count && ticket.message_count > 0 && (
                          <p className="text-xs text-[#00E5FF] mt-1">
                            {ticket.message_count} message{ticket.message_count !== 1 ? 's' : ''}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md border-white/[0.08] rounded-xl shadow-xl flex flex-col h-[700px]">
                  <div className="p-6 border-b border-white/[0.08]">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
                        <p className="text-sm text-white/70 mt-1">
                          Status: <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTicket.status)}`}>
                            {selectedTicket.status.replace('_', ' ')}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTicket(null)
                          setMessages([])
                        }}
                        className="text-[#a8a8b8]/80 hover:text-[#a8a8b8]"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.sender_type === 'user'
                              ? 'bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] text-white'
                              : 'bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md border-2 border-[#00E5FF]/30 text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          <p className={`text-xs mt-2 ${message.sender_type === 'user' ? 'opacity-70' : 'text-[#a8a8b8]/80'}`}>
                            {message.sender_type === 'admin' ? '👨‍💼 Support Team' : 'You'} • {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-6 border-t border-white/[0.08] bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md">
                    <div className="flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage(e)
                          }
                        }}
                        className="flex-1 border-white/[0.08] rounded-lg px-4 py-3 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md text-white placeholder-gray-400 focus:border-[#2DE2FF] focus:ring-2 focus:ring-[#2DE2FF]/20 focus:outline-none resize-none"
                        placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                        rows={2}
                        required
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] hover:opacity-90 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? '...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md border-white/[0.08] rounded-xl p-12 shadow-xl text-center h-[700px] flex items-center justify-center">
                  <div>
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-bold text-white mb-2">Select a Ticket</h3>
                    <p className="text-white/70">
                      {tickets.length === 0
                        ? 'Create a new ticket to get started'
                        : 'Select a ticket from the list to view the conversation'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


