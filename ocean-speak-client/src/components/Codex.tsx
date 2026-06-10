import { useState } from 'react';
import { KANA_ITEMS, vocabByRomaji } from '../data/content';
import { splitCollection } from '../domain/progress';
import { progressStore } from '../state/progressStore';

interface CodexProps {
    owned: string[];
    onClose: () => void;
}

/**
 * Collection album (ADR-0011, Phase 1). Every kana is a slot: owned cards show the glyph and flip
 * to reveal the reading + play audio; unearned ones are gaps — literally the kana left to learn.
 * Word cards (modo palabras) appear in their own section as they are earned.
 */
export function Codex({ owned, onClose }: CodexProps) {
    const { kana, words } = splitCollection(owned);
    const kanaSet = new Set(kana);
    const [flipped, setFlipped] = useState<string | null>(null);

    const play = (audio: string) => {
        new Audio(`assets/audio/${audio}.mp3`).play().catch(() => { /* needs a gesture */ });
    };

    return (
        <div className="codex-overlay" onClick={onClose}>
            <div className="codex" onClick={(e) => e.stopPropagation()}>
                <header className="codex__head">
                    <h2>Colección · {kana.length}/{KANA_ITEMS.length}</h2>
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
                        const has = kanaSet.has(item.romaji);
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
                {words.length > 0 && (
                    <>
                        <h3 className="codex__subhead">🍣 Palabras · {words.length}</h3>
                        <div className="codex__grid codex__grid--words">
                            {words.map((romaji) => {
                                const v = vocabByRomaji(romaji);
                                if (!v) return null;
                                const key = `word:${romaji}`;
                                const isFlipped = flipped === key;
                                return (
                                    <button
                                        key={key}
                                        className="codex-card codex-card--owned codex-card--word"
                                        title="Voltear / escuchar"
                                        onClick={() => {
                                            const next = isFlipped ? null : key;
                                            setFlipped(next);
                                            if (next) play(v.audio);
                                        }}
                                    >
                                        {isFlipped
                                            ? <span className="codex-card__back">{v.romaji}<br /><small>{v.meaning}</small></span>
                                            : <span className="codex-card__word">{v.reading}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
