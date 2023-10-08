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
                'stance': 'inset -1px -3px 5px rgba(0, 0, 0, 0.2), 2px 6px 9px rgba(0, 0, 0, 0.2)',
                'stance-invert': '-1px -3px 5px rgba(0, 0, 0, 0.2), inset 2px 6px 9px rgba(0, 0, 0, 0.2)',
            }
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
