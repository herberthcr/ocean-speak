import { useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { EventBus } from './game/EventBus';
import { progressStore } from './state/progressStore';
import { KANA_ITEMS } from './data/content';
import { Codex } from './components/Codex';

interface KanaTarget {
    prompt: string;
    romaji: string;
    audio: string;
    level: number;
    label: string;
    /** 'glyph' shows the kana; 'recall' hides it (cue is sound + romaji). */
    mode: 'glyph' | 'recall';
    /** True when this is an interleaved review of an earlier row. */
    review: boolean;
}

interface RowKana {
    prompt: string;
    romaji: string;
    mastery: number;
    isTarget: boolean;
}

interface RowProgress {
    level: number;
    label: string;
    threshold: number;
    row: RowKana[];
}

function App() {
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Mirrored from the koi pond (UnderWaterScene) via EventBus.
    const [target, setTarget] = useState<KanaTarget | null>(null);
    const [rowProgress, setRowProgress] = useState<RowProgress | null>(null);
    const [owned, setOwned] = useState<string[]>(progressStore.collection());
    const [codexOpen, setCodexOpen] = useState(false);

    useEffect(() => {
        const onTarget = (t: KanaTarget) => setTarget(t);
        const onRow = (r: RowProgress) => setRowProgress(r);
        const onProgress = (s: { collection: string[] }) => setOwned(s.collection);
        EventBus.on('kana-target', onTarget);
        EventBus.on('row-progress', onRow);
        EventBus.on('progress-changed', onProgress);
        return () => {
            EventBus.off('kana-target', onTarget);
            EventBus.off('row-progress', onRow);
            EventBus.off('progress-changed', onProgress);
        };
    }, []);

    const playAudio = () => {
        if (!target) return;
        // Audio clips live in public/assets/audio (offline). Best-effort playback.
        new Audio(`assets/audio/${target.audio}.mp3`).play().catch(() => { /* needs a gesture */ });
    };

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
            <aside className="kana-panel">
                {target ? (
                    <>
                        {target.review && <span className="kana-panel__review">✨ Repaso</span>}
                        <p className="kana-panel__title">
                            {target.mode === 'recall' ? '¿Cuál suena así?' : 'Toca este kana'}
                        </p>
                        {target.mode === 'recall' ? (
                            <div className="kana-panel__glyph kana-panel__glyph--hidden">?</div>
                        ) : (
                            <div className="kana-panel__glyph">{target.prompt}</div>
                        )}
                        <button className="kana-panel__audio" onClick={playAudio}>🔊 Escuchar</button>
                        <p className="kana-panel__romaji">{target.romaji}</p>
                        <p className="kana-panel__level">Nivel {target.level} · {target.label}</p>
                    </>
                ) : (
                    <p className="kana-panel__title">Cargando…</p>
                )}
                {rowProgress && (
                    <div className="kana-panel__row">
                        {rowProgress.row.map((k) => (
                            <div
                                key={k.romaji}
                                className={[
                                    'row-chip',
                                    k.isTarget ? 'row-chip--target' : '',
                                    k.mastery >= rowProgress.threshold ? 'row-chip--done' : '',
                                ].join(' ').trim()}
                                title={`${k.romaji} · ${k.mastery}/${rowProgress.threshold}`}
                            >
                                <span className="row-chip__glyph">{k.prompt}</span>
                                <span className="row-chip__pips">
                                    {Array.from({ length: rowProgress.threshold }, (_, i) => (
                                        <i key={i} className={i < k.mastery ? 'pip pip--on' : 'pip'} />
                                    ))}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <button className="kana-panel__codex" onClick={() => setCodexOpen(true)}>
                    📖 Colección · {owned.length}/{KANA_ITEMS.length}
                </button>
            </aside>
            {codexOpen && <Codex owned={owned} onClose={() => setCodexOpen(false)} />}
        </div>
    );
}

export default App;
