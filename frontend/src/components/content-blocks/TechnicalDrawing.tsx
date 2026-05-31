'use client'

export function TechnicalDrawing({ plan, section, title }: any) {
  return (
    <div className="my-8 grid grid-cols-2 gap-4">
      {plan && (
        <figure>
          <img src={plan} alt="Floor plan" className="w-full h-auto" />
          <figcaption className="text-xs text-gray-500 mt-2">Plan</figcaption>
        </figure>
      )}
      {section && (
        <figure>
          <img src={section} alt="Section" className="w-full h-auto" />
          <figcaption className="text-xs text-gray-500 mt-2">Section</figcaption>
        </figure>
      )}
    </div>
  )
}
