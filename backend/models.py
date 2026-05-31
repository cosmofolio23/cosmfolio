from pydantic import BaseModel, EmailStr, Field
from pydantic import ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# ==================== Enums ====================

class ProjectTypeEnum(str, Enum):
    # User-facing project categories (used by frontend)
    portfolio = "portfolio"
    sheet = "sheet"
    # Architecture-specific project types
    cultural_center = "cultural_center"
    residential = "residential"
    office = "office"
    retail = "retail"
    hospitality = "hospitality"
    educational = "educational"
    mixed_use = "mixed_use"
    other = "other"

class AssetTypeEnum(str, Enum):
    render = "render"
    plan = "plan"
    section = "section"
    diagram = "diagram"
    material = "material"
    detail = "detail"

class StylePackEnum(str, Enum):
    minimal_white = "minimal_white"
    dark_studio = "dark_studio"
    scandinavian = "scandinavian"
    architectural_journal = "architectural_journal"
    competition_board = "competition_board"
    parametric = "parametric"
    corporate = "corporate"

class GridModeEnum(str, Enum):
    strict = "strict"
    flexible = "flexible"

# ==================== Auth ====================

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    created_at: datetime

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ==================== Projects ====================

class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    project_type: ProjectTypeEnum = ProjectTypeEnum.residential

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_type: Optional[ProjectTypeEnum] = None
    status: Optional[str] = None

class ProjectResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    project_type: str = "residential"
    status: str = "draft"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# ==================== Assets ====================

class AssetAnalysis(BaseModel):
    colors: Optional[List[str]] = None
    composition: Optional[str] = None
    quality: Optional[float] = None
    content_type: Optional[str] = None

class AssetCreate(BaseModel):
    asset_type: AssetTypeEnum
    file_name: str
    file_size: int

class AssetResponse(BaseModel):
    id: str
    project_id: str
    asset_type: str
    file_url: str
    file_name: str
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    analysis: Optional[Dict[str, Any]] = None
    upload_order: Optional[int] = 0
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True, "extra": "ignore"}

class AssetListResponse(BaseModel):
    render: List[AssetResponse] = []
    plan: List[AssetResponse] = []
    section: List[AssetResponse] = []
    diagram: List[AssetResponse] = []
    material: List[AssetResponse] = []
    detail: List[AssetResponse] = []

# ==================== Layouts ====================

class LayoutRegion(BaseModel):
    type: str  # hero_image, grid, text, etc.
    assets: Optional[List[str]] = None
    x: float
    y: float
    w: float
    h: float
    aspect: Optional[str] = None
    position: Optional[str] = None  # cover, contain, etc.

class LayoutPage(BaseModel):
    page_num: int
    regions: List[LayoutRegion]

class LayoutDefinition(BaseModel):
    id: str
    name: str
    description: str
    pages: List[LayoutPage]
    thumbnail: Optional[str] = None

class LayoutResponse(BaseModel):
    layout: LayoutDefinition
    recommended: bool = False

# ==================== Design Systems ====================

class Typography(BaseModel):
    heading: str
    subtitle: str
    body: str
    caption: str

class Spacing(BaseModel):
    page_margin: str
    section_gap: str
    item_gap: str

class Colors(BaseModel):
    background: str
    text: str
    accent: str
    caption: str

class Grid(BaseModel):
    columns: int
    gutter: str

class StylePack(BaseModel):
    id: str
    name: str
    typography: Typography
    spacing: Spacing
    colors: Colors
    grid: Grid
    borders: Dict[str, Any]
    page_number: str

# ==================== Portfolio Generation ====================

class PortfolioPageComponent(BaseModel):
    type: str  # render, plan, section, diagram, text, etc.
    asset_id: Optional[str] = None
    content: Optional[str] = None
    position: Optional[str] = None

class PortfolioPage(BaseModel):
    page_num: int
    title: Optional[str] = None
    components: List[PortfolioPageComponent]
    notes: Optional[str] = None

