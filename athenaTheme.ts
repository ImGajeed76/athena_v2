import type {CustomThemeConfig} from "@skeletonlabs/tw-plugin";

export const athenaTheme: CustomThemeConfig  = {
    name: 'my-custom-theme',
    properties: {
        // =~= Theme Properties =~=
        "--theme-font-family-base": `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
        "--theme-font-family-heading": `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
        "--theme-font-color-base": "0 0 0", // #000000
        "--theme-font-color-dark": "233 226 244", // #e9e2f4
        "--theme-rounded-base": "9999px",
        "--theme-rounded-container": "8px",
        "--theme-border-base": "1px",

        // =~= Theme On-X Colors =~=
        "--on-primary": "0 0 0", // #000000
        "--on-secondary": "0 0 0", // #000000
        "--on-tertiary": "0 0 0", // #000000
        "--on-surface": "0 0 0", // #000000
        "--on-success": "0 0 0",
        "--on-warning": "0 0 0",
        "--on-error": "255 255 255",

        // =~= Theme Colors  =~=

        // primary | #e942ff
        "--color-primary-50": "252 229 255", // #fce5ff
        "--color-primary-100": "249 204 255", // #f9ccff
        "--color-primary-200": "243 153 255", // #f399ff
        "--color-primary-300": "237 102 255", // #ed66ff
        "--color-primary-400": "231 51 255", // #e733ff
        "--color-primary-500": "225 0 255", // #e100ff
        "--color-primary-600": "180 0 204", // #b400cc
        "--color-primary-700": "135 0 153", // #870099
        "--color-primary-800": "90 0 102", // #5a0066
        "--color-primary-900": "45 0 51", // #2d0033

        // secondary | #d5c6eb
        "--color-secondary-50": "241 236 248", // #f1ecf8
        "--color-secondary-100": "227 217 242", // #e3d9f2
        "--color-secondary-200": "199 180 228", // #c7b4e4
        "--color-secondary-300": "171 142 215", // #ab8ed7
        "--color-secondary-400": "143 104 202", // #8f68ca
        "--color-secondary-500": "115 66 189", // #7342bd
        "--color-secondary-600": "92 53 151", // #5c3597
        "--color-secondary-700": "69 40 113", // #452871
        "--color-secondary-800": "46 27 75", // #2e1b4b
        "--color-secondary-900": "23 13 38", // #2d0033

        // tertiary | #dbc00f
        "--color-tertiary-50": "253 250 231", // #fdfae7
        "--color-tertiary-100": "252 246 207", // #fcf6cf
        "--color-tertiary-200": "248 237 160", // #f8eda0
        "--color-tertiary-300": "245 227 112", // #f5e370
        "--color-tertiary-400": "242 218 64", // #f2da40
        "--color-tertiary-500": "238 209 17", // #eed111
        "--color-tertiary-600": "191 167 13", // #bfa70d
        "--color-tertiary-700": "143 125 10", // #8f7d0a
        "--color-tertiary-800": "95 84 7", // #5f5407
        "--color-tertiary-900": "48 42 3", // #302a03

        // success | #05c74c
        "--color-success-50": "218 247 228", // #daf7e4
        "--color-success-100": "205 244 219", // #cdf4db
        "--color-success-200": "193 241 210", // #c1f1d2
        "--color-success-300": "155 233 183", // #9be9b7
        "--color-success-400": "80 216 130", // #50d882
        "--color-success-500": "5 199 76", // #05c74c
        "--color-success-600": "5 179 68", // #05b344
        "--color-success-700": "4 149 57", // #049539
        "--color-success-800": "3 119 46", // #03772e
        "--color-success-900": "2 98 37", // #026225

        // warning | #eebf17
        "--color-warning-50": "252 245 220", // #fcf5dc
        "--color-warning-100": "252 242 209", // #fcf2d1
        "--color-warning-200": "251 239 197", // #fbefc5
        "--color-warning-300": "248 229 162", // #f8e5a2
        "--color-warning-400": "243 210 93", // #f3d25d
        "--color-warning-500": "238 191 23", // #eebf17
        "--color-warning-600": "214 172 21", // #d6ac15
        "--color-warning-700": "179 143 17", // #b38f11
        "--color-warning-800": "143 115 14", // #8f730e
        "--color-warning-900": "117 94 11", // #755e0b

        // error | #ff1a53
        "--color-error-50": "255 221 229", // #ffdde5
        "--color-error-100": "255 209 221", // #ffd1dd
        "--color-error-200": "255 198 212", // #ffc6d4
        "--color-error-300": "255 163 186", // #ffa3ba
        "--color-error-400": "255 95 135", // #ff5f87
        "--color-error-500": "255 26 83", // #ff1a53
        "--color-error-600": "230 23 75", // #e6174b
        "--color-error-700": "191 20 62", // #bf143e
        "--color-error-800": "153 16 50", // #991032
        "--color-error-900": "125 13 41", // #7d0d29

        // surface | #e9e2f4
        "--color-surface-50": "241 237 248", // #f1edf8
        "--color-surface-100": "227 218 241", // #e3daf1
        "--color-surface-200": "199 181 227", // #c7b5e3
        "--color-surface-300": "170 144 213", // #aa90d5
        "--color-surface-400": "142 107 199", // #8e6bc7
        "--color-surface-500": "114 70 185", // #7246b9
        "--color-surface-600": "91 56 148", // #5b3894
        "--color-surface-700": "68 42 111", // #442a6f
        "--color-surface-800": "46 28 74", // #2e1c4a
        "--color-surface-900": "23 14 37", // #170e25
    }
}