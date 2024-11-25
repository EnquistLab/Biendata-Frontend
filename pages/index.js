import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Map from '../components/Map';

export default function Home() {
    const [visibilitySettings, setVisibilitySettings] = useState({
        Range: true,
        Observations: true,
        'Country Label': true,
    });

    const [opacitySettings, setOpacitySettings] = useState({
        Range: 1,
        Observations: 1,
        'Country Label': 1,
    });

    // Dynamically load Google Analytics script
    useEffect(() => {
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-';
        document.head.appendChild(script);

        script.onload = () => {
            window.dataLayer = window.dataLayer || [];
            function gtag() {
                window.dataLayer.push(arguments);
            }
            gtag('js', new Date());
            gtag('config', 'G-');
        };

        return () => {
            // Clean up the script if necessary
            document.head.removeChild(script);
        };
    }, []); // Only run once on component mount

    // Handle visibility toggle from Sidebar
    const handleVisibilityChange = (section) => {
        setVisibilitySettings((prevVisibility) => ({
            ...prevVisibility,
            [section]: !prevVisibility[section],
        }));
    };

    // Handle opacity change from Sidebar
    const handleOpacityChange = (section, newOpacity) => {
        setOpacitySettings((prevOpacity) => ({
            ...prevOpacity,
            [section]: parseFloat(newOpacity),
        }));
    };

    return (
        <Layout
            visibilitySettings={visibilitySettings}
            opacitySettings={opacitySettings}
            onVisibilityChange={handleVisibilityChange}
            onOpacityChange={handleOpacityChange}
        >
            <Map
                initialCenter={[0, 0]}
                visibilitySettings={visibilitySettings}
                opacitySettings={opacitySettings}
            />
        </Layout>
    );
}
