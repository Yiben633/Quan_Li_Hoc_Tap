type ChartLegendItem = {
  label: string
  tone: 'primary' | 'success' | 'pine' | 'moss' | 'sage' | 'amber' | 'coral' | 'sky'
}

type ChartLegendProps = {
  items: ChartLegendItem[]
  label?: string
}

export function ChartLegend({ items, label = 'Chú giải biểu đồ' }: ChartLegendProps) {
  return <ul className="chart-legend" aria-label={label}>{items.map((item) => <li key={item.label}><span className={`chart-legend-swatch ${item.tone}`} aria-hidden="true" />{item.label}</li>)}</ul>
}