class GeneratePortfolioRequest(BaseModel):
    layout_id: str = "hero_render"
    style_pack: str = "minimal_white"
    grid_mode: str = "strict"
    font_pair: Optional[str] = None
    variant_count: int = Field(1, ge=1, le=10)
    variant_number: Optional[int] = None

class PortfolioResponse(BaseModel):
    id: str
    project_id: str
    layout_id: str
    style_pack: str
    page_structure: Optional[Dict[str, Any]] = None
    grid_mode: Optional[str] = None
    variant_number: int
    status: str
    pdf_url: Optional[str] = None
    web_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True, "extra": "ignore"}

# ==================== Export ====================

class ExportRequest(BaseModel):
    export_type: str  # pdf, web, social

class ExportResponse(BaseModel):
    export_type: str
    status: str
    file_url: Optional[str]
    created_at: datetime

# ==================== Recommendations ====================

class AssetCountAnalysis(BaseModel):
    render_count: int
    plan_count: int
    section_count: int
    diagram_count: int

class LayoutRecommendation(BaseModel):
    recommended_layout_id: str
    reason: str
    confidence: float

# ==================== NEW: Multi-Project Portfolio System ====================

# Page Size & Layout Enums
class PageSizeEnum(str, Enum):
    a4 = "a4"
    a3 = "a3"
    letter = "letter"
    tabloid = "tabloid"
    custom = "custom"

class OrientationEnum(str, Enum):
    portrait = "portrait"
    landscape = "landscape"

class MarginsEnum(str, Enum):
    compact = "compact"
    standard = "standard"
    generous = "generous"
    custom = "custom"

class PageTypeEnum(str, Enum):
    cover = "cover"
    project = "project"
    content = "content"
    credits = "credits"
    blank = "blank"

class AiToneEnum(str, Enum):
    academic = "academic"
    professional = "professional"
    creative = "creative"
    technical = "technical"
    marketing = "marketing"

# ==================== Portfolio Models ====================

class PortfolioSettingsRequest(BaseModel):
    title: str
    description: Optional[str] = None
    architect_name: str
    architect_bio: Optional[str] = None
    page_size: PageSizeEnum = PageSizeEnum.a4
    page_orientation: OrientationEnum = OrientationEnum.portrait
    margins: MarginsEnum = MarginsEnum.standard
    style_id: Optional[str] = None

class PortfolioSettingsResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    architect_name: str
    architect_bio: Optional[str]
    page_size: str
    page_orientation: str
    margins: str
    style_id: Optional[str]
    created_at: datetime
    updated_at: datetime

class PortfolioCreateRequest(BaseModel):
    title: str
    architect_name: str
    architect_bio: Optional[str] = None
    page_size: PageSizeEnum = PageSizeEnum.a4
    page_orientation: OrientationEnum = OrientationEnum.portrait
    margins: MarginsEnum = MarginsEnum.standard

class PortfolioDetailResponse(BaseModel):
    id: str
    user_id: str
    title: str
    architect_name: str
    architect_bio: Optional[str]
    page_size: str
    page_orientation: str
    margins: str
    style_id: Optional[str]
    is_published: bool
    view_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "extra": "ignore"}

# ==================== Project Models (Updated) ====================

class ProjectCreateRequest(BaseModel):
    portfolio_id: str
    title: str
    project_type: ProjectTypeEnum
    location: Optional[str] = None
    description: Optional[str] = None
    brief: Optional[str] = None
    status: Optional[str] = "concept"
    year: Optional[int] = None

class ProjectDetailResponse(BaseModel):
    id: str
    portfolio_id: str
    user_id: str
    title: str
    project_type: str
    location: Optional[str]
    description: Optional[str]
    brief: Optional[str]
    status: str
    year: Optional[int]
    order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "extra": "ignore"}

# ==================== Portfolio Page Models ====================

class LayoutConfigRequest(BaseModel):
    margins: Optional[Dict[str, int]] = None
    spacing: Optional[Dict[str, int]] = None
    image_aspect_ratio: Optional[str] = "cover"
    columns: Optional[int] = None

