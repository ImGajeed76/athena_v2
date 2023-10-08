import type {CustomThemeConfig} from "@skeletonlabs/tw-plugin";

export const athenaDarkTheme: CustomThemeConfig  = {
    name: 'athena-dark-theme',
    properties: {
        // =~= Theme Properties =~=
        "--theme-font-family-base": `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
        "--theme-font-family-heading": `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
        "--theme-font-color-base": "0 0 0",
        "--theme-font-color-dark": "255 255 255",
        "--theme-rounded-base": "8px",
        "--theme-rounded-container": "8px",
        "--theme-border-base": "1px",
        // =~= Theme On-X Colors =~=
        "--on-primary": "255 255 255",
        "--on-secondary": "255 255 255",
        "--on-tertiary": "0 0 0",
        "--on-success": "0 0 0",
        "--on-warning": "0 0 0",
        "--on-error": "255 255 255",
        "--on-surface": "255 255 255",
        // =~= Theme Colors  =~=
        // primary | #9c0eaf
        "--color-primary-50": "240 219 243", // #f0dbf3
        "--color-primary-100": "235 207 239", // #ebcfef
        "--color-primary-200": "230 195 235", // #e6c3eb
        "--color-primary-300": "215 159 223", // #d79fdf
        "--color-primary-400": "186 86 199", // #ba56c7
        "--color-primary-500": "156 14 175", // #9c0eaf
        "--color-primary-600": "140 13 158", // #8c0d9e
        "--color-primary-700": "117 11 131", // #750b83
        "--color-primary-800": "94 8 105", // #5e0869
        "--color-primary-900": "76 7 86", // #4c0756
        // secondary | #231439
        "--color-secondary-50": "222 220 225", // #dedce1
        "--color-secondary-100": "211 208 215", // #d3d0d7
        "--color-secondary-200": "200 196 206", // #c8c4ce
        "--color-secondary-300": "167 161 176", // #a7a1b0
        "--color-secondary-400": "101 91 116", // #655b74
        "--color-secondary-500": "35 20 57", // #231439
        "--color-secondary-600": "32 18 51", // #201233
        "--color-secondary-700": "26 15 43", // #1a0f2b
        "--color-secondary-800": "21 12 34", // #150c22
        "--color-secondary-900": "17 10 28", // #110a1c
        // tertiary | #EFEF15
        "--color-tertiary-50": "253 253 220", // #fdfddc
        "--color-tertiary-100": "252 252 208", // #fcfcd0
        "--color-tertiary-200": "251 251 197", // #fbfbc5
        "--color-tertiary-300": "249 249 161", // #f9f9a1
        "--color-tertiary-400": "244 244 91", // #f4f45b
        "--color-tertiary-500": "239 239 21", // #EFEF15
        "--color-tertiary-600": "215 215 19", // #d7d713
        "--color-tertiary-700": "179 179 16", // #b3b310
        "--color-tertiary-800": "143 143 13", // #8f8f0d
        "--color-tertiary-900": "117 117 10", // #75750a
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
        // warning | #df7716
        "--color-warning-50": "250 235 220", // #faebdc
        "--color-warning-100": "249 228 208", // #f9e4d0
        "--color-warning-200": "247 221 197", // #f7ddc5
        "--color-warning-300": "242 201 162", // #f2c9a2
        "--color-warning-400": "233 160 92", // #e9a05c
        "--color-warning-500": "223 119 22", // #df7716
        "--color-warning-600": "201 107 20", // #c96b14
        "--color-warning-700": "167 89 17", // #a75911
        "--color-warning-800": "134 71 13", // #86470d
        "--color-warning-900": "109 58 11", // #6d3a0b
        // error | #e01a4c
        "--color-error-50": "250 221 228", // #fadde4
        "--color-error-100": "249 209 219", // #f9d1db
        "--color-error-200": "247 198 210", // #f7c6d2
        "--color-error-300": "243 163 183", // #f3a3b7
        "--color-error-400": "233 95 130", // #e95f82
        "--color-error-500": "224 26 76", // #e01a4c
        "--color-error-600": "202 23 68", // #ca1744
        "--color-error-700": "168 20 57", // #a81439
        "--color-error-800": "134 16 46", // #86102e
        "--color-error-900": "110 13 37", // #6e0d25
        // surface | #1e1235
        "--color-surface-50": "221 219 225", // #dddbe1
        "--color-surface-100": "210 208 215", // #d2d0d7
        "--color-surface-200": "199 196 205", // #c7c4cd
        "--color-surface-300": "165 160 174", // #a5a0ae
        "--color-surface-400": "98 89 114", // #625972
        "--color-surface-500": "30 18 53", // #1e1235
        "--color-surface-600": "27 16 48", // #1b1030
        "--color-surface-700": "23 14 40", // #170e28
        "--color-surface-800": "18 11 32", // #120b20
        "--color-surface-900": "15 9 26", // #0f091a

    }
}