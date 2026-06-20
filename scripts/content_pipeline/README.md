# Content Pipeline

This pipeline extracts color palettes, layout heuristics, and typography information from user-provided PDF portfolios, and automatically registers them as new "Cosmo Special" templates in the `ArchPortfolio Generator`.

## Workflow

1. **Install dependencies:**
   ```bash
   pip install -r scripts/content_pipeline/requirements.txt
   ```

2. **Drop PDFs:**
   Place your source PDF files into the `input/` folder:
   ```
   scripts/content_pipeline/input/my-portfolio.pdf
   scripts/content_pipeline/input/another-portfolio.pdf
   ```

3. **Run everything at once:**
   ```bash
   python scripts/content_pipeline/run_all.py
   ```

### Step-by-Step Execution

You can also run the pipeline step by step:

```bash
# 1. Parse PDFs → output/*.json + previews/*.png
python scripts/content_pipeline/extract_template.py

# 2. Map Layouts → patches layoutSpecs.ts
python scripts/content_pipeline/generate_layouts.py

# 3. Merge Templates → patches templates.json
python scripts/content_pipeline/merge_templates.py
```

### Result
- Hard-refresh `/dashboard/templates`.
- New templates appear under the "Cosmo Special" category.
- Their extracted layouts appear in the layout picker for ALL templates.
