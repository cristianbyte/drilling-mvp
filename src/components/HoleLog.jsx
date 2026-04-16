export default function HoleLog({ holes, totalMeters }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        <span className="section-title">Registros del turno</span>
        {/* Running total */}
        <div className="ml-auto text-right">
          <div className="font-mono text-base font-semibold text-amber-400">
            {totalMeters.toFixed(1)} m
          </div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
            Total perforado
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {holes.length === 0 ? (
          <p className="text-center font-mono text-xs text-slate-600 py-8">
            Aún no hay registros
          </p>
        ) : (
          [...holes].reverse().map((h, i) => (
            <div
              key={h.holeId}
              className={`flex items-center justify-between px-4 py-3 ${i === 0 ? 'slide-down' : ''}`}
            >
              <div className="flex items-center gap-3">
                {/* Hole number pill */}
                <span className="font-mono text-xs font-semibold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded px-2 py-1">
                  B-{String(h.holeNumber).padStart(2, '0')}
                </span>
                <div>
                  {/* Ceiling / Floor detail */}
                  <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wide">
                    {h.ceiling ? `T: ${h.ceiling}m` : ''}{h.ceiling && h.floor ? ' · ' : ''}{h.floor ? `P: ${h.floor}m` : ''}
                    {!h.ceiling && !h.floor ? 'Sin T/P' : ''}
                  </div>
                </div>
              </div>
              {/* Depth */}
              <span className="font-mono text-base font-semibold text-amber-400">
                {h.depth.toFixed(1)} m
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}