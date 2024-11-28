import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { PreloadScene } from './game/scenes/PreloadScene';

function App() {

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);


    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
            <div>
                <div>
                   
                </div>
            </div>
        </div>
    )
}

export default App
