import { create } from 'zustand'
import { BuilderState, ProjectPageConfig, DesignMode, PortfolioType, FrontCoverConfig, AboutMePageConfig, EndPageConfig, DesignProjectConfig } from '@/types/portfolio'

interface PortfolioBuilderStore extends BuilderState {
  // State properties (explicitly declare for component access)
  currentStep: number
  totalPages: number
  projectCount: number
  stylePackId: string
  frontPage: BuilderState['frontPage']
  portfolioName: string
  portfolioType: PortfolioType
  frontCover: FrontCoverConfig
  designProjects: DesignProjectConfig[]
  aboutPage: AboutMePageConfig
  contentsPageEnabled: boolean
  endPage: EndPageConfig

  // Step navigation
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  getTotalSteps: () => number

  // Batch 1: Wizard setters
  setPortfolioName: (name: string) => void
  setPortfolioType: (type: PortfolioType) => void
  setFrontCover: (cover: Partial<FrontCoverConfig>) => void
  toggleAboutPage: () => void
  toggleAboutSection: (section: keyof AboutMePageConfig['sections']) => void
  setContentsPageEnabled: (enabled: boolean) => void
  toggleEndPage: () => void
  setEndPage: (end: Partial<EndPageConfig>) => void

  // Design Projects (per-project config - text only, no assets)
  setDesignProject: (index: number, updates: Partial<DesignProjectConfig>) => void
  syncDesignProjectsWithCount: () => void

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
  portfolioName: '',
  portfolioType: 'professional',
  totalPages: 8,
  projectCount: 3,
  frontCover: {
    title: '',
    subtitle: '',
    tagline: '',
    authorName: '',
    year: new Date().getFullYear().toString(),
    studio: '',
    coverImageUrl: '',
  },
  designProjects: [
    // Auto-populated when projectCount changes
  ],
  aboutPage: {
    enabled: true,
    sections: {
      bio: true,
      resume: true,
      skills: true,
      software: true,
      experience: false,
      awards: false,
      publications: false,
      languages: false,
      interests: false,
    },
  },
  contentsPageEnabled: true,
  endPage: {
    enabled: true,
    email: '',
    website: '',
    phone: '',
    instagram: '',
    linkedin: '',
    includeQrCode: true,
  },
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

  // Batch 1: Wizard setters
  setPortfolioName: (name) => set({ portfolioName: name }),
  setPortfolioType: (type) => set({ portfolioType: type }),
  setFrontCover: (cover) => set((s) => ({
    frontCover: { ...s.frontCover, ...cover }
  })),
  toggleAboutPage: () => set((s) => ({
    aboutPage: { ...s.aboutPage, enabled: !s.aboutPage.enabled }
  })),
  toggleAboutSection: (section) => set((s) => ({
    aboutPage: {
      ...s.aboutPage,
      sections: { ...s.aboutPage.sections, [section]: !s.aboutPage.sections[section] }
    }
  })),
  setContentsPageEnabled: (enabled) => set({ contentsPageEnabled: enabled }),
  toggleEndPage: () => set((s) => ({
    endPage: { ...s.endPage, enabled: !s.endPage.enabled }
  })),
  setEndPage: (end) => set((s) => ({
    endPage: { ...s.endPage, ...end }
  })),

  // Design Projects setters
  setDesignProject: (index, updates) => set((s) => {
    const projects = [...s.designProjects]
    if (projects[index]) {
      projects[index] = { ...projects[index], ...updates }
    }
    return { designProjects: projects }
  }),

  // Keep designProjects array in sync with projectCount
  syncDesignProjectsWithCount: () => set((s) => {
    const count = s.projectCount
    const current = s.designProjects
    const newProjects: DesignProjectConfig[] = []
    for (let i = 0; i < count; i++) {
      if (current[i]) {
        newProjects.push(current[i])
      } else {
        newProjects.push({
          id: `project-${i + 1}-${Date.now()}`,
          name: `Project ${i + 1}`,
          location: '',
          year: new Date().getFullYear().toString(),
          typology: '',
          pageCount: 2,
          description: '',
          assets: { renders: [], plans: [], sections: [], diagrams: [] },
        })
      }
    }
    return { designProjects: newProjects }
  }),

  // Step 1
  setTotalPages: (count) => set({ totalPages: Math.max(4, Math.min(50, count)) }),

  // Step 2
  setProjectCount: (count) => set((s) => {
    // Update legacy projectPages
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

    // Also sync the new designProjects array
    const designProjects: DesignProjectConfig[] = Array.from({ length: count }, (_, i) => {
      if (s.designProjects[i]) return s.designProjects[i]
      return {
        id: `dp-${i + 1}-${Date.now()}`,
        name: `Project ${i + 1}`,
        location: '',
        year: new Date().getFullYear().toString(),
        typology: '',
        pageCount: 2,
        description: '',
        assets: { renders: [], plans: [], sections: [], diagrams: [] },
      }
    })

    return { projectCount: count, projectPages: projectPages, designProjects: designProjects }
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
