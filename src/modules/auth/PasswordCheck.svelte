<script lang="ts">
    import type {Writable} from "svelte/store";
    import {writable} from "svelte/store";
    import {onMount} from "svelte";
    import {generateRandomPassword} from "$lib/helpers";
    import {ProgressBar} from "@skeletonlabs/skeleton";

    export let password: Writable<string>;
    export let passPassed: Writable<boolean>;
    export let passed: Writable<boolean> = writable(true);

    export let defaultPassword: string = generateRandomPassword();

    type Requirements = Record<string, {
        name: string,
        checked: boolean
    }>

    export let password_requirements: Requirements = {
        uppercase: {
            name: "1 Uppercase letter",
            checked: false
        },
        lowercase: {
            name: "1 Lowercase letter",
            checked: false
        },
        number: {
            name: "1 Number",
            checked: false
        },
        special: {
            name: "1 Special character (e.g. !?<>@#$%^&*)",
            checked: false
        },
        length: {
            name: "> 7 Characters",
            checked: false
        }
    }

    export let check_requirements: (value: string, requirements: Requirements) => Requirements = (value: string, requirements: Requirements) => {
        requirements.uppercase.checked = /[A-Z]/.test(value);
        requirements.lowercase.checked = /[a-z]/.test(value);
        requirements.number.checked = /[0-9]/.test(value);
        requirements.special.checked = /[!@#$%^&*()+}{\[\]?><']/.test(value);
        requirements.length.checked = value.length >= 8;
        return requirements;
    }

    export let message: Writable<{
        text: string,
        style: string
    }> = writable({
        text: "",
        style: ""
    });
    export let loading: Writable<boolean> = writable(false);

    const showPassword = writable(false);
    onMount(() => {
        showPassword.subscribe((value) => {
            const passwordElement = document.getElementById("password");
            if (!passwordElement) return;

            if (value) {
                passwordElement.setAttribute("type", "text");
            } else {
                passwordElement.setAttribute("type", "password");
            }
        });

        password.subscribe((value) => {
            $passed = true;
            $passPassed = true;
            password_requirements = check_requirements(value, password_requirements);
            for (const requirement of Object.values(password_requirements)) {
                if (!requirement.checked) {
                    $passPassed = false;
                    break;
                }
            }
        });
    });

</script>

<div class="w-full h-full">
    <label class="label mb-2">
        <span class="ml-1 flex justify-between">
            <slot>Password</slot>
        </span>
        <span class="inline-flex items-center justify-center w-full relative">
            <input id="password"
                   autocomplete="new-password"
                   class="input duration-100 {$passed ? '' : 'variant-ghost-error outline outline-1 outline-error-500'}"
                   type="password" placeholder="{defaultPassword}"
                   bind:value={$password}/>
            <span class="absolute right-0 mr-3">
                <button type="button" on:click={() => {showPassword.set(!$showPassword)}}>
                    {#if $showPassword}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path
                                fill="#666"
                                d="M.143 2.31a.75.75 0 0 1 1.047-.167l14.5 10.5a.75.75 0 1 1-.88 1.214l-2.248-1.628C11.346 13.19 9.792 14 8 14c-1.981 0-3.67-.992-4.933-2.078C1.797 10.832.88 9.577.43 8.9a1.619 1.619 0 0 1 0-1.797c.353-.533.995-1.42 1.868-2.305L.31 3.357A.75.75 0 0 1 .143 2.31Zm1.536 5.622A.12.12 0 0 0 1.657 8c0 .021.006.045.022.068.412.621 1.242 1.75 2.366 2.717C5.175 11.758 6.527 12.5 8 12.5c1.195 0 2.31-.488 3.29-1.191L9.063 9.695A2 2 0 0 1 6.058 7.52L3.529 5.688a14.207 14.207 0 0 0-1.85 2.244ZM8 3.5c-.516 0-1.017.09-1.499.251a.75.75 0 1 1-.473-1.423A6.207 6.207 0 0 1 8 2c1.981 0 3.67.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.11.166-.248.365-.41.587a.75.75 0 1 1-1.21-.887c.148-.201.272-.382.371-.53a.119.119 0 0 0 0-.137c-.412-.621-1.242-1.75-2.366-2.717C10.825 4.242 9.473 3.5 8 3.5Z"></path></svg>
                    {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path
                                fill="#666"
                                d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"></path></svg>
                    {/if}
                </button>
                {#if $password === ""}
                    <button type="button" class="ml-2"
                            on:click={() => {$password = defaultPassword; $showPassword = true}}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path
                                fill="#666"
                                d="M6.368 1.01a.75.75 0 0 1 .623.859L6.57 4.5h3.98l.46-2.868a.75.75 0 0 1 1.48.237L12.07 4.5h2.18a.75.75 0 0 1 0 1.5h-2.42l-.64 4h2.56a.75.75 0 0 1 0 1.5h-2.8l-.46 2.869a.75.75 0 0 1-1.48-.237l.42-2.632H5.45l-.46 2.869a.75.75 0 0 1-1.48-.237l.42-2.632H1.75a.75.75 0 0 1 0-1.5h2.42l.64-4H2.25a.75.75 0 0 1 0-1.5h2.8l.46-2.868a.75.75 0 0 1 .858-.622ZM9.67 10l.64-4H6.33l-.64 4Z"></path></svg>
                    </button>
                {/if}
            </span>
        </span>
    </label>

    {#if $loading}
        <ProgressBar class="my-2 w-96" meter="bg-primary-400" track="bg-surface-400"/>
    {/if}

    {#if $message.text !== ""}
        <p class="my-2 w-96 {$message.style}">{$message.text}</p>
    {/if}

    <ul class="list ml-3 text-sm">
        {#each Object.entries(password_requirements) as [_, requirement]}
            <li>
                {#if requirement.checked}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#0fd256"
                              d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z"></path>
                    </svg>
                    <span class="ml-2">{requirement.name}</span>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#666"
                              d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z"></path>
                    </svg>
                    <span class="ml-2 text-surface-900">{requirement.name}</span>
                {/if}
            </li>
        {/each}
    </ul>
</div>