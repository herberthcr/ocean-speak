import { useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { EventBus } from './game/EventBus';
import { progressStore } from './state/progressStore';
import { KANA_ITEMS } from './data/content';
import { splitCollection } from './domain/progress';
import { Codex } from './components/Codex';
import { t, currentLang, type Lang } from './i18n/strings';

interface KanaTarget {
    prompt: string;
    romaji: string;
    audio: string;
    level: number;
    label: string;
    /** 'glyph' shows the kana; 'recall' hides it (cue is sound + romaji); 'free' = sandbox. */
    mode: 'glyph' | 'recall' | 'free';
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

interface WordTarget {
    reading: string;
    romaji: string;
    meaning: string;
    audio: string;
    /** Spelling slots, tapped glyphs revealed (e.g. ['す','＿']). */
    slots: string[];
}

function App() {
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Mirrored from the koi pond (UnderWaterScene) via EventBus.
    const [target, setTarget] = useState<KanaTarget | null>(null);
    const [wordTarget, setWordTarget] = useState<WordTarget | null>(null);
    const [rowProgress, setRowProgress] = useState<RowProgress | null>(null);
    const [owned, setOwned] = useState<string[]>(progressStore.collection());
    const [codexOpen, setCodexOpen] = useState(false);
    const [voiceOn, setVoiceOn] = useState(false);
    // Re-render the panel when the language changes (toggle lives in the Phaser menu).
    const [, setLang] = useState<Lang>(currentLang());

    // ja-JP voice input is optional (ADR-0010); only offered when the browser supports it.
    const voiceSupported = typeof window !== 'undefined'
        && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

    useEffect(() => {
        // kana-target and word-target are mutually exclusive panel states (cross-clear).
        const onTarget = (t: KanaTarget | null) => { setTarget(t); if (t) setWordTarget(null); };
        const onWord = (w: WordTarget | null) => { setWordTarget(w); if (w) setTarget(null); };
        const onRow = (r: RowProgress | null) => setRowProgress(r);
        const onProgress = (s: { collection: string[] }) => setOwned(s.collection);
        const onVoiceState = (on: boolean) => setVoiceOn(on);
        const onLang = (l: Lang) => setLang(l);
        EventBus.on('kana-target', onTarget);
        EventBus.on('word-target', onWord);
        EventBus.on('row-progress', onRow);
        EventBus.on('progress-changed', onProgress);
        EventBus.on('voice-state', onVoiceState);
        EventBus.on('lang-changed', onLang);
        return () => {
            EventBus.off('kana-target', onTarget);
            EventBus.off('word-target', onWord);
            EventBus.off('row-progress', onRow);
            EventBus.off('progress-changed', onProgress);
            EventBus.off('voice-state', onVoiceState);
            EventBus.off('lang-changed', onLang);
        };
    }, []);

    const toggleVoice = () => {
        const next = !voiceOn;
        setVoiceOn(next);
        EventBus.emit('voice-toggle', next);
    };

    const playAudio = () => {
        if (!target) return;
        // Audio clips live in public/assets/audio (offline). Best-effort playback.
        new Audio(`assets/audio/${target.audio}.mp3`).play().catch(() => { /* needs a gesture */ });
    };

    const playWordAudio = () => {
        if (!wordTarget) return;
        new Audio(`assets/audio/${wordTarget.audio}.mp3`).play().catch(() => { /* needs a gesture */ });
    };

    const { kana: kanaOwned, words: wordsOwned } = splitCollection(owned);

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
            <aside className="kana-panel">
                {wordTarget ? (
                    <>
                        <p className="kana-panel__title">{t('panelWordTitle')}</p>
                        <div className="kana-panel__slots">{wordTarget.slots.join(' ')}</div>
                        <p className="kana-panel__meaning">{wordTarget.meaning}</p>
                        <button className="kana-panel__audio" onClick={playWordAudio}>{t('listen')}</button>
                        <p className="kana-panel__romaji">{wordTarget.romaji}</p>
                    </>
                ) : target ? (
                    target.mode === 'free' ? (
                        <>
                            <p className="kana-panel__title">{t('panelFreeTitle')}</p>
                            <div className="kana-panel__glyph">{target.prompt || '〜'}</div>
                            {target.prompt ? (
                                <>
                                    <button className="kana-panel__audio" onClick={playAudio}>{t('listen')}</button>
                                    <p className="kana-panel__romaji">{target.romaji}</p>
                                </>
                            ) : (
                                <p className="kana-panel__level">{t('panelTapKoiHint')}</p>
                            )}
                        </>
                    ) : (
                        <>
                            {target.review && <span className="kana-panel__review">{t('review')}</span>}
                            <p className="kana-panel__title">
                                {target.mode === 'recall' ? t('panelWhichSounds') : t('panelTapKana')}
                            </p>
                            {target.mode === 'recall' ? (
                                <div className="kana-panel__glyph kana-panel__glyph--hidden">?</div>
                            ) : (
                                <div className="kana-panel__glyph">{target.prompt}</div>
                            )}
                            <button className="kana-panel__audio" onClick={playAudio}>{t('listen')}</button>
                            <p className="kana-panel__romaji">{target.romaji}</p>
                            <p className="kana-panel__level">{t('level')} {target.level} · {target.label}</p>
                        </>
                    )
                ) : (
                    <p className="kana-panel__title">{t('panelChooseMode')}</p>
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
                {voiceSupported && target && target.mode !== 'free' && (
                    <button
                        className={`kana-panel__voice ${voiceOn ? 'kana-panel__voice--on' : ''}`}
                        onClick={toggleVoice}
                        title={t('voiceTooltip')}
                    >
                        {t('voice')}: {voiceOn ? 'ON' : 'OFF'}
                    </button>
                )}
                <button className="kana-panel__codex" onClick={() => setCodexOpen(true)}>
                    📖 {t('collection')} · {kanaOwned.length}/{KANA_ITEMS.length}
                    {wordsOwned.length > 0 && ` · ${wordsOwned.length} 🍣`}
                </button>
            </aside>
            {codexOpen && <Codex owned={owned} onClose={() => setCodexOpen(false)} />}
        </div>
    );
}

export default App;
