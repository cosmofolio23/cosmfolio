'use client'

export function Step7Projects({ projects, onUpdateProject }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Configure Projects</h3>
      <div className="space-y-4">
        {projects?.map((project: any, i: number) => (
          <div key={i} className="p-4 border rounded">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold">Project {i + 1}</h4>
            </div>
            <input type="text" value={project.projectName} onChange={(e) => onUpdateProject(i, { projectName: e.target.value })} placeholder="Project name" className="w-full px-3 py-2 border rounded text-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
