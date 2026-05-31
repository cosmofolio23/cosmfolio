'use client'

export function ImageGallery({ images, columns = 3 }: any) {
  return (
    <div className={`grid grid-cols-${columns} gap-4 my-8`}>
      {images?.map((img: string, i: number) => (
        <img key={i} src={img} alt="Gallery item" className="w-full h-auto object-cover rounded" />
      ))}
    </div>
  )
}
