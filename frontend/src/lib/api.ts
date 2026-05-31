import axios, { AxiosInstance } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class APIClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }

    // Add interceptor for auth token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  // Auth endpoints
  async signup(email: string, password: string, name?: string) {
    const response = await this.client.post('/api/auth/signup', {
      email,
      password,
      name,
    })
    return response.data
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/api/auth/login', {
      email,
      password,
    })
    return response.data
  }

  async getCurrentUser() {
    const response = await this.client.get('/api/auth/me')
    return response.data
  }

  async logout() {
    const response = await this.client.post('/api/auth/logout')
    this.clearToken()
    return response.data
  }

  // Projects endpoints
  async getProjects() {
    const response = await this.client.get('/api/projects')
    return response.data
  }

  async createProject(title: string, description?: string, projectType?: string) {
    const response = await this.client.post('/api/projects', {
      title,
      description,
      project_type: projectType || 'residential',
    })
    return response.data
  }

  async getProject(projectId: string) {
    const response = await this.client.get(`/api/projects/${projectId}`)
    return response.data
  }

  async updateProject(projectId: string, data: any) {
    const response = await this.client.put(`/api/projects/${projectId}`, data)
    return response.data
  }

  async deleteProject(projectId: string) {
    const response = await this.client.delete(`/api/projects/${projectId}`)
    return response.data
  }

  // Assets endpoints
  async uploadAssets(projectId: string, assetType: string, files: File[]) {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await this.client.post(
      `/api/assets/${projectId}/upload?asset_type=${assetType}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }

  async getAssets(projectId: string) {
    const response = await this.client.get(`/api/assets/${projectId}/list`)
    return response.data
  }

  async deleteAsset(projectId: string, assetId: string) {
    const response = await this.client.delete(
      `/api/assets/${projectId}/assets/${assetId}`
    )
    return response.data
  }

  async analyzeAssets(projectId: string) {
    const response = await this.client.get(`/api/assets/${projectId}/analysis`)
    return response.data
  }

  // Layouts endpoints
  async getLayouts() {
    const response = await this.client.get('/api/layouts')
    return response.data
  }

  async getLayout(layoutId: string) {
    const response = await this.client.get(`/api/layouts/${layoutId}`)
    return response.data
  }

  async recommendLayout(renderCount: number, planCount: number, sectionCount: number, diagramCount: number) {
    const response = await this.client.post('/api/layouts/recommend', null, {
      params: {
        render_count: renderCount,
        plan_count: planCount,
        section_count: sectionCount,
        diagram_count: diagramCount,
      },
    })
    return response.data
  }

  async getStyles() {
    const response = await this.client.get('/api/layouts/styles/all')
    return response.data
  }

  // Portfolios endpoints
  async generatePortfolio(projectId: string, layoutId: string, stylePack: string, gridMode: string, variantCount: number = 1) {
    const response = await this.client.post(
      `/api/portfolios/${projectId}/generate`,
      {
        layout_id: layoutId,
        style_pack: stylePack,
        grid_mode: gridMode,
        variant_count: variantCount,
      }
    )
    return response.data
  }

  async getPortfolios(projectId: string) {
    const response = await this.client.get(`/api/portfolios/${projectId}/list`)
    return response.data
  }

  async getPortfolio(portfolioId: string) {
    const response = await this.client.get(`/api/portfolios/${portfolioId}`)
    return response.data
  }

  async getPortfolioPreview(portfolioId: string) {
    const response = await this.client.get(`/api/portfolios/${portfolioId}/preview`)
    return response.data
  }

  async deletePortfolio(portfolioId: string) {
    const response = await this.client.delete(`/api/portfolios/${portfolioId}`)
    return response.data
  }
}

export const apiClient = new APIClient()
