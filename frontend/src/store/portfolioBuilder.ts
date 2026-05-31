import { create } from 'zustand'
import { BuilderState, ProjectPageConfig, DesignMode } from '@/types/portfolio'

interface PortfolioBuilderStore extends BuilderState {
  // Step navigation
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  getTotalSteps: () => number

  // Step 1: Page count
  setTotalPages: (count: number) => void

  // Step 2: Project count
  setProjectCount: (count: number) => void

  // Step 3: Front page
  setFrontPageLayout: (layoutId: string) => void
  setFrontPageDesignMode: (mode: DesignMode) => void
  setFrontPageContent: (content: Partial<BuilderState['frontPage']['content']>) => void

  // Step 4: Last page
  setLastPageLayout: (layoutId: string) => void
  setLastPageContent: (content: Partial<BuilderState['lastPage']['content']>) => void

  // Step 5: Resume/About
  setResumeEnabled: (enabled: boolean) => void
  setResumeContent: (content: Partial<BuilderState['resumePage']['content']>) => void

  // Step 6: Contents
  setContentsEnabled: (enabled: boolean) => void
  setContentsStyle: (style: BuilderState['contentsPage']['style']) => void

  // Step 7: Project pages
  setProjectPages: (pages: ProjectPageConfig[]) => void
  updateProjectPage: (index: number, updates: Partial<ProjectPageConfig>) => void
  setProjectLayout: (index: number, layoutId: string) => void

  // Style
  setStylePack: (stylePackId: string) => void

  // Portfolio
  setPortfolioId: (id: string) => void

  // Reset
  reset: () => void
}

const initialState: BuilderState = {
  currentStep: 1,
  totalPages: 8,
  projectCount: 3,
  frontPage: {
    designMode: 'manual',
    selectedLayoutId: 'cover-hero-full',
    content: { title: 'Portfolio', subtitle: 'Architecture & Design', tagline: '' },
  },
  lastPage: {
    selectedLayoutId: null,
    content: { contactEmail: '', website: '', phone: '', qrCode: false },
  },
  resumePage: {
    enabled: true,
    content: {
      name: '', bio: '', education: [], experience: [],
      skills: [], awards: [], software: [], languages: [], interests: [],
    },
  },
  contentsPage: {
    enabled: false,
    style: 'minimal',
  },
  projectPages: [],
  stylePackId: 'minimal-white',
  portfolioId: null,
}

export const usePortfolioBuilder = create<PortfolioBuilderStore>((set, get) => ({
  ...initialState,

  // Navigation
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, get().getTotalSteps()) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  getTotalSteps: () => 7,

  // Step 1
  setTotalPages: (count) => set({ totalPages: Math.max(4, Math.min(50, count)) }),

  // Step 2
  setProjectCount: (count) => set((s) => {
    const projectPages: ProjectPageConfig[] = Array.from({ length: count }, (_, i) => ({
      projectId: s.projectPages[i]?.projectId || `project-${i + 1}`,
      projectName: s.projectPages[i]?.projectName || `Project ${i + 1}`,
      layoutId: s.projectPages[i]?.layoutId || 'proj-hero-text',
      pageNumbers: [],
      content: s.projectPages[i]?.content || {
        title: `Project ${i + 1}`, description: '', location: '', year: '',
        area: '', typology: '', status: '', role: '', conceptStatement: '',
      },
      assets: s.projectPages[i]?.assets || { renders: [], plans: [], sections: [], diagrams: [] },
    }))
    return { projectCount: count, projectPages: projectPages }
  }),

  // Step 3
  setFrontPageLayout: (layoutId) => set((s) => ({ frontPage: { ...s.frontPage, selectedLayoutId: layoutId } })),
  setFrontPageDesignMode: (mode) => set((s) => ({ frontPage: { ...s.frontPage, designMode: mode } })),
  setFrontPageContent: (content) => set((s) => ({ frontPage: { ...s.frontPage, content: { ...s.frontPage.content, ...content } } })),

  // Step 4
  setLastPageLayout: (layoutId) => set((s) => ({ lastPage: { ...s.lastPage, selectedLayoutId: layoutId } })),
  setLastPageContent: (content) => set((s) => ({ lastPage: { ...s.lastPage, content: { ...s.lastPage.content, ...content } } })),

  // Step 5
  setResumeEnabled: (enabled) => set((s) => ({ resumePage: { ...s.resumePage, enabled } })),
  setResumeContent: (content) => set((s) => ({ resumePage: { ...s.resumePage, content: { ...s.resumePage.content, ...content } } })),

  // Step 6
  setContentsEnabled: (enabled) => set((s) => ({ contentsPage: { ...s.contentsPage, enabled } })),
  setContentsStyle: (style) => set((s) => ({ contentsPage: { ...s.contentsPage, style } })),

  // Step 7
  setProjectPages: (pages) => set({ projectPages: pages }),
  updateProjectPage: (index, updates) => set((s) => {
    const pages = [...s.projectPages]
    pages[index] = { ...pages[index], ...updates }
    return { projectPages: pages }
  }),
  setProjectLayout: (index, layoutId) => set((s) => {
    const pages = [...s.projectPages]
    pages[index] = { ...pages[index], layoutId }
    return { projectPages: pages }
  }),

  // Style
  setStylePack: (stylePackId) => set({ stylePackId }),

  // Portfolio
  setPortfolioId: (id) => set({ portfolioId: id }),

  // Reset
  reset: () => set(initialState),
}))
