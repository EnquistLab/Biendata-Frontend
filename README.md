# Biendata-Frontend

<p align="center">
    <img src="public/bien.png" alt="BIEN logo" width="180"/>
</p>

Biendata-Frontend is the web mapping interface for the Botanical Information and Ecology Network (BIEN), supporting discovery, visualization, and download of plant biodiversity data through biendata.org.

This repository powers a user-facing application for researchers, educators, students, conservation practitioners, and biodiversity data users who need fast, map-based access to BIEN observation and range data.

For researchers, the site is a fast entry point for understanding species-level evidence, data coverage, and downloadable BIEN products before deeper ecological or biogeographic analysis.

For developers, this repository is a lightweight Next.js frontend that connects a Mapbox-based UI to BIEN API services and static assets, with most scientific data logic handled upstream by BIEN services rather than in the client itself.

## BIEN in Brief

BIEN is a biodiversity informatics ecosystem focused on integrating plant observations, trait records, and modeled geographic ranges into analysis-ready data products.

Why BIEN matters:
- BIEN addresses a core bottleneck in biodiversity science: data are distributed across many sources with inconsistent taxonomy, geography, and metadata.
- BIEN workflows and services support scalable and reproducible data integration, helping users move from raw records to transparent downstream analyses.
- BIEN enables broad use cases in macroecology, biogeography, conservation planning, and biodiversity forecasting.

Selected publications and references:
- Enquist et al. (2026). BIEN: A biodiversity informatics ecosystem advancing open and reproducible workflows for plant observation, plot and trait data. Methods in Ecology and Evolution, 17(5), 1556-1584. https://doi.org/10.1111/2041-210X.70274
- Maitner et al. (2018). The bien R package: A tool to access the Botanical Information and Ecology Network (BIEN) database. Methods in Ecology and Evolution, 9(2), 373-379. https://doi.org/10.1111/2041-210X.12861

## For Researchers

This frontend is most useful when you need to quickly assess whether BIEN has usable evidence for a focal species or workflow.

- Inspect species occurrence coverage before building SDMs, range summaries, or biodiversity inventories.
- Compare point observations with BIEN range products as separate evidence layers.
- Download species-specific observations, traits, or range files for downstream analysis in R, Python, or GIS tools.
- Use the site as a teaching aid for biodiversity informatics, reproducibility, and ecological data integration.

Researchers should treat the interface as an access and inspection layer, not as the full analytical workflow. Downstream interpretation still depends on the underlying BIEN data products, taxonomic reconciliation, spatial quality checks, and explicit citation/provenance tracking.

## For Developers

This codebase is intentionally narrow in scope: it delivers a public-facing exploration interface and delegates most data-intensive work to BIEN APIs.

- UI state is managed in a small React surface centered on the main map page.
- Species suggestions, observations, ranges, and downloads are fetched from BIEN API endpoints at runtime.
- Static export mode keeps deployment simple and minimizes frontend infrastructure overhead.
- The main engineering concerns in this repo are API integration, UI clarity, and map interaction behavior rather than backend biodiversity processing.

If you are extending the app, start with the map component for user-facing behavior, the sidebar component for layer controls, and the main page entry for shared page state.

## Website Use Cases

The biendata.org frontend supports several practical workflows:
- Species reconnaissance: quickly inspect whether a species has BIEN observations and range products.
- Early-stage SDM and biogeography scoping: visualize observation coverage versus modeled range extent before formal modeling.
- Conservation screening: rapidly inspect species evidence for target regions and shortlist taxa for deeper analysis.
- Teaching and training: demonstrate biodiversity data pipelines and data quality concepts in classes or workshops.
- Reproducible data pull handoff: download observation, trait, and range files for scripted analysis in R or Python.
- Name and data service navigation: jump to BIEN services (TNRS, GNRS, NSR, GVS) and related BIEN apps.

## Repository Deep Dive

Top-level folders and files:

| Path | Purpose |
|---|---|
| components/ | Core UI modules: map container, sidebar controls, and layout shell. |
| pages/ | Next.js route entrypoints (main app entry is pages/index.js). |
| public/ | Static assets (BIEN logo and partner logos rendered in UI controls). |
| export.js | Build/export helper for static output generation. |
| next.config.js | Next.js configuration with static export mode enabled. |
| R_examples.qmd | Example R workflows for BIEN API range downloads. |
| package.json | Runtime and build dependencies, scripts, and app metadata. |
| .next/ | Local build artifacts (generated during development/build). |
| node_modules/ | Installed dependency tree. |

### components/

- Map.js
    - Implements the interactive Mapbox interface.
    - Calls BIEN API endpoints for species suggestions, occurrences, and ranges.
    - Exposes download actions for observations, traits, and range shapefiles.
    - Includes links to BIEN tools and related Shiny explorer apps.
- Sidebar.js
    - Implements layer visibility and opacity controls for map layers and labels.
- Layout.js
    - Coordinates map layout plus collapsible sidebar and navigation controls.

### pages/

- index.js
    - Initializes shared visibility and opacity state.
    - Renders layout plus map components.
    - Includes placeholder Google Analytics integration hooks.

### public/

Includes BIEN and partner logos used in the map UI:
- bien.png
- nceas.png
- nsf.png
- uoa.png
- cyverse.png

## Current App Features

- Species search with exact/fuzzy modes and autocomplete suggestions.
- Interactive globe map with occurrence points and range polygon overlays.
- Layer visibility and opacity controls for observations, ranges, and labels.
- One-click downloads for observations, traits, and range shapefile artifacts.
- Service links to TNRS, GNRS, NSR, and GVS.
- External BIEN species and trait explorer links.

## API Integration Notes

The frontend reads from a BIEN API base URL defined by environment variable:
- NEXT_PUBLIC_API_BASE_URL

If not set, the app falls back to:
- https://mint-pheasant.nceas.ucsb.edu:5775

Map rendering requires:
- NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

## Technology Stack

- Next.js (static export mode)
- React
- Mapbox GL JS
- Turf.js
- react-icons
- BIEN REST endpoints

## Getting Started

### Prerequisites

- Node.js 18+
- A Mapbox access token

### Setup

1. Clone the repository.
     ```bash
     git clone https://github.com/EnquistLab/Biendata-Frontend.git
     cd Biendata-Frontend
     ```

2. Install dependencies.
     ```bash
     npm install --legacy-peer-deps
     ```

3. Create a local environment file.
     ```env
     NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here
     NEXT_PUBLIC_API_BASE_URL=https://mint-pheasant.nceas.ucsb.edu:5775
     ```

4. Start development server.
     ```bash
     npm run dev
     ```

5. Build static production output.
     ```bash
     npm run build
     ```

Development server runs on:
- http://localhost:3004

## Deployment

This project is configured for static export. Deploy the built output to a static host after running:

```bash
npm run build
```

Production site:
- https://biendata.org

## Data and Interpretation Notes

- BIEN range layers and BIEN observation layers are distinct evidence products and should be interpreted accordingly.
- Data completeness and quality vary by species, geography, and source collections.
- For publication workflows, use BIEN citation guidance and preserve provenance metadata in downstream analyses.

## Acknowledgements

BIEN is supported by collaborating institutions and funders including NSF, NCEAS, University of Arizona, and CyVerse. See BIEN project resources for current contributor and funding details.