class PortfolioPageCreateRequest(BaseModel):
    page_number: int
    page_type: PageTypeEnum = PageTypeEnum.content
    layout_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    layout_config: Optional[LayoutConfigRequest] = None
    asset_ids: Optional[List[str]] = None
    style_override_id: Optional[str] = None

class PortfolioPageUpdateRequest(BaseModel):
    page_type: Optional[PageTypeEnum] = None
    layout_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    layout_config: Optional[LayoutConfigRequest] = None
    asset_ids: Optional[List[str]] = None
    style_override_id: Optional[str] = None

class PortfolioPageResponse(BaseModel):
    id: str
    portfolio_id: str
    page_number: int
    page_type: str
    layout_id: str
    title: Optional[str]
    description: Optional[str]
    layout_config: Optional[Dict[str, Any]]
    asset_ids: Optional[List[str]]
    style_override_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "extra": "ignore"}

# ==================== Style Models ====================

class ColorScheme(BaseModel):
    primary: str
    secondary: str
    tertiary: str
    neutral_light: str
    neutral_dark: str
    text_primary: str
    text_secondary: str
    accent: str

class TypographyConfig(BaseModel):
    heading_font: str
    heading_weight: str
    subheading_font: str
    subheading_weight: str
    body_font: str
    body_weight: str
    caption_font: str
    caption_weight: str

class DesignElements(BaseModel):
    border_style: str
    border_radius: int
    shadow_depth: int
    spacing_scale: str
    texture: Optional[str] = None

class BrandingConfig(BaseModel):
    logo_url: Optional[str] = None
    logo_placement: Optional[str] = None
    watermark_text: Optional[str] = None
    signature_url: Optional[str] = None

class StyleCreateRequest(BaseModel):
    name: str
    colors: ColorScheme
    typography: TypographyConfig
    design_elements: DesignElements
    branding: Optional[BrandingConfig] = None

class StyleResponse(BaseModel):
    id: str
    user_id: str
    portfolio_id: Optional[str]
    name: str
    is_custom: bool
    is_ai_generated: bool
    colors: ColorScheme
    typography: TypographyConfig
    design_elements: DesignElements
    branding: Optional[BrandingConfig]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "extra": "ignore"}

# ==================== Layout Template Models ====================

class LayoutConfig(BaseModel):
    grid_columns: int
    image_aspect_ratio: str
    spacing: Dict[str, int]
    component_arrangement: List[str]

class LayoutCreateRequest(BaseModel):
    id: str
    name: str
    description: str
    asset_types: List[str]
    max_assets: int
    preview_image_url: str
    config: LayoutConfig

class LayoutTemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    asset_types: List[str]
    max_assets: int
    preview_image_url: str
    config: Dict[str, Any]

    model_config = {"from_attributes": True, "extra": "ignore"}

# ==================== Project Text Models ====================

class ProjectTextCreateRequest(BaseModel):
    concept_statement: Optional[str] = None
    design_brief: Optional[str] = None
    design_strategy: Optional[str] = None
    project_description: Optional[str] = None
    site_context: Optional[str] = None
    program_description: Optional[str] = None
    key_features: Optional[List[str]] = None
    team_credits: Optional[Dict[str, str]] = None
    consultants: Optional[Dict[str, str]] = None
    software_used: Optional[List[str]] = None
    photography_credits: Optional[str] = None

class ProjectTextResponse(BaseModel):
    id: str
    project_id: str
    concept_statement: Optional[str]
    design_brief: Optional[str]
    design_strategy: Optional[str]
    project_description: Optional[str]
    site_context: Optional[str]
    program_description: Optional[str]
    key_features: Optional[List[str]]
    team_credits: Optional[Dict[str, str]]
    consultants: Optional[Dict[str, str]]
    software_used: Optional[List[str]]
    photography_credits: Optional[str]
    ai_tone: Optional[str]
    ai_generation_date: Optional[datetime]
    user_edited: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "extra": "ignore"}

