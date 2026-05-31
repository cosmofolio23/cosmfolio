'use client'

export function StatsBlock({ stats }: any) {
  return (
    <div className="my-8 grid grid-cols-3 gap-4">
      {stats?.map((stat: any, i: number) => (
        <div key={i} className="text-center">
          <div className="text-3xl font-bold mb-1">{stat.value}</div>
          <div className="text-xs text-gray-600">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
