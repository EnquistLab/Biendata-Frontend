import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, visibilitySettings, opacitySettings, onVisibilityChange, onOpacityChange }) => {
    const [showSidebar, setShowSidebar] = useState(true);

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    useEffect(() => {
        setShowSidebar(true);
    }, []);

    return (
        <div style={{ height: '100%', margin: 0, padding: 0 }}>
            {/* Hamburger Menu */}
            <div style={hamburgerContainer(showSidebar)} onClick={toggleSidebar}>
                <div style={{ ...hamburgerLine(showSidebar), ...getLineStyle(1, showSidebar) }} />
                <div style={{ ...hamburgerLine(showSidebar), ...getLineStyle(2, showSidebar) }} />
                <div style={{ ...hamburgerLine(showSidebar), ...getLineStyle(3, showSidebar) }} />
            </div>

            {/* Sidebar */}
            <Sidebar
                show={showSidebar}
                visibilitySettings={visibilitySettings}
                opacitySettings={opacitySettings}
                onVisibilityChange={onVisibilityChange}
                onOpacityChange={onOpacityChange}
            />

            {/* Map Content */}
            <main style={mainStyle}>{children}</main>
        </div>
    );
};

const getLineStyle = (index, showSidebar) => {
    const baseStyle = {
        transition: 'transform 0.3s ease, opacity 0.2s ease',
    };

    if (showSidebar) {
        switch (index) {
            case 1:
                return {
                    ...baseStyle,
                    transform: 'translateY(9px) rotate(45deg)',
                };
            case 2:
                return {
                    ...baseStyle,
                    opacity: 0,
                };
            case 3:
                return {
                    ...baseStyle,
                    transform: 'translateY(-9px) rotate(-45deg)',
                };
            default:
                return baseStyle;
        }
    } else {
        return {
            ...baseStyle,
            transform: 'translateY(0) rotate(0)',
            opacity: 1,
        };
    }
};

const hamburgerLine = (showSidebar) => ({
    width: '100%',
    height: '4px',
    backgroundColor: showSidebar ? '#000' : '#fff',
    transition: 'all 0.3s ease',
});

const hamburgerContainer = (showSidebar) => ({
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 20,
    width: '30px',
    height: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    alignItems: 'center',
    backgroundColor: showSidebar ? 'transparent' : 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    padding: '5px',
});

const mainStyle = {
    height: '100%',
};

export default Layout;
