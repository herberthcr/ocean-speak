import { useState } from 'react';
import { KANA_ITEMS } from '../data/content';
import { progressStore } from '../state/progressStore';

interface CodexProps {
    owned: string[];
    onClose: () => void;
}

/**
 * Collection album (ADR-0011, Phase 1). Every kana is a slot: owned cards show the glyph and flip
 * to reveal the reading + play audio; unearned ones are gaps — literally the kana left to learn.
 */
export function Codex({ owned, onClose }: CodexProps) {
    const ownedSet = new Set(owned);
    const [flipped, setFlipped] = useState<string | null>(null);

    const play = (audio: string) => {
        new Audio(`assets/audio/${audio}.mp3`).play().catch(() => { /* needs a gesture */ });
    };

    return (
        <div className="codex-overlay" onClick={onClose}>
            <div className="codex" onClick={(e) => e.stopPropagation()}>
                <header className="codex__head">
                    <h2>Colección · {owned.length}/{KANA_ITEMS.length}</h2>
                    <div className="codex__actions">
                        <button
                            className="codex__reset"
                            onClick={() => {
                                if (window.confirm('¿Reiniciar todo el progreso? Se pierden cartas y niveles.')) {
                                    progressStore.reset();
                                    window.location.reload();
                                }
                            }}
                        >
                            ↺ Reiniciar
                        </button>
                        <button className="codex__close" onClick={onClose} aria-label="Cerrar">✕</button>
                    </div>
                </header>
                <div className="codex__grid">
                    {KANA_ITEMS.map((item) => {
                        const has = ownedSet.has(item.romaji);
                        const isFlipped = flipped === item.romaji;
                        return (
                            <button
                                key={item.romaji}
                                className={`codex-card ${has ? 'codex-card--owned' : 'codex-card--locked'}`}
                                title={has ? 'Voltear / escuchar' : 'Aún no conseguida'}
                                onClick={() => {
                                    if (!has) return;
                                    const next = isFlipped ? null : item.romaji;
                                    setFlipped(next);
                                    if (next) play(item.audio);
                                }}
                            >
                                {has
                                    ? (isFlipped
                                        ? <span className="codex-card__back">{item.romaji} 🔊</span>
                                        : <span className="codex-card__glyph">{item.prompt}</span>)
                                    : <span className="codex-card__lock">?</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
