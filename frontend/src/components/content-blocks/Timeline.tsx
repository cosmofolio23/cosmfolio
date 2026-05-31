'use client'

export function Timeline({ steps }: any) {
  return (
    <div className="my-8">
      {steps?.map((step: any, i: number) => (
        <div key={i} className="mb-6 flex gap-4">
          <div className="w-2 h-2 rounded-full bg-black mt-2" />
          <div>
            <h4 className="font-bold">{step.title}</h4>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
