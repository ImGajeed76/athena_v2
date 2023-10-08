import type {CustomThemeConfig} from "@skeletonlabs/tw-plugin";

export const athenaLightTheme: CustomThemeConfig = {
    name: 'athena-light-theme',
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
        "--on-secondary": "0 0 0",
        "--on-tertiary": "0 0 0",
        "--on-success": "0 0 0",
        "--on-warning": "0 0 0",
        "--on-error": "255 255 255",
        "--on-surface": "0 0 0",
        // =~= Theme Colors  =~=
        // primary | #af2dfb
        "--color-primary-50": "243 224 254", // #f3e0fe
        "--color-primary-100": "239 213 254", // #efd5fe
        "--color-primary-200": "235 203 254", // #ebcbfe
        "--color-primary-300": "223 171 253", // #dfabfd
        "--color-primary-400": "199 108 252", // #c76cfc
        "--color-primary-500": "175 45 251", // #af2dfb
        "--color-primary-600": "158 41 226", // #9e29e2
        "--color-primary-700": "131 34 188", // #8322bc
        "--color-primary-800": "105 27 151", // #691b97
        "--color-primary-900": "86 22 123", // #56167b
        // secondary | #e5bcfb
        "--color-secondary-50": "251 245 254", // #fbf5fe
        "--color-secondary-100": "250 242 254", // #faf2fe
        "--color-secondary-200": "249 238 254", // #f9eefe
        "--color-secondary-300": "245 228 253", // #f5e4fd
        "--color-secondary-400": "237 208 252", // #edd0fc
        "--color-secondary-500": "229 188 251", // #e5bcfb
        "--color-secondary-600": "206 169 226", // #cea9e2
        "--color-secondary-700": "172 141 188", // #ac8dbc
        "--color-secondary-800": "137 113 151", // #897197
        "--color-secondary-900": "112 92 123", // #705c7b
        // tertiary | #fbe918
        "--color-tertiary-50": "254 252 220", // #fefcdc
        "--color-tertiary-100": "254 251 209", // #fefbd1
        "--color-tertiary-200": "254 250 197", // #fefac5
        "--color-tertiary-300": "253 246 163", // #fdf6a3
        "--color-tertiary-400": "252 240 93", // #fcf05d
        "--color-tertiary-500": "251 233 24", // #fbe918
        "--color-tertiary-600": "226 210 22", // #e2d216
        "--color-tertiary-700": "188 175 18", // #bcaf12
        "--color-tertiary-800": "151 140 14", // #978c0e
        "--color-tertiary-900": "123 114 12", // #7b720c
        // success | #0fd256
        "--color-success-50": "219 248 230", // #dbf8e6
        "--color-success-100": "207 246 221", // #cff6dd
        "--color-success-200": "195 244 213", // #c3f4d5
        "--color-success-300": "159 237 187", // #9fedbb
        "--color-success-400": "87 224 137", // #57e089
        "--color-success-500": "15 210 86", // #0fd256
        "--color-success-600": "14 189 77", // #0ebd4d
        "--color-success-700": "11 158 65", // #0b9e41
        "--color-success-800": "9 126 52", // #097e34
        "--color-success-900": "7 103 42", // #07672a
        // warning | #ffae00
        "--color-warning-50": "255 243 217", // #fff3d9
        "--color-warning-100": "255 239 204", // #ffefcc
        "--color-warning-200": "255 235 191", // #ffebbf
        "--color-warning-300": "255 223 153", // #ffdf99
        "--color-warning-400": "255 198 77", // #ffc64d
        "--color-warning-500": "255 174 0", // #ffae00
        "--color-warning-600": "230 157 0", // #e69d00
        "--color-warning-700": "191 131 0", // #bf8300
        "--color-warning-800": "153 104 0", // #996800
        "--color-warning-900": "125 85 0", // #7d5500
        // error | #f22c5d
        "--color-error-50": "253 223 231", // #fddfe7
        "--color-error-100": "252 213 223", // #fcd5df
        "--color-error-200": "252 202 215", // #fccad7
        "--color-error-300": "250 171 190", // #faabbe
        "--color-error-400": "246 107 142", // #f66b8e
        "--color-error-500": "242 44 93", // #f22c5d
        "--color-error-600": "218 40 84", // #da2854
        "--color-error-700": "182 33 70", // #b62146
        "--color-error-800": "145 26 56", // #911a38
        "--color-error-900": "119 22 46", // #77162e
        // surface | #e6e6e6
        "--color-surface-50": "251 251 251", // #fbfbfb
        "--color-surface-100": "250 250 250", // #fafafa
        "--color-surface-200": "249 249 249", // #f9f9f9
        "--color-surface-300": "245 245 245", // #f5f5f5
        "--color-surface-400": "238 238 238", // #eeeeee
        "--color-surface-500": "230 230 230", // #e6e6e6
        "--color-surface-600": "207 207 207", // #cfcfcf
        "--color-surface-700": "173 173 173", // #adadad
        "--color-surface-800": "138 138 138", // #8a8a8a
        "--color-surface-900": "113 113 113", // #717171

    }
}