# ==================== Image Caption Models ====================

class ImageCaptionResponse(BaseModel):
    id: str
    asset_id: str
    ai_generated_caption: Optional[str]
    user_custom_caption: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True, "extra": "ignore"}

# ==================== Export Models ====================

class PortfolioExportRequest(BaseModel):
    export_type: str  # pdf, web, images, social

class PortfolioExportResponse(BaseModel):
    id: str
    portfolio_id: str
    export_type: str
    export_url: str
    page_size: str
    file_size: int
    export_date: datetime
    downloaded_count: int

    model_config = {"from_attributes": True, "extra": "ignore"}

# ==================== Layout Recommendation Models ====================

class LayoutRecommendationRequest(BaseModel):
    render_count: int
    plan_count: int
    section_count: int
    diagram_count: int

class LayoutRecommendationResponse(BaseModel):
    layout_id: str
    confidence: float
    reason: str

# ==================== Asset Models (Phase 2) ====================

class AssetUploadRequest(BaseModel):
    asset_type: AssetTypeEnum
    file_name: str
    tags: Optional[List[str]] = None
    description: Optional[str] = None

class AssetMetadataRequest(BaseModel):
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    asset_type: Optional[AssetTypeEnum] = None

class AssetResponse(BaseModel):
    id: str
    project_id: Optional[str]
    portfolio_id: str
    file_name: str
    file_size: int
    file_type: str
    mime_type: str
    asset_type: str
    storage_path: str
    thumb_path: Optional[str]
    preview_url: Optional[str]
    width: Optional[int]
    height: Optional[int]
    description: Optional[str]
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    version: int

    model_config = {"from_attributes": True, "extra": "ignore"}

