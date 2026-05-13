# Biendata-Frontend

<p align="center">
  <img src="public/bien.png" alt="BIEN logo" width="180"/>
</p>

**Biendata-Frontend** is the interactive web interface for the [Botanical Information and Ecology Network (BIEN)](http://biendata.org) — a continental-scale database of plant occurrence records, species range maps, and functional trait data for vascular plants of the Americas.

The application provides researchers, educators, and the public with map-based access to BIEN data, supporting biodiversity discovery, range visualization, and data export. The frontend communicates with the BIEN API backend hosted at NCEAS (UC Santa Barbara).

## Features

- **Species Search**: Search for vascular plant species by name with exact or fuzzy matching.
- **Interactive Map**: Visualize georeferenced occurrence records and modeled range maps via Mapbox GL JS.
- **Layer Control**: Toggle map layers including observations, range polygons, and geographic labels (country, state, city).
- **Download Options**: Export species data as observations (CSV), functional traits (CSV), or range shapefiles directly from the interface.
- **Explore Apps**: Links to the BIEN Species Explorer and BIEN Traits Explorer — external Shiny apps for deeper interactive analysis of occurrence records and functional trait data (hosted on shinyapps.io).

## Data Sources

BIEN integrates data from herbarium collections, vegetation plots, and trait databases across North, Central, and South America. Data are taxonomically standardized, quality-controlled for geospatial accuracy, and linked to authoritative checklists. See [biendata.org](http://biendata.org) for full provenance and citation information.

## Tech Stack

- **Next.js** (static export) — React-based frontend framework
- **Mapbox GL JS** — interactive map rendering
- **react-icons** — icon library
- **BIEN REST API** — backend data layer hosted at NCEAS

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Mapbox access token](https://account.mapbox.com/access-tokens/) (required for map rendering)

### Setup

1. **Clone the repository**
    ```bash
    git clone https://github.com/EnquistLab/Biendata-Frontend.git
    cd Biendata-Frontend
    ```

2. **Install dependencies**
    ```bash
    npm install --legacy-peer-deps
    ```
    > `--legacy-peer-deps` is required due to a peer dependency conflict in react-leaflet.

3. **Set your Mapbox token**

    Create a `.env.local` file in the project root:
    ```
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here
    ```

4. **Run the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3004](http://localhost:3004) in your browser.

5. **Build for production**
    ```bash
    npm run build
    ```
    Static output is generated in the `out/` directory.

## Usage

- Search for a species using the search bar at the top of the map.
- View occurrence points and range polygons rendered on the interactive map.
- Use the layer control panel (left sidebar) to toggle layer visibility and adjust opacity.
- Download data using the download icon in the top bar.
- Access the BIEN Explorer Shiny apps via the compass icon in the top bar.

## Deployment

This application is deployed as a static site. After building (`npm run build`), serve the contents of `out/` from any static web host. The production instance at [biendata.org](http://biendata.org) is managed by NCEAS.

## Acknowledgements

BIEN is supported by the National Science Foundation, CyVerse, NCEAS, and the University of Arizona. See [biendata.org](http://biendata.org) for full funding and contributor acknowledgements.
