import { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Sidebar = ({
                     show,
                     visibilitySettings = {},
                     opacitySettings = {},
                     onVisibilityChange,
                     onOpacityChange,
                 }) => {
    const [activeSections, setActiveSections] = useState([]);
    const [currentVisibilitySettings, setCurrentVisibilitySettings] = useState({
        Range: true,
        Observations: true,
        'Country Label': true,
        'State and City Labels': true,
        ...visibilitySettings,
    });

    // Toggles the section for showing/hiding slider (dropdown)
    const toggleSection = (section) => {
        setActiveSections((prevSections) =>
            prevSections.includes(section)
                ? prevSections.filter((item) => item !== section)
                : [...prevSections, section]
        );
    };

    // Toggles visibility for each layer
    const handleVisibilityChange = (section) => {
        const newVisibility = !currentVisibilitySettings[section];

        // Update local state to reflect changes immediately
        setCurrentVisibilitySettings((prevSettings) => ({
            ...prevSettings,
            [section]: newVisibility,
        }));

        // Call the external handler to update the map or other state
        if (onVisibilityChange) {
            onVisibilityChange(section, newVisibility);
        }
    };

    // Updates opacity for each layer
    const handleOpacityChange = (section, value) => {
        if (onOpacityChange) {
            onOpacityChange(section, parseFloat(value));
        }
    };

    return (
        <div
            style={{
                ...sidebarStyle,
                transform: show ? 'translateX(0)' : 'translateX(-100%)',
            }}
        >
            {/* Include the style for the slider */}
            <style>
                {`
                .slider {
                    -webkit-appearance: none;
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: #ddd;
                    outline: none;
                    opacity: 0.7;
                    transition: opacity .2s;
                }
                .slider:hover {
                    opacity: 1;
                }
                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #228B22; /* Green color */
                    cursor: pointer;
                }
                .slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #228B22; /* Green color */
                    cursor: pointer;
                }
                `}
            </style>
            {/* Sidebar Content Wrapper */}
            <div style={sidebarContentStyle}>
                {/* Layer Control Section */}
                <div style={layerControlContainerStyle}>
                    <div style={layerControlHeaderStyle}>Layer Control</div>

                    {/* Controls */}
                    <div style={layerControlBoxStyle}>
                        {['Range', 'Observations', 'Country Label', 'State and City Labels'].map((item) => (
                            <div key={item}>
                                <div
                                    style={dropdownHeaderStyle}
                                    onClick={() => toggleSection(item)}
                                >
                                    <div style={curvedBoxItemStyle}>
                                        <div style={controlHeaderStyle}>
                                            <div style={controlLabelStyle}>
                                                {item}
                                                {activeSections.includes(item) ? (
                                                    <FaChevronUp style={chevronStyle} />
                                                ) : (
                                                    <FaChevronDown style={chevronStyle} />
                                                )}
                                            </div>
                                            <div
                                                style={visibilityIconStyle}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent triggering dropdown
                                                    handleVisibilityChange(item);
                                                }}
                                            >
                                                {/* Show the eye icon based on current visibility state */}
                                                {currentVisibilitySettings[item] === undefined ||
                                                currentVisibilitySettings[item] ? (
                                                    <FiEye style={eyeIconStyle} /> // Show eye icon if visible
                                                ) : (
                                                    <FiEyeOff style={eyeIconStyle} /> // Show eye-off icon if not visible
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {activeSections.includes(item) && (
                                    <div style={sliderContainerStyle}>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1"
                                            step="0.1"
                                            value={
                                                opacitySettings[item] !== undefined
                                                    ? opacitySettings[item]
                                                    : 1
                                            } // Default to 100%
                                            onChange={(e) =>
                                                handleOpacityChange(item, e.target.value)
                                            }
                                            className="slider"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Styles
const sidebarStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '250px',
    height: '100vh',
    backgroundColor: 'rgba(240, 255, 240, 0.95)', // Honeydew color
    backdropFilter: 'blur(15px)',
    color: '#000',
    padding: '20px',
    paddingTop: '80px',
    transition: 'transform 0.3s ease-out',
    zIndex: 10,
    boxSizing: 'border-box',
    overflowY: 'auto',
    fontFamily: 'Arial, sans-serif',
};

const sidebarContentStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
};

const layerControlContainerStyle = {
    flex: '1',
};

const layerControlHeaderStyle = {
    fontWeight: '600',
    fontSize: '22px',
    marginBottom: '20px',
    userSelect: 'none',
    color: '#006400', // DarkGreen color
    fontFamily: 'Arial, sans-serif',
};

const layerControlBoxStyle = {
    marginTop: '10px',
};

const dropdownHeaderStyle = {
    padding: '10px 0',
};

const curvedBoxItemStyle = {
    backgroundColor: '#f0fff0', // Honeydew color
    padding: '10px 15px',
    borderRadius: '12px',
    marginBottom: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s ease',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
};

const controlHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
};

const controlLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Arial, sans-serif',
};

const chevronStyle = {
    marginLeft: '8px',
    color: '#006400',
};

const visibilityIconStyle = {
    cursor: 'pointer',
};

const eyeIconStyle = {
    color: '#006400',
    fontSize: '20px',
};

const sliderContainerStyle = {
    padding: '10px 0 20px 0',
    display: 'flex',
    alignItems: 'center',
};

export default Sidebar;
