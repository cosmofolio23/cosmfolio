'use client'

export function ProjectHeader({ title, description, location, year }: any) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold mb-2">{title}</h2>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {(location || year) && (
        <div className="flex gap-6 text-sm text-gray-500">
          {location && <span>{location}</span>}
          {year && <span>{year}</span>}
        </div>
      )}
    </div>
  )
}
