import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Japanese typography for kana glyphs (ADR-0009). Bundled offline via @fontsource;
// registers the "Noto Sans JP" family used by Phaser Text in the koi pond.
import '@fontsource/noto-sans-jp/400.css';
import '@fontsource/noto-sans-jp/700.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
