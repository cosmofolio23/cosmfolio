'use client'

export function RenderShowcase({ renders }: any) {
  return (
    <div className="my-8">
      {renders?.map((render: string, i: number) => (
        <figure key={i} className="mb-8">
          <img src={render} alt="Project render" className="w-full h-auto object-cover rounded" />
        </figure>
      ))}
    </div>
  )
}
