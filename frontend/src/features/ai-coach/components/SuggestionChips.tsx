type SuggestionChipsProps = {
  items: string[]
  disabled?: boolean
  onSelect: (value: string) => void
}

export function SuggestionChips({ items, disabled = false, onSelect }: SuggestionChipsProps) {
  return (
    <div className="ai-coach-suggestions" aria-label="Gợi ý bắt đầu">
      {items.map((item) => <button key={item} type="button" onClick={() => onSelect(item)} disabled={disabled}>{item}</button>)}
    </div>
  )
}
