import type { FlowchartConfig } from './types'

export interface FlowchartPreset {
  id: string
  name: string
  description: string
  config: FlowchartConfig
}

export const PROCESS_PRESETS: FlowchartPreset[] = [
  {
    id: 'nordic-serpentine',
    name: 'Serpentine Scandinavian',
    description: 'Soft wood tones, S-curve flow, and circular images. Calm and sustainable.',
    config: {
      presetId: 'nordic-serpentine',
      pathStyle: 'serpentine',
      nodeStyle: 'image',
      connectorStyle: 'curved',
      lineColor: '#D4A574',
      nodeBorderColor: '#D4A574',
      nodeBgColor: '#F5E6D3',
      textColor: '#1A1A1A',
      lineWidth: 2,
      steps: [
        { id: '1', title: '01 Site Briefing', description: 'Understanding local typography, sun paths, and architectural history.' },
        { id: '2', title: '02 Massing & Void', description: 'Carving out negative spaces to allow light and natural ventilation.' },
        { id: '3', title: '03 Timber Detailing', description: 'Curating local pine, joining details, and sustainable structural members.' },
        { id: '4', title: '04 Delivery', description: 'Final construction of the pavilion sitting lightly on the forest floor.' }
      ]
    }
  },
  {
    id: 'minimal-zen',
    name: 'Minimal Zen Dot',
    description: 'Ultra fine lines, minimal dots, and quiet gray text.',
    config: {
      presetId: 'minimal-zen',
      pathStyle: 'linear-h',
      nodeStyle: 'minimal-dot',
      connectorStyle: 'dashed',
      lineColor: '#CCCCCC',
      nodeBorderColor: '#666666',
      nodeBgColor: '#FFFFFF',
      textColor: '#333333',
      lineWidth: 1,
      steps: [
        { id: '1', title: 'Concept', description: 'The absolute core idea expressed in one single draft sketch.' },
        { id: '2', title: 'Drafting', description: 'Translating the spatial rhythm into precise line drawings.' },
        { id: '3', title: 'Space', description: 'The physical execution of silent residential voids.' }
      ]
    }
  },
  {
    id: 'brutalist-monolith',
    name: 'Brutalist Monolith',
    description: 'Heavy borders, straight lines, and bold monospace numbers.',
    config: {
      presetId: 'brutalist-monolith',
      pathStyle: 'zigzag',
      nodeStyle: 'number',
      connectorStyle: 'sharp',
      lineColor: '#090D16',
      nodeBorderColor: '#090D16',
      nodeBgColor: '#090D16',
      textColor: '#090D16',
      lineWidth: 3,
      steps: [
        { id: '1', title: 'RAW FRAMEWORK', description: 'Casting the primary concrete columns and structural beams.' },
        { id: '2', title: 'TECTONICS', description: 'Detailing formwork textures, tie rod holes, and raw joints.' },
        { id: '3', title: 'MONUMENTS', description: 'Sculpting heavy, cantilevered roofs and deep shadow recesses.' },
        { id: '4', title: 'RE-USE', description: 'Converting industrial relics into raw urban public spaces.' }
      ]
    }
  },
  {
    id: 'parametric-tech',
    name: 'Parametric Generative',
    description: 'Curving cyan grids and mathematical nodes. Tech-forward.',
    config: {
      presetId: 'parametric-tech',
      pathStyle: 'serpentine',
      nodeStyle: 'hexagon',
      connectorStyle: 'curved',
      lineColor: '#00D2FF',
      nodeBorderColor: '#00D2FF',
      nodeBgColor: '#E6F9FF',
      textColor: '#003D99',
      lineWidth: 2,
      steps: [
        { id: '1', title: 'Mesh Topology', description: 'Generating base coordinates and subdivision surface points.' },
        { id: '2', title: 'Solar Vectors', description: 'Scripting panel angles to deflect direct solar heat gain.' },
        { id: '3', title: 'Stress Analysis', description: 'Running Finite Element Analysis to reduce steel thicknesses.' },
        { id: '4', title: 'CNC Jointing', description: 'Milling double-curved plywood plates with custom numbering.' },
        { id: '5', title: 'Assembly', description: 'On-site digital positioning using augmented reality.' }
      ]
    }
  },
  {
    id: 'eco-canopy',
    name: 'Eco-Landscape Leaf',
    description: 'Warm greens and earth tones, leaf/nature themes, circle-images.',
    config: {
      presetId: 'eco-canopy',
      pathStyle: 'linear-v',
      nodeStyle: 'image',
      connectorStyle: 'dashed',
      lineColor: '#2E7D32',
      nodeBorderColor: '#2E7D32',
      nodeBgColor: '#E8F5E9',
      textColor: '#1B5E20',
      lineWidth: 1.5,
      steps: [
        { id: '1', title: 'Soil & Climate Study', description: 'Testing earth composition, water tables, and local wind flows.' },
        { id: '2', title: 'Passive Shading', description: 'Modeling tree canopies to block hot summer sun naturally.' },
        { id: '3', title: 'Local Earth Ramming', description: 'Compacting site clay, sand, and gravel into thick thermal walls.' },
        { id: '4', title: 'Zero-Carbon Lifecycle', description: 'Ensuring all materials disintegrate back into the soil.' }
      ]
    }
  },
  {
    id: 'cad-blueprint',
    name: 'CAD blueprint Grid',
    description: 'Blue blueprint styling with title blocks and grid connector rules.',
    config: {
      presetId: 'cad-blueprint',
      pathStyle: 'linear-h',
      nodeStyle: 'hexagon',
      connectorStyle: 'double',
      lineColor: '#0052CC',
      nodeBorderColor: '#0052CC',
      nodeBgColor: '#E6F0FF',
      textColor: '#071D49',
      lineWidth: 2,
      steps: [
        { id: '1', title: 'Surveying', description: 'Establishing baseline benchmark datum points.' },
        { id: '2', title: 'Zoning Layout', description: 'Mapping setback offsets and building volume margins.' },
        { id: '3', title: 'MEP Coordination', description: 'Superimposing piping, HVAC ducts, and cable trays.' },
        { id: '4', title: 'Tender Drawings', description: 'Generating final construction detailed blueprints.' }
      ]
    }
  },
  {
    id: 'classic-heritage',
    name: 'Classic Heritage Sepia',
    description: 'Serif fonts, sepia tones, double hairlines. Timeless historical feel.',
    config: {
      presetId: 'classic-heritage',
      pathStyle: 'serpentine',
      nodeStyle: 'number',
      connectorStyle: 'double',
      lineColor: '#8C6239',
      nodeBorderColor: '#8C6239',
      nodeBgColor: '#FAF6F0',
      textColor: '#4C3520',
      lineWidth: 1.5,
      steps: [
        { id: '1', title: 'Archival Research', description: 'Reviewing 19th-century facade elevations and records.' },
        { id: '2', title: 'Restoration Plan', description: 'Detailing lime mortar mix ratios and brick bonding patterns.' },
        { id: '3', title: 'Masonry Work', description: 'Reconstruct structural arches and lintels by hand.' }
      ]
    }
  },
  {
    id: 'industrial-concrete',
    name: 'Industrial Concrete',
    description: 'Textured concrete look, charcoal lines, circle-images.',
    config: {
      presetId: 'industrial-concrete',
      pathStyle: 'zigzag',
      nodeStyle: 'image',
      connectorStyle: 'sharp',
      lineColor: '#4A5568',
      nodeBorderColor: '#4A5568',
      nodeBgColor: '#EDF2F7',
      textColor: '#2D3748',
      lineWidth: 2,
      steps: [
        { id: '1', title: 'Concrete Pouring', description: 'Pouring self-consolidating concrete into custom steel molds.' },
        { id: '2', title: 'Curing Check', description: 'Monitoring heat hydration curves for 28-day curing cycles.' },
        { id: '3', title: 'Sandblasting', description: 'Exposing granite aggregates to create rough textured grips.' }
      ]
    }
  },
  {
    id: 'urban-infrastructure',
    name: 'Urban Transit Grid',
    description: 'Transit map style with map markers and dashed connection paths.',
    config: {
      presetId: 'urban-infrastructure',
      pathStyle: 'linear-h',
      nodeStyle: 'hexagon',
      connectorStyle: 'dashed',
      lineColor: '#ED8936',
      nodeBorderColor: '#ED8936',
      nodeBgColor: '#FFFAF0',
      textColor: '#7B341E',
      lineWidth: 2,
      steps: [
        { id: '1', title: 'Pedestrian Flow', description: 'Mapping commuter paths and crowd congestion points.' },
        { id: '2', title: 'Transit Link', description: 'Placing bus lanes, subway stairs, and parking drop-offs.' },
        { id: '3', title: 'Green Spine', description: 'Designing continuous green buffer zones and pocket gardens.' },
        { id: '4', title: 'Civic Plazas', description: 'Establishing open public squares for street activities.' }
      ]
    }
  },
  {
    id: 'corporate-brand',
    name: 'Branded Corporate Blue',
    description: 'Corporate branding, solid blue lines, circle-images.',
    config: {
      presetId: 'corporate-brand',
      pathStyle: 'linear-h',
      nodeStyle: 'image',
      connectorStyle: 'curved',
      lineColor: '#1A365D',
      nodeBorderColor: '#1A365D',
      nodeBgColor: '#EBF8FF',
      textColor: '#2C5282',
      lineWidth: 2.5,
      steps: [
        { id: '1', title: 'Client Workshop', description: 'Defining project targets, budget scales, and core brand values.' },
        { id: '2', title: 'Feasibility Report', description: 'Assessing zoning laws, land costs, and municipal approvals.' },
        { id: '3', title: 'Design Proposal', description: 'Presenting spatial layouts and photorealistic render options.' },
        { id: '4', title: 'Construction Bidding', description: 'Evaluating general contractor tenders and cost estimates.' }
      ]
    }
  },
  {
    id: 'zigzag-timeline',
    name: 'Zig-Zag Path',
    description: 'Alternating high-low zig-zag connector flows.',
    config: {
      presetId: 'zigzag-timeline',
      pathStyle: 'zigzag',
      nodeStyle: 'number',
      connectorStyle: 'sharp',
      lineColor: '#718096',
      nodeBorderColor: '#4A5568',
      nodeBgColor: '#F7FAFC',
      textColor: '#2D3748',
      lineWidth: 2,
      steps: [
        { id: '1', title: 'Step 1: Brief', description: 'Define user requests, timeline constraints, and goals.' },
        { id: '2', title: 'Step 2: Research', description: 'Analyze references, competitor designs, and solutions.' },
        { id: '3', title: 'Step 3: Sketch', description: 'Draft several layout options and curves.' },
        { id: '4', title: 'Step 4: Develop', description: 'Refine details, margins, and border components.' },
        { id: '5', title: 'Step 5: Test', description: 'Validate load capacities and design integrity.' },
        { id: '6', title: 'Step 6: Build', description: 'Final project execution and handover.' }
      ]
    }
  },
  {
    id: 'circular-loop',
    name: 'Feedback Loop Circle',
    description: 'Loop style circular flow diagram. Perfect for iterative design.',
    config: {
      presetId: 'circular-loop',
      pathStyle: 'circular',
      nodeStyle: 'hexagon',
      connectorStyle: 'curved',
      lineColor: '#4FD1C5',
      nodeBorderColor: '#319795',
      nodeBgColor: '#E6FFFA',
      textColor: '#234E52',
      lineWidth: 2,
      steps: [
        { id: '1', title: 'Prototyping', description: 'Creating rough volumetric study models.' },
        { id: '2', title: 'Testing Analysis', description: 'Testing models against wind and sun coordinates.' },
        { id: '3', title: 'Refining Form', description: 'Adjusting shape geometries based on feedback loops.' }
      ]
    }
  },
  {
    id: 'radial-analysis',
    name: 'Radial Hub Analysis',
    description: 'Central concept hub with radial connector spokes.',
    config: {
      presetId: 'radial-analysis',
      pathStyle: 'radial',
      nodeStyle: 'minimal-dot',
      connectorStyle: 'dashed',
      lineColor: '#805AD5',
      nodeBorderColor: '#6B46C1',
      nodeBgColor: '#FAF5FF',
      textColor: '#44337A',
      lineWidth: 1.5,
      steps: [
        { id: '1', title: 'Access & Roads', description: 'Connecting the hub to city roads.' },
        { id: '2', title: 'Solar Orientations', description: 'Rotating the form for climate shadow control.' },
        { id: '3', title: 'Visual Axis lines', description: 'Aligning main openings with landmark views.' },
        { id: '4', title: 'Green Extensions', description: 'Spanning park fingers deep into the courtyard.' },
        { id: '5', title: 'Public Entrance', description: 'Opening the plaza to neighborhood pedestrians.' }
      ]
    }
  },
  {
    id: 'diagonal-rising',
    name: 'Diagonal Progress',
    description: 'A rising slope diagonal timeline representing growth.',
    config: {
      presetId: 'diagonal-rising',
      pathStyle: 'zigzag',
      nodeStyle: 'number',
      connectorStyle: 'sharp',
      lineColor: '#E53E3E',
      nodeBorderColor: '#C53030',
      nodeBgColor: '#FFF5F5',
      textColor: '#742A2A',
      lineWidth: 2,
      steps: [
        { id: '1', title: 'Year 1: Groundwork', description: 'Securing project land rights and core financing.' },
        { id: '2', title: 'Year 2: Foundation', description: 'Excavation and subgrade soil columns injection.' },
        { id: '3', title: 'Year 3: Superstructure', description: 'Erecting 12 floors of load-bearing columns.' },
        { id: '4', title: 'Year 4: Fit-out', description: 'Placing facade glass panels and interior finishes.' }
      ]
    }
  },
  {
    id: 'faceted-hexagon',
    name: 'Faceted Hexagon Flow',
    description: 'Clean hexagonal node styling, straight lines, corporate look.',
    config: {
      presetId: 'faceted-hexagon',
      pathStyle: 'linear-h',
      nodeStyle: 'hexagon',
      connectorStyle: 'sharp',
      lineColor: '#4A5568',
      nodeBorderColor: '#4A5568',
      nodeBgColor: '#F7FAFC',
      textColor: '#2D3748',
      lineWidth: 2,
      steps: [
        { id: '1', title: 'Volumetrics', description: 'Drafting initial spatial boxes on site.' },
        { id: '2', title: 'Circulations', description: 'Connecting cores, corridors, and stairs.' },
        { id: '3', title: 'Structural grid', description: 'Laying out a standard columns spacing system.' },
        { id: '4', title: 'Enclosure', description: 'Designing solid facade panel variations.' }
      ]
    }
  },
  {
    id: 'split-double-track',
    name: 'Split Double-Track',
    description: 'Parallel process tracks for client vs. designer tasks.',
    config: {
      presetId: 'split-double-track',
      pathStyle: 'zigzag',
      nodeStyle: 'minimal-dot',
      connectorStyle: 'dashed',
      lineColor: '#4A5568',
      nodeBorderColor: '#319795',
      nodeBgColor: '#FFFFFF',
      textColor: '#2D3748',
      lineWidth: 1.5,
      steps: [
        { id: '1', title: 'Client Brief', description: 'Client details requests and spatial needs.' },
        { id: '2', title: 'Designer Concept', description: 'Designer drafts preliminary floor plans.' },
        { id: '3', title: 'Client Review', description: 'Client evaluates floor plans and requests edits.' },
        { id: '4', title: 'Final Blueprint', description: 'Designer locks in structural revisions.' }
      ]
    }
  },
  {
    id: 'vertical-milestone',
    name: 'Vertical Milestone Bar',
    description: 'Vertical layout timeline with milestone markers along the left margin.',
    config: {
      presetId: 'vertical-milestone',
      pathStyle: 'linear-v',
      nodeStyle: 'number',
      connectorStyle: 'sharp',
      lineColor: '#3182CE',
      nodeBorderColor: '#3182CE',
      nodeBgColor: '#EBF8FF',
      textColor: '#2B6CB0',
      lineWidth: 2,
      steps: [
        { id: '1', title: 'Kickoff', description: 'Site survey and client program brief locked.' },
        { id: '2', title: 'Schematics', description: 'Volumetric studies and site layout draft.' },
        { id: '3', title: 'Coordination', description: 'Aligning architectural plans with structural loads.' },
        { id: '4', title: 'Approval', description: 'Receiving city municipal clearance certifications.' },
        { id: '5', title: 'Tender', description: 'Releasing final bids packages to general contractors.' }
      ]
    }
  },
  {
    id: 'concept-mindmap',
    name: 'Concept Mindmap Spoke',
    description: 'Concentric mindmap style layout radiating from center.',
    config: {
      presetId: 'concept-mindmap',
      pathStyle: 'radial',
      nodeStyle: 'hexagon',
      connectorStyle: 'curved',
      lineColor: '#D53F8C',
      nodeBorderColor: '#B83280',
      nodeBgColor: '#FFF5F7',
      textColor: '#702459',
      lineWidth: 1.5,
      steps: [
        { id: '1', title: 'Site context', description: 'Evaluating neighboring heights and sun orientations.' },
        { id: '2', title: 'Green space', description: 'Integrating courtyard gardens and rooftop planter lines.' },
        { id: '3', title: 'Urban mesh', description: 'Connecting pathways directly to adjacent light rails.' },
        { id: '4', title: 'Raw craft', description: 'Leveraging local stone tiles and timber carpenters.' },
        { id: '5', title: 'Solar capture', description: 'Placing facade angled panels for winter sun absorption.' }
      ]
    }
  },
  {
    id: 'sketchbook-story',
    name: 'Sketchbook Storyboard',
    description: 'Soft hand-drawn style sepia lines, circular sketch blocks.',
    config: {
      presetId: 'sketchbook-story',
      pathStyle: 'linear-h',
      nodeStyle: 'image',
      connectorStyle: 'dashed',
      lineColor: '#8C6239',
      nodeBorderColor: '#8C6239',
      nodeBgColor: '#FAF0E6',
      textColor: '#4A3728',
      lineWidth: 1.5,
      steps: [
        { id: '1', title: '01 Light Studies', description: 'Hand drafting sun ray lines on watercolor sheets.' },
        { id: '2', title: '02 Volume Mockups', description: 'Building physical model mockups from chipboards.' },
        { id: '3', title: '03 Final Facade', description: 'Detailing textured stone joins and double frames.' }
      ]
    }
  },
  {
    id: 'neon-cyberpunk',
    name: 'Neon Tech Dark',
    description: 'Neon green/black dark mode layout pathing.',
    config: {
      presetId: 'neon-cyberpunk',
      pathStyle: 'serpentine',
      nodeStyle: 'hexagon',
      connectorStyle: 'dashed',
      lineColor: '#39FF14',
      nodeBorderColor: '#39FF14',
      nodeBgColor: '#111111',
      textColor: '#E2E8F0',
      lineWidth: 2,
      steps: [
        { id: '1', title: 'Cyber Analysis', description: 'Scanning topological data points via LIDAR sensors.' },
        { id: '2', title: 'Generative Mesh', description: 'Iterating mesh structural stress simulations.' },
        { id: '3', title: 'Digital Mills', description: 'CNC milling carbon fiber composite cladding joints.' },
        { id: '4', title: 'Final Boot', description: 'Activating facade smart panel rotation scripts.' }
      ]
    }
  }
]
