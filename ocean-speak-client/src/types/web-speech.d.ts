// Minimal Web Speech API typings — TypeScript's lib.dom ships SpeechRecognitionResult(List) and
// SpeechRecognitionAlternative, but not the SpeechRecognition interface itself or its result
// event. These declarations merge with the `declare var` entries in src/global.d.ts.

interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: (() => void) | null;
    onspeechstart: (() => void) | null;
    onspeechend: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: { error?: string }) => void) | null;
    onend: (() => void) | null;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
}
