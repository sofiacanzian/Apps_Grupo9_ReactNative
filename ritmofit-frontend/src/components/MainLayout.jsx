// src/components/MainLayout.jsx
import React from 'react';
import Header from './header';
const MainLayout = ({ children }) => {
    return (
        <div>
            <Header />
            <main style={{ padding: '20px' }}>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;