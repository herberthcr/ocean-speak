import { defineConfig } from 'vitest/config';

// Pure domain logic (kana matching, crystal charge) runs in Node — no DOM, no Phaser.
export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.{test,spec}.ts'],
    },
});
