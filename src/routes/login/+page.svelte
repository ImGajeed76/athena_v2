<script>
    import {loginWithEmail, loginWithGitHub} from "$lib/database";
    import {writable} from "svelte/store";
    import {ProgressBar} from "@skeletonlabs/skeleton";

    const password = writable("");
    const email = writable("");

    const message = writable({
        text: "",
        style: ""
    });
    const loading = writable(false);
    const passed = writable(true);

    async function login() {
        loading.set(true);
        message.set({
            text: "",
            style: ""
        });

        let pass = true;

        if (!$email || !$password) pass = false;

        if (!pass) {
            $passed = false;
            message.set({
                text: "Please fill out all fields",
                style: "text-error-500"
            })
            loading.set(false);
            return;
        }

        const {error} = await loginWithEmail($email, $password);
        loading.set(false);

        if (error) {
            message.set({
                text: error.message,
                style: "text-error-500"
            })
            return;
        }

        message.set({
            text: "Logged in successfully! Redirecting...",
            style: "text-success-500"
        })

        setTimeout(() => {
            window.location.href = "/";
        }, 2000);
    }
</script>

<div class="w-full h-full grid lg:grid-cols-2">
    <div class="w-full p-5 grid items-center">
        <div class="lg:max-w-lg max-w-md w-full h-fit shadow-stance rounded-md p-5 m-auto">
            <h2 class="h3 font-bold mb-1">Welcome back</h2>
            <p>Login to your account.</p>

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

            <form class="my-10 mt-0" on:submit={login}>
                <label class="label mb-5">
                    <span class="ml-1">Email</span>
                    <input class="input" type="email" placeholder="Email" bind:value={$email}/>
                </label>

                <label class="label mb-8">
                    <span class="ml-1 flex justify-between">
                        Password
                        <a href="/forgot-password" class="underline text-secondary-600 hover:text-primary-500">Forgot Password?</a>
                    </span>
                    <input class="input" type="password" placeholder="Password" bind:value={$password}/>
                </label>

                <button class="btn variant-ghost-primary hover:variant-filled-primary w-full" type="submit">
                    Login
                </button>

                {#if $loading}
                    <ProgressBar class="mt-2" meter="bg-primary-400" track="bg-surface-400"/>
                {/if}

                {#if $message.text !== ""}
                    <p class="text-center mt-2 {$message.style}">{$message.text}</p>
                {/if}
            </form>

            <p class="text-center mb-2">Don't have an account?
                <a href="/signup" class="text-primary-500 underline">Sign Up</a>
            </p>
        </div>
    </div>
    <div></div>
</div>