class AssetListResponse(BaseModel):
    items: List[AssetResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class AssetVersionResponse(BaseModel):
    id: str
    asset_id: str
    version_number: int
    file_path: str
    file_size: int
    created_at: datetime

    model_config = {"from_attributes": True, "extra": "ignore"}

class AssetVersionListResponse(BaseModel):
    asset_id: str
    versions: List[AssetVersionResponse]
    total_versions: int

class AssetTagResponse(BaseModel):
    id: str
    asset_id: str
    tag_name: str
    created_at: datetime

class BulkAssetUploadResponse(BaseModel):
    uploaded: int
    failed: int
    total: int
    errors: Optional[List[Dict[str, Any]]]

# ==================== PHASE 3: DESIGN SYSTEM & LAYOUTS ====================

class LayoutTemplateEnum(str, Enum):
    """Available layout templates"""
    minimal = "minimal"
    classic = "classic"
    modern = "modern"
    grid = "grid"
    masonry = "masonry"
    carousel = "carousel"
    timeline = "timeline"
    gallery = "gallery"
    list = "list"
    split = "split"
    hero = "hero"
    portfolio = "portfolio"

class FontFamilyEnum(str, Enum):
    """Available font families"""
    serif = "serif"
    sans_serif = "sans-serif"
    monospace = "monospace"
    display = "display"

class ColorSchemeEnum(str, Enum):
    """Color scheme options"""
    light = "light"
    dark = "dark"
    custom = "custom"

# Style Pack Models

class StylePackCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    primary_color: str = Field(..., pattern="^#[0-9a-fA-F]{6}$")
    secondary_color: str = Field(..., pattern="^#[0-9a-fA-F]{6}$")
    accent_color: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    background_color: str = Field(..., pattern="^#[0-9a-fA-F]{6}$")
    text_color: str = Field(..., pattern="^#[0-9a-fA-F]{6}$")
    font_family: FontFamilyEnum
    font_size_base: int = Field(16, ge=12, le=24)
    line_height: float = Field(1.5, ge=1.0, le=2.0)
    border_radius: int = Field(4, ge=0, le=20)
    box_shadow: Optional[str] = None
    custom_css: Optional[str] = Field(None, max_length=5000)

class StylePackResponse(StylePackCreateRequest):
    id: str
    portfolio_id: str
    user_id: str
    is_default: bool = False
    preview_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Layout Configuration Models

class LayoutConfigPhase3Request(BaseModel):
    template: LayoutTemplateEnum
    columns: int = Field(1, ge=1, le=4)
    gap: int = Field(20, ge=0, le=100)
    padding: int = Field(20, ge=0, le=100)
    background_color: Optional[str] = None
    custom_css: Optional[str] = Field(None, max_length=2000)

class LayoutConfigPhase3Response(LayoutConfigPhase3Request):
    page_id: str
    portfolio_id: str
    created_at: datetime
    updated_at: datetime

# Layout Variant Models

class LayoutVariantRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    template: LayoutTemplateEnum
    configuration: Dict[str, Any]

class LayoutVariantResponse(LayoutVariantRequest):
    id: str
    preview_image_url: Optional[str] = None
    is_featured: bool = False
    created_at: datetime
    updated_at: datetime

# Typography Models

class TypographyConfigRequest(BaseModel):
    heading_font: FontFamilyEnum
    body_font: FontFamilyEnum
    heading_size: int = Field(32, ge=20, le=64)
    body_size: int = Field(16, ge=12, le=24)
    heading_weight: int = Field(700, ge=400, le=900)
    body_weight: int = Field(400, ge=300, le=900)
    line_height: float = Field(1.5, ge=1.0, le=2.0)
    letter_spacing: float = Field(0.0, ge=-0.05, le=0.1)

class TypographyConfigResponse(TypographyConfigRequest):
    id: str
    style_pack_id: str
    created_at: datetime
    updated_at: datetime

# Spacing Models

class SpacingConfigRequest(BaseModel):
    xs: int = Field(4, ge=0, le=16)
    sm: int = Field(8, ge=0, le=32)
    md: int = Field(16, ge=0, le=64)
    lg: int = Field(24, ge=0, le=128)
    xl: int = Field(32, ge=0, le=256)

# Component Style Models

class ComponentStyleRequest(BaseModel):
    component_type: str = Field(..., min_length=1, max_length=50)
    background_color: Optional[str] = None
    border_color: Optional[str] = None
    border_width: Optional[int] = Field(None, ge=0, le=10)
    border_radius: Optional[int] = Field(None, ge=0, le=20)
    padding: Optional[int] = Field(None, ge=0, le=100)
    margin: Optional[int] = Field(None, ge=0, le=100)
    font_color: Optional[str] = None
    font_size: Optional[int] = Field(None, ge=12, le=32)
    shadow: Optional[str] = None
    hover_state: Optional[Dict[str, Any]] = None

class ComponentStyleResponse(ComponentStyleRequest):
    id: str
    style_pack_id: str
    created_at: datetime
    updated_at: datetime

# Theme Models

class ThemeCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color_scheme: ColorSchemeEnum
    style_pack_id: Optional[str] = None
    typography_config: Optional[TypographyConfigRequest] = None
    spacing_config: Optional[SpacingConfigRequest] = None
    custom_css: Optional[str] = Field(None, max_length=10000)

class ThemeResponse(ThemeCreateRequest):
    id: str
    portfolio_id: str
    user_id: str
    is_active: bool = False
    preview_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# CSS Custom Property Models

class CSSVariableRequest(BaseModel):
    name: str = Field(..., pattern="^--[a-z0-9-]+$")
    value: str = Field(..., max_length=200)
    description: Optional[str] = None

class CSSVariableResponse(CSSVariableRequest):
    id: str
    style_pack_id: str
    created_at: datetime
    updated_at: datetime

# Design System Models

class DesignSystemRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    primary_color: str = Field(..., pattern="^#[0-9a-fA-F]{6}$")
    secondary_color: str = Field(..., pattern="^#[0-9a-fA-F]{6}$")
    neutral_colors: List[str] = Field(..., min_items=3, max_items=5)
    typography: TypographyConfigRequest
    spacing: SpacingConfigRequest
    custom_css: Optional[str] = None

class DesignSystemResponse(DesignSystemRequest):
    id: str
    portfolio_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# Layout Preview Models

class LayoutPreviewRequest(BaseModel):
    template: LayoutTemplateEnum
    layout_config: LayoutConfigPhase3Request
    style_pack_id: Optional[str] = None
    theme_id: Optional[str] = None

class LayoutPreviewResponse(BaseModel):
    preview_html: str
    preview_image_url: Optional[str] = None
    responsive_breakpoints: Dict[str, str]
    accessibility_score: int = Field(ge=0, le=100)
    performance_score: int = Field(ge=0, le=100)

# Template Recommendation Models

class TemplateRecommendationRequest(BaseModel):
    asset_count: int = Field(ge=1, le=1000)
    asset_types: List[str] = Field(..., min_items=1)
    preferred_style: Optional[str] = None

class TemplateRecommendation(BaseModel):
    template: LayoutTemplateEnum
    score: float = Field(ge=0, le=100)
    reason: str
    pros: List[str]
    cons: List[str]

class TemplateRecommendationResponse(BaseModel):
    recommendations: List[TemplateRecommendation]
    best_match: LayoutTemplateEnum
    alternatives: List[LayoutTemplateEnum]

# Design Token Models

class DesignTokenRequest(BaseModel):
    name: str
    category: str
    value: str
    description: Optional[str] = None

class DesignTokenResponse(DesignTokenRequest):
    id: str
    design_system_id: str
    created_at: datetime
    updated_at: datetime

# Style Export Models

class StyleExportRequest(BaseModel):
    format: str = Field(..., pattern="^(css|scss|tailwind|json)$")
    include_css_variables: bool = True
    minify: bool = False

class StyleExportResponse(BaseModel):
    format: str
    content: str
    file_name: str
    file_size_bytes: int
    export_date: datetime


# ==================== AI GENERATION MODELS (Phase 4) ====================

class AiToneEnum(str, Enum):
    academic = "academic"
    professional = "professional"
    creative = "creative"
    technical = "technical"
    marketing = "marketing"

class ContentTypeEnum(str, Enum):
    description = "description"
    brief = "brief"
    strategy = "strategy"
    concept_statement = "concept_statement"
    caption = "caption"
    bio = "bio"
    title = "title"
    tagline = "tagline"

# Project Text Models
class ProjectTextCreate(BaseModel):
    project_id: str
    portfolio_id: Optional[str] = None
    content_type: ContentTypeEnum
    original_text: Optional[str] = None
    generated_text: str
    tone: AiToneEnum
    readability_score: Optional[int] = None
    word_count: Optional[int] = None

class ProjectTextUpdate(BaseModel):
    generated_text: Optional[str] = None
    is_approved: Optional[bool] = None
    is_used: Optional[bool] = None
    readability_score: Optional[int] = None

class ProjectTextResponse(ProjectTextCreate):
    id: str
    ai_model: str
    token_count: Optional[int] = None
    generation_time_ms: Optional[int] = None
    cost_usd: Optional[float] = None
    version: int
    is_approved: bool
    is_used: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None

# AI Usage Models
class AiUsageResponse(BaseModel):
    id: str
    user_id: str
    api_endpoint: str
    api_model: str
    request_date: str
    total_requests: int
    total_tokens: int
    total_cost_usd: float
    success_count: int
    error_count: int
    fallback_count: int
    rate_limited: bool
    last_request_at: datetime
    created_at: datetime
    updated_at: datetime

# Content Version Models
class ProjectTextVersionCreate(BaseModel):
    content_text: str
    tone: Optional[AiToneEnum] = None
    is_better_than_previous: Optional[bool] = None
    feedback: Optional[str] = None

class ProjectTextVersionResponse(ProjectTextVersionCreate):
    id: str
    project_text_id: str
    version_number: int
    generated_at: datetime
    generation_model: str
    created_at: datetime

# Content Suggestions Models
class SuggestionTypeEnum(str, Enum):
    improve_clarity = "improve_clarity"
    improve_brevity = "improve_brevity"
    improve_engagement = "improve_engagement"
    fix_tone = "fix_tone"
    reduce_length = "reduce_length"
    expand_content = "expand_content"
    check_grammar = "check_grammar"

class ContentSuggestionCreate(BaseModel):
    suggestion_type: SuggestionTypeEnum
    current_text: str
    suggested_text: str
    explanation: Optional[str] = None

class ContentSuggestionResponse(ContentSuggestionCreate):
    id: str
    project_text_id: str
    user_action: Optional[str] = None
    user_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    actioned_at: Optional[datetime] = None

# AI Configuration Models
class AiConfigCreate(BaseModel):
    default_tone: AiToneEnum = AiToneEnum.professional
    monthly_token_limit: int = 100000
    daily_request_limit: int = 100
    auto_approve_content: bool = False
    enable_suggestions: bool = True
    preferred_model: str = "llama2"
    enable_ai_features: bool = True
    track_usage: bool = True

class AiConfigResponse(AiConfigCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# AI Generation Request/Response Models
class GenerateDescriptionRequest(BaseModel):
    project_id: str
    tone: AiToneEnum = AiToneEnum.professional

class GenerateDescriptionResponse(BaseModel):
    portfolio_id: str
    project_id: str
    generated_content: Dict[str, str]  # {description, brief, strategy}
    tone: AiToneEnum

class GenerateConceptRequest(BaseModel):
    project_id: str
    tone: AiToneEnum = AiToneEnum.creative

class GenerateConceptResponse(BaseModel):
    project_id: str
    concept_statement: str
    tone: AiToneEnum

class GenerateCaptionRequest(BaseModel):
    asset_id: str
    image_context: str
    tone: AiToneEnum = AiToneEnum.professional

class GenerateCaptionResponse(BaseModel):
    asset_id: str
    caption: str
    tone: AiToneEnum

class GenerateBioRequest(BaseModel):
    architect_name: str
    specialties: List[str] = []
    experience_years: Optional[int] = None
    tone: AiToneEnum = AiToneEnum.professional

class GenerateBioResponse(BaseModel):
    portfolio_id: str
    biography: str
    tone: AiToneEnum

class SuggestTitlesRequest(BaseModel):
    project_id: str
    count: int = Field(5, ge=1, le=10)

class SuggestTitlesResponse(BaseModel):
    project_id: str
    suggested_titles: List[str]
    count: int

class GenerateTaglinesRequest(BaseModel):
    firm_name: str
    specialties: List[str] = []
    tone: AiToneEnum = AiToneEnum.creative

class GenerateTaglinesResponse(BaseModel):
    portfolio_id: str
    suggested_taglines: List[str]
    tone: AiToneEnum

class AnalyzeContentRequest(BaseModel):
    text: str

class AnalyzeContentResponse(BaseModel):
    portfolio_id: str
    analysis: Dict[str, Any]  # {word_count, readability_score, suggestions}

class ImproveTextRequest(BaseModel):
    text: str
    aspect: str = Field("clarity", pattern="^(clarity|brevity|engagement|tone)$")

class ImproveTextResponse(BaseModel):
    portfolio_id: str
    original_text: str
    improved_text: str
    aspect: str

class AvailableTonesResponse(BaseModel):
    tones: List[Dict[str, str]]  # [{name, description}]

# Statistics and Analytics Models
class UserAiStatsResponse(BaseModel):
    user_id: str
    email: str
    total_ai_requests: int
    total_tokens_used: int
    total_cost: float
    successful_requests: int
    total_texts_generated: int
    texts_used_in_portfolio: int

class ContentQualityMetricsResponse(BaseModel):
    content_type: str
    tone: str
    total_generated: int
    avg_readability: Optional[float]
    avg_word_count: Optional[float]
    approved_count: int
    used_count: int
    usage_rate_percent: float
