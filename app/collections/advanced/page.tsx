"use client"

import { useState, useEffect } from "react"
import { TraitManager } from "@/components/trait-manager"
import { CharacterManager } from "@/components/character-manager"
import { RulesManager } from "@/components/rules-manager"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { ToolWorkspace, ToolPanel } from "@/components/tool-workspace"

interface Collection {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

interface CustomRule {
  id: string
  type: string
  content: string
  createdAt: string
}

export default function AdvancedCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [customRules, setCustomRules] = useState<CustomRule[]>([])
  const [activeTab, setActiveTab] = useState<'traits' | 'characters' | 'rules'>('traits')

  useEffect(() => {
    loadCollections()
    loadCustomRules()
  }, [])

  const loadCollections = async () => {
    try {
      const response = await fetch('/api/collections')
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections)
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    }
  }

  const loadCustomRules = async () => {
    try {
      const response = await fetch('/api/custom-rules')
      if (response.ok) {
        const data = await response.json()
        setCustomRules(data.rules)
      }
    } catch (error) {
      console.error('Error loading custom rules:', error)
    }
  }

  const handleTraitAdded = async (category: string, traitName: string, description: string, rarity: string) => {
    try {
      const response = await fetch('/api/traits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          trait_name: traitName,
          description,
          rarity
        })
      })
      
      if (response.ok) {
        console.log('Trait added successfully')
      }
    } catch (error) {
      console.error('Error adding trait:', error)
    }
  }

  const handleCharacterAdded = async (characterName: string, description: string) => {
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: characterName,
          description
        })
      })
      
      if (response.ok) {
        console.log('Character added successfully')
      }
    } catch (error) {
      console.error('Error adding character:', error)
    }
  }

  const handleRuleAdded = async (ruleType: string, ruleContent: string) => {
    try {
      const response = await fetch('/api/custom-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: ruleType,
          content: ruleContent
        })
      })
      
      if (response.ok) {
        console.log('Rule added successfully')
        loadCustomRules()
      }
    } catch (error) {
      console.error('Error adding rule:', error)
    }
  }

  const tabs = [
    { id: 'traits' as const, label: 'Trait Manager' },
    { id: 'characters' as const, label: 'Character Manager' },
    { id: 'rules' as const, label: 'Rules Manager' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Advanced Collections"
        subtitle="Create custom traits, characters, and rules for your collections"
        action={
          <Link
            href="/collections"
            className="inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-200 hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-colors"
          >
            Back to collections
          </Link>
        }
      />

      <ToolWorkspace className="space-y-6">
        <div className="inline-flex gap-1 p-1 rounded-full bg-[#131318] border border-white/[0.08]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ToolPanel
          title={tabs.find((t) => t.id === activeTab)?.label}
          subtitle="Studio tools for collection metadata"
        >
          {activeTab === 'traits' && (
            <TraitManager onTraitAdded={handleTraitAdded} />
          )}

          {activeTab === 'characters' && (
            <CharacterManager onCharacterAdded={handleCharacterAdded} />
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <RulesManager onRuleAdded={handleRuleAdded} />

              {customRules.length > 0 && (
                <div className="hg-card rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-4">
                  <h3 className="text-base font-semibold text-white mb-4">
                    Existing custom rules
                  </h3>
                  <div className="space-y-3">
                    {customRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="rounded-xl border border-white/[0.08] bg-[#131318] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-white capitalize">
                              {rule.type} rule
                            </span>
                            <p className="text-sm text-zinc-500 mt-1">
                              {rule.content}
                            </p>
                          </div>
                          <span className="text-xs text-zinc-600 shrink-0">
                            {new Date(rule.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ToolPanel>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total collections', value: collections.length, accent: 'text-[#2DE2FF]' },
            { label: 'Active collections', value: collections.filter((c) => c.isActive).length, accent: 'text-emerald-400' },
            { label: 'Custom rules', value: customRules.length, accent: 'text-[#FF2BD6]' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="hg-card rounded-2xl border border-white/[0.1] bg-[#131318] px-4 py-4 text-center"
            >
              <div className={`text-2xl font-bold tracking-tight ${stat.accent}`}>
                {stat.value}
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </ToolWorkspace>
    </div>
  )
}
