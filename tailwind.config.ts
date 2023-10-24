import {join} from 'path';
import type {Config} from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import {skeleton} from '@skeletonlabs/tw-plugin';
import {athenaDarkTheme} from "./athena-dark-theme";
import {athenaLightTheme} from "./athena-light-theme";

export default {
    darkMode: 'class',
    content: ['./src/**/*.{html,js,svelte,ts}', join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')],
    theme: {
        extend: {
            boxShadow: {
                'stance': '0 4px 2px 0 rgba(0, 0, 0, 0.1), inset -1px -2px 2px rgba(0, 0, 0, 0.2), 0 10px 6px 2px rgba(0, 0, 0, 0.1), inset 0 1px 5px 0 rgba(0, 0, 0, 0.03)',
                'stance-down': '0 1px 2px 0 rgba(0, 0, 0, 0.15), inset -1px -2px 2px rgba(0, 0, 0, 0.2), 0 5px 6px 0 rgba(0, 0, 0, 0.1), inset 0 1px 5px 0 rgba(0, 0, 0, 0.03)',
                'stance-invert': '-0.5px -1.5px 2.5px rgba(0, 0, 0, 0.2), inset 2px 6px 6px rgba(0, 0, 0, 0.2)',
            },
        },
    },
    plugins: [
        forms,
        typography,
        skeleton({
            themes: {
                custom: [
                    athenaDarkTheme,
                    athenaLightTheme
                ]
            },
        }),
    ],

} satisfies Config;
