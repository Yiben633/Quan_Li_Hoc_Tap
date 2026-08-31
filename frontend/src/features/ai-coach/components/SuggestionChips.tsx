import type { LucideIcon } from 'lucide-react'

export type StarterPrompt = {
  label: string
  icon: LucideIcon
  tone: 'leaf' | 'plan' | 'overdue' | 'evening'
}

type SuggestionChipsProps = {
  items: StarterPrompt[]
  disabled?: boolean
  onSelect: (value: string) => void
}

export function SuggestionChips({ items, disabled = false, onSelect }: SuggestionChipsProps) {
  return (
    <div className="ai-coach-suggestions" aria-label="Gợi ý bắt đầu">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button key={item.label} type="button" className={`ai-coach-suggestion-card ${item.tone}`} onClick={() => onSelect(item.label)} disabled={disabled}>
            <span className="ai-coach-suggestion-icon" aria-hidden="true"><Icon size={17} /></span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
