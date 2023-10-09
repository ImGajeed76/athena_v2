<script lang="ts">

    import {writable} from "svelte/store";
    import {onMount} from "svelte";
    import {generateRandomPassword} from "$lib/helpers";
    import {loginWithGitHub, signUpWithEmail} from "$lib/database";
    import {goto} from "$app/navigation";
    import {getModalStore, Modal, ProgressBar} from "@skeletonlabs/skeleton";
    export const modalStore = getModalStore();

    const passed = writable(true);

    let defaultPassword = generateRandomPassword();

    let password_requirements = {
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

    const password = writable("");
    password.subscribe((value) => {
        $passed = true;
        password_requirements.uppercase.checked = /[A-Z]/.test(value);
        password_requirements.lowercase.checked = /[a-z]/.test(value);
        password_requirements.number.checked = /[0-9]/.test(value);
        password_requirements.special.checked = /[!@#$%^&*()+}{\[\]?><']/.test(value);
        password_requirements.length.checked = value.length >= 8;
    });

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
    })

    const email = writable("");
    email.subscribe(() => $passed = true);

    const message = writable({
        text: "",
        style: ""
    });
    const loading = writable(false);

    async function signUp() {
        loading.set(true);
        message.set({
            text: "",
            style: ""
        })

        let pass = true;

        if (!$email || !$password) pass = false;
        if (!password_requirements.uppercase.checked) pass = false;
        if (!password_requirements.lowercase.checked) pass = false;
        if (!password_requirements.number.checked) pass = false;
        if (!password_requirements.special.checked) pass = false;
        if (!password_requirements.length.checked) pass = false;

        if (!pass) {
            $passed = false;
            message.set({
                text: "Please fill out all fields correctly",
                style: "text-error-500"
            })
            loading.set(false);
            return;
        }

        if ($password.length > 72) {
            message.set({
                text: "Password is too long (> 72 characters)",
                style: "text-error-500"
            })
            loading.set(false);
            return;
        }

        const {error} = await signUpWithEmail($email, $password);
        loading.set(false);

        if (error) {
            message.set({
                text: error.message,
                style: "text-error-500"
            })
            return;
        }

        message.set({
            text: "Account created successfully!",
            style: "text-success-500"
        })

        modalStore.trigger({
            type: "alert",
            title: "Account created successfully!",
            body: "Please check your email to proceed.",
            buttonTextCancel: "Login",
            response: () => {
                goto("/login");
            }
        })
    }

</script>

<Modal/>

<div class="w-full h-full grid lg:grid-cols-2">
    <div class="w-full p-5 grid items-center">
        <div class="lg:max-w-lg max-w-md w-full h-fit shadow-stance rounded-md p-5 m-auto">
            <h2 class="h3 font-bold mb-1">Get started</h2>
            <p>Create your new account.</p>

            <div class="mt-10 mb-1 w-full">
                <button class="btn variant-ghost hover:variant-ghost-secondary w-full" on:click={loginWithGitHub}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                    </svg>
                    <span class="mr-2">Continue with GitHub</span>
                </button>
            </div>

            <div class="inline-flex items-center justify-center w-full relative">
                <hr class="w-full h-[2px] my-8 bg-gray-300 border-0">
                <span class="absolute px-3 font-medium text-gray-900 -translate-x-1/2 bg-surface-100 left-1/2 dark:text-white dark:bg-gray-900">or</span>
            </div>

            <form class="my-10 mt-0" on:submit={signUp}>
                <label class="label mb-5">
                    <span class="ml-1">Email</span>
                    <input class="input duration-100 {$passed ? '' : 'variant-ghost-error outline outline-1 outline-error-500'}"
                           type="email" placeholder="you@example.com" bind:value={$email}/>
                </label>

                <label class="label mb-2">
                    <span class="ml-1 flex justify-between">
                        Password
                        <a href="/forgot-password" class="underline text-secondary-600 hover:text-primary-500">Forgot Password?</a>
                    </span>
                    <span class="inline-flex items-center justify-center w-full relative">
                        <input id="password"
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

                <ul class="list ml-3 mb-8 text-sm">
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

                <button class="btn variant-ghost-primary hover:variant-filled-primary w-full" type="submit" disabled={$loading}>
                    Sign Up
                </button>

                {#if $loading}
                    <ProgressBar class="mt-2" meter="bg-primary-400" track="bg-surface-400"/>
                {/if}

                {#if $message.text !== ""}
                    <p class="text-center mt-2 {$message.style}">{$message.text}</p>
                {/if}
            </form>


            <p class="text-center mb-2">Have an account?
                <a href="/login" class="text-primary-500 underline">Login</a>
            </p>
        </div>
    </div>
</div>