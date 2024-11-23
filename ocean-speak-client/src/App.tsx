import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { PreloadScene } from './game/scenes/PreloadScene';

function App()
{

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const playGame = () => {

        if(phaserRef.current)
        {     
            const scene = phaserRef.current.scene as PreloadScene;
            
            if (scene)
            {
                scene.playGame();
            }
        }
    }

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
            <div>
                <div>
                    <button className="button" onClick={playGame}>Play Game</button>
                </div>
            </div>
        </div>
    )
}

export default App
