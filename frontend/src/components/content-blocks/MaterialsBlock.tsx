'use client'

export function MaterialsBlock({ materials }: any) {
  return (
    <div className="my-8 grid grid-cols-2 gap-4">
      {materials?.map((material: any, i: number) => (
        <div key={i} className="p-4 border rounded">
          <h4 className="font-bold text-sm">{material.name}</h4>
          <p className="text-xs text-gray-600 mt-1">{material.description}</p>
        </div>
      ))}
    </div>
  )
}
