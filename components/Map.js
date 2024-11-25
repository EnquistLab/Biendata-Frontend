import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import { FaSearch, FaDownload, FaUserCircle } from 'react-icons/fa';
import Link from 'next/link';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mint-pheasant.nceas.ucsb.edu:5775';

const Map = ({ initialCenter, visibilitySettings, opacitySettings }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const countryLabelLayerIDs = useRef([]);
    const otherLabelLayerIDs = useRef([]);
    const [searchTerm, setSearchTerm] = useState('Pinus ponderosa');
    const [suggestions, setSuggestions] = useState([]);
    const [searchMode, setSearchMode] = useState('Exact');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const debounceTimeout = useRef(null);
    const [clickedButton, setClickedButton] = useState(null);
    const [hoveredButton, setHoveredButton] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false); 

    // Helper function to format species name for SQL
    const formatSpeciesForSQL = (name) => {
        // Replace underscores with spaces
        return name.replace(/_/g, ' ');
    };

    // Helper function to format species name
    const formatSpeciesName = (name) => {
        return name.replace(/\s+/g, '_');
    };

    useEffect(() => {
        if (showDownloadOptions && showProfileMenu) {
            setShowProfileMenu(false);
        }
    }, [showDownloadOptions]);

    useEffect(() => {
        if (showProfileMenu && showDownloadOptions) {
            setShowDownloadOptions(false);
        }
    }, [showProfileMenu]);

    // Debounced fetch for suggestions
    const fetchSuggestions = (value) => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(async () => {
            if (value.length < 2) {
                setSuggestions([]);
                return;
            }
            try {
                // Format the keyword to use underscores for the API request
                const formattedKeyword = value.replace(/\s+/g, '_');
                const res = await fetch(
                    `${API_BASE_URL}/api/species?keyword=${encodeURIComponent(formattedKeyword)}&mode=${searchMode}`
                );
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                setSuggestions(data);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }, 300);
    };

    // Fetch species range geometry from the API
    const fetchSpeciesRange = async (species) => {
        const formattedSpecies = formatSpeciesName(species);
        try {
            const res = await fetch(`${API_BASE_URL}/api/range`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ species: formattedSpecies }),
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const { range } = await res.json();
            if (map.current.getSource('speciesRange')) {
                if (map.current.getLayer('speciesRangeLayer')) {
                    map.current.removeLayer('speciesRangeLayer');
                }
                map.current.removeSource('speciesRange');
            }
            // Load the new range data as a source in Mapbox
            map.current.addSource('speciesRange', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: range,
                },
            });
            map.current.addLayer({
                id: 'speciesRangeLayer',
                type: 'fill',
                source: 'speciesRange',
                layout: {},
                paint: {
                    'fill-color': 'rgba(34, 139, 34, 0.5)', // Forest green color
                    'fill-opacity': opacitySettings && opacitySettings['Range'] ? opacitySettings['Range'] : 0.5,
                },
            });
            const bbox = turf.bbox({
                type: 'Feature',
                geometry: range,
            });
            map.current.fitBounds(bbox, { padding: 20, pitch: 0, bearing: 0 });
        } catch (error) {
            console.error('Error fetching species range:', error);
        }
    };

    // Fetch species observations from the API
    const fetchSpeciesObservations = async (species) => {
        const formattedSpecies = formatSpeciesName(species);
        try {
            const res = await fetch(`${API_BASE_URL}/api/observations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ species: formattedSpecies }),
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            if (data.length === 0) {
                console.log('No observations found for the species:', species);
                // Remove the observations layer and source if they exist
                if (map.current.getSource('observations')) {
                    if (map.current.getLayer('observationsLayer')) {
                        map.current.removeLayer('observationsLayer');
                    }
                    map.current.removeSource('observations');
                }
                return;
            }
            // Build a GeoJSON FeatureCollection from the data
            const features = data.map((item) => ({
                type: 'Feature',
                geometry: JSON.parse(item.geojson_geom),
                properties: {
                    species: item.species,
                    gid: item.gid,
                },
            }));
            const geojsonData = {
                type: 'FeatureCollection',
                features: features,
            };
            // Remove existing source and layer if they exist
            if (map.current.getSource('observations')) {
                if (map.current.getLayer('observationsLayer')) {
                    map.current.removeLayer('observationsLayer');
                }
                map.current.removeSource('observations');
            }
            map.current.addSource('observations', {
                type: 'geojson',
                data: geojsonData,
            });
            map.current.addLayer({
                id: 'observationsLayer',
                type: 'circle',
                source: 'observations',
                layout: {},
                paint: {
                    'circle-radius': 4, 
                    'circle-color': '#ff4500', 
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity':
                        opacitySettings && opacitySettings['Observations'] ? opacitySettings['Observations'] : 0.8,
                    'circle-stroke-width': 1,
                },
            });
        } catch (error) {
            console.error('Error fetching species observations:', error);
        }
    };

    // Function to get label layer IDs
    function getLabelLayerIDs(mapInstance) {
        const layers = mapInstance.getStyle().layers;
        const countryLabels = [];
        const otherLabels = [];
        layers.forEach((layer) => {
            if (
                layer.type === 'symbol' &&
                layer.layout &&
                layer.layout['text-field'] &&
                layer.id.toLowerCase().includes('label')
            ) {
                if (layer.id.toLowerCase().includes('country')) {
                    countryLabels.push(layer.id);
                } else {
                    otherLabels.push(layer.id);
                }
            }
        });
        return { countryLabels, otherLabels };
    }

    // Function to re-add layers and settings after style change
    const reAddLayersAndSettings = () => {
        // Get label layer IDs
        const { countryLabels, otherLabels } = getLabelLayerIDs(map.current);
        countryLabelLayerIDs.current = countryLabels;
        otherLabelLayerIDs.current = otherLabels;

        // Set visibility and opacity of country labels
        const opacityCountryLabel =
            opacitySettings && opacitySettings['Country Label'] !== undefined
                ? opacitySettings['Country Label']
                : 1;

        const visibilityCountryLabel =
            visibilitySettings && visibilitySettings['Country Label'] === false ? 'none' : 'visible';

        countryLabelLayerIDs.current.forEach((layerID) => {
            map.current.setLayoutProperty(layerID, 'visibility', visibilityCountryLabel);
            map.current.setPaintProperty(layerID, 'text-opacity', opacityCountryLabel);
        });

        // Set visibility and opacity of state and city labels
        const opacityOtherLabels =
            opacitySettings && opacitySettings['State and City Labels'] !== undefined
                ? opacitySettings['State and City Labels']
                : 1;

        const visibilityOtherLabels =
            visibilitySettings && visibilitySettings['State and City Labels'] === false ? 'none' : 'visible';

        otherLabelLayerIDs.current.forEach((layerID) => {
            map.current.setLayoutProperty(layerID, 'visibility', visibilityOtherLabels);
            map.current.setPaintProperty(layerID, 'text-opacity', opacityOtherLabels);
        });

        // Re-add species range layer if it exists
        if (map.current.getSource('speciesRange')) {
            map.current.addLayer({
                id: 'speciesRangeLayer',
                type: 'fill',
                source: 'speciesRange',
                layout: {},
                paint: {
                    'fill-color': 'rgba(34, 139, 34, 0.5)',
                    'fill-opacity': opacitySettings && opacitySettings['Range'] ? opacitySettings['Range'] : 0.5,
                },
            });
        }

        // Re-add observations layer if it exists
        if (map.current.getSource('observations')) {
            map.current.addLayer({
                id: 'observationsLayer',
                type: 'circle',
                source: 'observations',
                layout: {},
                paint: {
                    'circle-radius': 4, // Ensure the reduced radius is maintained
                    'circle-color': '#ff4500',
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity':
                        opacitySettings && opacitySettings['Observations'] ? opacitySettings['Observations'] : 0.8,
                    'circle-stroke-width': 1,
                },
            });
        }
    };

    // Initialize the map
    useEffect(() => {
        if (map.current) return;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/outdoors-v11',
            center: initialCenter || [0, 0],
            zoom: 2,
            projection: 'globe',
        });

        map.current.on('style.load', () => {
            map.current.setFog({
                range: [1.0, 7.0],
                color: 'white',
                'horizon-blend': 0.1,
            });

            reAddLayersAndSettings();
            // Fetch default species range and observations on initial load
            fetchSpeciesRange('Pinus ponderosa');
            fetchSpeciesObservations('Pinus ponderosa');
        });

        // Add zoom and compass controls (vertical arrangement by default)
        const nav = new mapboxgl.NavigationControl({ showCompass: true });
        map.current.addControl(nav, 'bottom-right');

        // Add the watermark control to the map (bien.png)
        map.current.addControl(addWatermarkControl(), 'bottom-right');

        // Add the left corner logos (nceas.png, uoa.png, nsf.png)
        map.current.addControl(addLeftLogosControl(), 'bottom-left');

        // Add custom reset button
        const resetButton = document.createElement('button');
        resetButton.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-reset';
        resetButton.type = 'button';
        resetButton.title = 'Reset Map';
        resetButton.innerHTML = '🏠';
        resetButton.style.fontSize = '1.2rem';
        resetButton.style.lineHeight = '1.2';
        resetButton.style.padding = '10px';
        resetButton.style.height = '40px';
        resetButton.style.width = '40px';
        resetButton.style.cursor = 'pointer';

        resetButton.onclick = () => {
            setSearchTerm('Pinus ponderosa');
            fetchSpeciesRange('Pinus ponderosa');
            fetchSpeciesObservations('Pinus ponderosa');
        };

        const resetControl = document.createElement('div');
        resetControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        resetControl.appendChild(resetButton);
        map.current.addControl(
            {
                onAdd: function () {
                    return resetControl;
                },
                onRemove: function () {
                    resetControl.parentNode.removeChild(resetControl);
                },
            },
            'bottom-right'
        );

        // Add terrain toggle control
        const terrainControl = document.createElement('div');
        terrainControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        const terrainButton = document.createElement('button');
        terrainButton.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-terrain';
        terrainButton.type = 'button';
        terrainButton.title = 'Toggle Terrain';
        terrainButton.innerHTML = '🗺️';
        terrainButton.style.fontSize = '1.2rem';
        terrainButton.style.lineHeight = '1.2';
        terrainButton.style.padding = '10px';
        terrainButton.style.height = '40px';
        terrainButton.style.width = '40px';
        terrainButton.style.cursor = 'pointer';
        terrainButton.onclick = () => {
            const style = map.current.getStyle();
            if (style.name === 'Mapbox Satellite Streets') {
                map.current.setStyle('mapbox://styles/mapbox/outdoors-v11');
            } else {
                map.current.setStyle('mapbox://styles/mapbox/satellite-streets-v11');
            }
            map.current.once('style.load', () => {
                reAddLayersAndSettings();
            });
        };

        terrainControl.appendChild(terrainButton);
        map.current.addControl(
            {
                onAdd: function () {
                    return terrainControl;
                },
                onRemove: function () {
                    terrainControl.parentNode.removeChild(terrainControl);
                },
            },
            'bottom-right'
        );
    }, [initialCenter]);

    // Custom control for the BIEN watermark (bien.png)
    const addWatermarkControl = () => {
        const watermarkContainer = document.createElement('div');
        watermarkContainer.className = 'mapboxgl-ctrl mapboxgl-ctrl-watermark';

        watermarkContainer.onclick = () => {
            window.open('https://bien.nceas.ucsb.edu/bien/biendata/bien-3/#bien3org', '_blank');
        };

        const img = document.createElement('img');
        img.src = '/bien.png';
        img.alt = 'BIEN Logo';
        img.style.width = '190px';
        img.style.opacity = '1';
        img.style.cursor = 'pointer';
        img.style.position = 'relative';
        img.style.right = '100px';
        img.style.bottom = '-80px';
        img.style.margin = '10px';
        watermarkContainer.appendChild(img);

        return {
            onAdd: function () {
                return watermarkContainer;
            },
            onRemove: function () {
                watermarkContainer.parentNode.removeChild(watermarkContainer);
            },
        };
    };

    const addLeftLogosControl = () => {
        const leftLogosContainer = document.createElement('div');
        leftLogosContainer.className = 'mapboxgl-ctrl mapboxgl-ctrl-left-logos';
        leftLogosContainer.style.display = 'flex';
        leftLogosContainer.style.flexDirection = 'row'; 
        leftLogosContainer.style.alignItems = 'center';
        leftLogosContainer.style.justifyContent = 'space-between';
        leftLogosContainer.style.margin = '10px';

        const logos = [
            { src: '/uoa.png', alt: 'University of Arizona Logo', link: 'https://eeb.arizona.edu' },
            { src: '/nceas.png', alt: 'NCEAS Logo', link: 'https://www.nceas.ucsb.edu' },
            { src: '/nsf.png', alt: 'NSF Logo', link: 'https://www.nsf.gov' },
        ];

        logos.forEach((logo) => {
            const img = document.createElement('img');
            img.src = logo.src;
            img.alt = logo.alt;
            img.style.width = '130px';
            img.style.opacity = '0.8';
            img.style.cursor = 'pointer';
            img.style.marginRight = '30px';
            img.onclick = () => {
                window.open(logo.link, '_blank');
            };
            leftLogosContainer.appendChild(img);
        });

        return {
            onAdd: function () {
                return leftLogosContainer;
            },
            onRemove: function () {
                leftLogosContainer.parentNode.removeChild(leftLogosContainer);
            },
        };
    };

    // Update visibility when the visibilitySettings change
    useEffect(() => {
        if (map.current) {
            // Handle 'Range' visibility
            if (map.current.getLayer('speciesRangeLayer')) {
                const visibility =
                    visibilitySettings && visibilitySettings['Range'] === false ? 'none' : 'visible';
                map.current.setLayoutProperty('speciesRangeLayer', 'visibility', visibility);
            }
            // Handle 'Observations' visibility
            if (map.current.getLayer('observationsLayer')) {
                const visibility =
                    visibilitySettings && visibilitySettings['Observations'] === false ? 'none' : 'visible';
                map.current.setLayoutProperty('observationsLayer', 'visibility', visibility);
            }
            // Handle 'Country Label' visibility
            if (countryLabelLayerIDs.current && countryLabelLayerIDs.current.length > 0) {
                const visibility =
                    visibilitySettings && visibilitySettings['Country Label'] === false ? 'none' : 'visible';
                countryLabelLayerIDs.current.forEach((layerID) => {
                    map.current.setLayoutProperty(layerID, 'visibility', visibility);
                });
            }
            // Handle 'State and City Labels' visibility
            if (otherLabelLayerIDs.current && otherLabelLayerIDs.current.length > 0) {
                const visibility =
                    visibilitySettings && visibilitySettings['State and City Labels'] === false ? 'none' : 'visible';
                otherLabelLayerIDs.current.forEach((layerID) => {
                    map.current.setLayoutProperty(layerID, 'visibility', visibility);
                });
            }
        }
    }, [visibilitySettings]);

    // Update opacity when the opacitySettings change
    useEffect(() => {
        if (map.current) {
            // Handle 'Range' opacity
            if (map.current.getLayer('speciesRangeLayer')) {
                map.current.setPaintProperty(
                    'speciesRangeLayer',
                    'fill-opacity',
                    opacitySettings && opacitySettings['Range'] ? opacitySettings['Range'] : 0.5
                );
            }
            // Handle 'Observations' opacity
            if (map.current.getLayer('observationsLayer')) {
                map.current.setPaintProperty(
                    'observationsLayer',
                    'circle-opacity',
                    opacitySettings && opacitySettings['Observations'] ? opacitySettings['Observations'] : 0.8
                );
            }
            // Handle 'Country Label' opacity
            if (countryLabelLayerIDs.current && countryLabelLayerIDs.current.length > 0) {
                const opacity =
                    opacitySettings && opacitySettings['Country Label'] !== undefined
                        ? opacitySettings['Country Label']
                        : 1;
                countryLabelLayerIDs.current.forEach((layerID) => {
                    map.current.setPaintProperty(layerID, 'text-opacity', opacity);
                });
            }
            // Handle 'State and City Labels' opacity
            if (otherLabelLayerIDs.current && otherLabelLayerIDs.current.length > 0) {
                const opacity =
                    opacitySettings && opacitySettings['State and City Labels'] !== undefined
                        ? opacitySettings['State and City Labels']
                        : 1;
                otherLabelLayerIDs.current.forEach((layerID) => {
                    map.current.setPaintProperty(layerID, 'text-opacity', opacity);
                });
            }
        }
    }, [opacitySettings]);

    // Handle input change for search
    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        fetchSuggestions(value);
        setShowSuggestions(true);
    };

    const handleSuggestionClick = (suggestion) => {
        // Display species name with spaces, but use underscores for API requests
        const speciesNameWithSpaces = suggestion.species.replace(/_/g, ' ');
        setSearchTerm(speciesNameWithSpaces);
        setSuggestions([]);
        setShowSuggestions(false);

        // Fetch data using the formatted name with underscores
        const formattedSpecies = speciesNameWithSpaces.replace(/\s+/g, '_');
        fetchSpeciesRange(formattedSpecies);
        fetchSpeciesObservations(formattedSpecies);
    };

    // Handle search submit
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm) {
            // Format searchTerm to replace spaces with underscores for API requests
            const formattedSpecies = searchTerm.replace(/\s+/g, '_');
            fetchSpeciesRange(formattedSpecies);
            fetchSpeciesObservations(formattedSpecies);
        }
    };

    // Handle download options toggle
    const handleDownloadClick = () => {
        if (showDownloadOptions) {
            setClickedButton(null);
        }
        setShowDownloadOptions(!showDownloadOptions);
    };

    // Handle download functions
    const handleDownloadButtonClick = (buttonName) => {
        setClickedButton(buttonName);
        let url;

        // Determine the URL based on the button clicked
        if (buttonName === 'observations') {
            url = `${API_BASE_URL}/api/download/observations?species=${encodeURIComponent(
                formatSpeciesName(searchTerm)
            )}`;
        } else if (buttonName === 'traits') {
            url = `${API_BASE_URL}/api/download/traits?species=${encodeURIComponent(
                formatSpeciesForSQL(formatSpeciesName(searchTerm))
            )}`;
        } else if (buttonName === 'rangeshape') {
            url = `${API_BASE_URL}/api/download/range?species=${encodeURIComponent(formatSpeciesName(searchTerm))}`;
        }

        if (url) {
            window.open(url, '_blank');
        }
    };

    // Handle mouse enter and leave for download buttons
    const handleMouseEnter = (buttonName) => setHoveredButton(buttonName);
    const handleMouseLeave = () => setHoveredButton(null);

    return (
        <div style={styles.mapContainer}>
            <div ref={mapContainer} style={styles.map} />
            {/* Search and Layer Controls */}
            <form onSubmit={handleSearchSubmit} style={styles.searchContainer}>
                <div style={styles.searchWrapper}>
                    <div style={styles.searchBox}>
                        <FaSearch style={styles.searchIcon} onClick={handleSearchSubmit} />
                        <input
                            type="text"
                            placeholder="Search for Species"
                            style={styles.searchInput}
                            value={searchTerm}
                            onChange={handleInputChange}
                            onFocus={() => setShowSuggestions(true)}
                        />
                        <div style={styles.searchOptions}>
                            <button
                                style={{
                                    ...styles.searchOptionButton,
                                    ...(searchMode === 'Exact' ? styles.activeButton : {}),
                                }}
                                onClick={() => setSearchMode('Exact')}
                                type="button"
                            >
                                Exact
                            </button>
                            <button
                                style={{
                                    ...styles.searchOptionButton,
                                    ...(searchMode === 'Fuzzy' ? styles.activeButton : {}),
                                }}
                                onClick={() => setSearchMode('Fuzzy')}
                                type="button"
                            >
                                Fuzzy
                            </button>
                        </div>
                        {/* Download icon and menu */}
                        <div style={styles.iconWrapper}>
                            <FaDownload style={styles.downloadIcon} onClick={handleDownloadClick} />
                            {showDownloadOptions && (
                                <div style={styles.downloadOptionsContainer}>
                                    <button
                                        style={{
                                            ...styles.downloadOptionButton,
                                            backgroundColor:
                                                clickedButton === 'observations' || hoveredButton === 'observations'
                                                    ? '#6A5ACD'
                                                    : '#228B22',
                                        }}
                                        onClick={() => handleDownloadButtonClick('observations')}
                                        onMouseEnter={() => handleMouseEnter('observations')}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        Download Observations
                                    </button>
                                    <button
                                        style={{
                                            ...styles.downloadOptionButton,
                                            backgroundColor:
                                                clickedButton === 'traits' || hoveredButton === 'traits'
                                                    ? '#6A5ACD'
                                                    : '#228B22',
                                        }}
                                        onClick={() => handleDownloadButtonClick('traits')}
                                        onMouseEnter={() => handleMouseEnter('traits')}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        Download Traits
                                    </button>
                                    <button
                                        style={{
                                            ...styles.downloadOptionButton,
                                            backgroundColor:
                                                clickedButton === 'rangeshape' || hoveredButton === 'rangeshape'
                                                    ? '#6A5ACD'
                                                    : '#228B22',
                                        }}
                                        onClick={() => handleDownloadButtonClick('rangeshape')}
                                        onMouseEnter={() => handleMouseEnter('rangeshape')}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        Download Range Shapefile
                                    </button>
                                    {/* Beta Version Text */}
                                    <div style={styles.betaVersionText}>(**Beta Version**)</div>
                                </div>
                            )}
                        </div>
                        {/* Profile icon and menu */}
                        <div style={styles.iconWrapper}>
                            <FaUserCircle
                                style={styles.profileIcon}
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                            />
                            {showProfileMenu && (
                                <div style={styles.profileMenu}>
                                    <a
                                        href="https://bien.nceas.ucsb.edu/bien/"
                                        style={styles.profileMenuItem}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        BIEN
                                    </a>
                                    <a
                                        href="https://bien.nceas.ucsb.edu/bien/biendata/bien-4/"
                                        style={styles.profileMenuItem}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        About
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Suggestions list */}
                    {showSuggestions && suggestions.length > 0 && (
                        <ul style={styles.suggestionsList}>
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    style={styles.suggestionItem}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion.species.replace(/_/g, ' ')}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </form>
        </div>
    );
};

// Styles for the map and other elements
const styles = {
    mapContainer: {
        position: 'relative',
        height: '98.2vh',
        width: '99.2vw',
        overflow: 'hidden',
    },
    map: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    searchContainer: {
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
    },
    searchWrapper: {
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: '8px 12px',
        borderRadius: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        width: '100%',
        boxSizing: 'border-box',
    },
    searchIcon: {
        fontSize: '22px',
        color: '#888',
        marginRight: '8px',
        cursor: 'pointer',
        flexShrink: 0,
    },
    searchInput: {
        flex: 1,
        border: 'none',
        outline: 'none',
        fontSize: '16px',
        color: '#333',
        padding: '6px',
        WebkitAppearance: 'none',
        boxSizing: 'border-box',
    },
    searchOptions: {
        display: 'flex',
        marginLeft: '10px',
        flexShrink: 0,
    },
    searchOptionButton: {
        padding: '6px 10px',
        marginLeft: '5px',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '20px',
        backgroundColor: '#f0f0f0',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
    },
    activeButton: {
        backgroundColor: '#228b22',
        color: '#fff',
    },
    iconWrapper: {
        position: 'relative',
        marginLeft: '10px',
    },
    downloadIcon: {
        fontSize: '22px',
        color: '#888',
        cursor: 'pointer',
        flexShrink: 0,
    },
    profileIcon: {
        fontSize: '28px',
        color: '#888',
        cursor: 'pointer',
        flexShrink: 0,
    },
    profileMenu: {
        position: 'absolute',
        top: '43px',
        right: '0',
        zIndex: 3,
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
        width: '200px', 
        fontFamily: 'Arial, sans-serif',
    },
    profileMenuItem: {
        padding: '10px 15px',
        color: '#333',
        textDecoration: 'none',
        fontSize: '16px',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
        fontFamily: 'Arial, sans-serif',
    },
    suggestionsList: {
        position: 'absolute',
        top: '110%', 
        left: '0',
        right: '0',
        zIndex: 3,
        backgroundColor: '#fff',
        listStyleType: 'none',
        margin: '0',
        padding: '0',
        maxHeight: '200px',
        overflowY: 'auto',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        fontFamily: 'Arial, sans-serif',
    },
    suggestionItem: {
        padding: '10px 15px',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
        fontFamily: 'Arial, sans-serif',
    },
    downloadOptionsContainer: {
        position: 'absolute',
        top: '40px',
        right: '0',
        zIndex: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '10px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        width: '200px', 
    },
    downloadOptionButton: {
        padding: '10px',
        marginBottom: '5px',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '5px',
        backgroundColor: '#228B22', 
        color: '#fff',
        fontSize: '14px',
        transition: 'background-color 0.3s ease',
        userSelect: 'none',
        fontFamily: 'Arial, sans-serif',
    },
    betaVersionText: {
        marginTop: '5px',
        color: '#888',
        fontSize: '12px',
        textAlign: 'center',
        fontStyle: 'italic',
        fontFamily: 'Arial, sans-serif',
    },
    // Add media queries for mobile responsiveness
    '@media (max-width: 768px)': {
        searchContainer: {
            top: '10px',
            left: '10px',
            right: '10px',
        },
        searchBox: {
            maxWidth: '100%',
            padding: '6px 8px',
        },
        searchInput: {
            fontSize: '14px',
        },
        searchOptionButton: {
            padding: '4px 8px',
            fontSize: '12px',
        },
        iconWrapper: {
            marginLeft: '5px',
        },
        downloadIcon: {
            fontSize: '20px',
        },
        profileIcon: {
            fontSize: '24px',
        },
        profileMenu: {
            width: '200px', 
        },
        downloadOptionsContainer: {
            width: '200px', 
        },
    },
};

export default Map;
