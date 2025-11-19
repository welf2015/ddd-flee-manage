export function ComplianceProgressBar({ percentage }: { percentage: number }) {
  const totalBars = 20
  const filledBars = Math.round((percentage / 100) * totalBars)
  
  const getColorStyle = () => {
    if (percentage >= 80) return '#22c55e' // Green
    if (percentage >= 50) return '#eab308' // Yellow
    return '#ef4444' // Red
  }

  return (
    <div className="flex items-center gap-2">
      <div className="font-mono text-lg font-bold" style={{ color: getColorStyle() }}>
        {Array.from({ length: totalBars }, (_, i) => (
          <span key={i}>{i < filledBars ? '|' : '·'}</span>
        ))}
      </div>
      <span className="text-sm font-semibold">{percentage}%</span>
    </div>
  )
}
