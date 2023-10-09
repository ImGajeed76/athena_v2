<script lang="ts">
    import {Avatar, getModalStore, ProgressBar, TableOfContents, tocCrawler} from '@skeletonlabs/skeleton';
    import type {ModalComponent} from "@skeletonlabs/skeleton";
    import {currentUser, supabase, updateMetadata} from "$lib/database";
    import {writable} from "svelte/store";
    import {onMount} from "svelte";
    import CodeModalSix from "../../modules/modals/CodeModalSix.svelte";
    import {goto} from "$app/navigation";

    const modalStore = getModalStore();

    let originalUser = "";
    let changesMade = writable(false);

    currentUser.subscribe((user) => {
        if (user !== null && originalUser === "") {
            originalUser = JSON.stringify(user);
        }

        checkForChanges();
    });

    function checkForChanges() {
        changesMade.set(false);

        if (originalUser !== JSON.stringify($currentUser)) {
            changesMade.set(true);
        }

        if ($password !== "") {
            changesMade.set(true);
        }
    }

    async function saveChanges() {
        if (originalUser !== JSON.stringify($currentUser)) await updateMetadata();
        if ($password !== "") await updatePassword();

        originalUser = JSON.stringify($currentUser);
        checkForChanges();
    }

    const passed = writable(true);
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

    export const password = writable("");
    password.subscribe((value) => {
        checkForChanges();
        $passed = true;
        password_requirements.uppercase.checked = /[A-Z]/.test(value);
        password_requirements.lowercase.checked = /[a-z]/.test(value);
        password_requirements.number.checked = /[0-9]/.test(value);
        password_requirements.special.checked = /[!@#$%^&*()+}{\[\]?><']/.test(value);
        password_requirements.length.checked = value.length >= 8;
    });

    const showPassword = writable(false);

    onMount(() => {
        setTimeout(() => {
            if (!$currentUser) {
                goto("/login")
            }
        }, 1000);

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

    const message = writable({
        text: "",
        style: ""
    });
    const loading = writable(false);

    async function updatePassword() {
        loading.set(true);
        message.set({
            text: "",
            style: ""
        })

        let pass = true;

        if (!$password) pass = false;
        if (!password_requirements.uppercase.checked) pass = false;
        if (!password_requirements.lowercase.checked) pass = false;
        if (!password_requirements.number.checked) pass = false;
        if (!password_requirements.special.checked) pass = false;
        if (!password_requirements.length.checked) pass = false;

        if (!pass) {
            $passed = false;
            message.set({
                text: "Please fill out the field correctly",
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

        const {error} = await supabase.auth.reauthenticate();

        if (error) {
            message.set({
                text: error.message,
                style: "text-error-500"
            })
            loading.set(false);
            return;
        }

        const modalComponent: ModalComponent = {
            ref: CodeModalSix,
        }

        const nonce: string = await new Promise((resolve) => {
            modalStore.trigger({
                type: 'component',
                title: 'Confirm password change',
                body: 'Please check your email for a confirmation code.',
                component: modalComponent,
                response: (value) => {
                    resolve(value)
                }
            })
        });

        if (!nonce) return;

        const {error: updateError} = await supabase.auth.updateUser({
            password: $password,
            nonce: nonce
        });
        loading.set(false);

        if (updateError) {
            message.set({
                text: updateError.message,
                style: "text-error-500"
            })
            return;
        }

        message.set({
            text: "Password updated successfully!",
            style: "text-success-500"
        })

        $password = "";
    }
</script>

{#if $currentUser}
    <div class="absolute w-full bottom-0 grid grid-cols-[auto_1fr]">
        <div class="lg:w-96 md:w-72 mx-5 h-full"></div>
        <div class="mx-auto max-w-2xl w-fit h-fit z-10 rounded-md">
            <button class="btn variant-ghost-error shadow-2xl ease-in-out transition-all {!$changesMade ? 'opacity-0 invisible mb-0' : 'opacity-100 mb-10'}"
                    on:click={saveChanges}>
                Save changes
            </button>
        </div>
    </div>

    <div class="w-full h-full grid grid-cols-[auto_1fr]">
        <div class="w-full h-full pl-5 pb-5">
            <div class="lg:w-96 md:w-72 mx-5 h-full shadow-stance rounded-md p-5">
                <TableOfContents>
                    <div class="flex items-center h-10">
                        <Avatar width="w-10 mr-3" initials="{$currentUser?.short_username || 'AB'}"
                                src="{$currentUser?.avatar_url || ''}"></Avatar>
                        <h3 class="h5">{$currentUser?.username}</h3>
                    </div>
                </TableOfContents>
            </div>
        </div>
        <div class="w-full h-full max-w-5xl p-5 pb-10 pr-10 pt-5 m-auto"
             use:tocCrawler={{ mode: 'generate' }}>
            <div class="w-full h-full overflow-y-auto">
                <h2 class="h2" id="public-profile">Public profile</h2>

                <hr class="w-full h-[2px] my-4 bg-gray-300 border-0">
                <div class="grid grid-cols-[1fr_auto]">
                    <div class="m-5 w-full">
                        <label for="username" class="h4 mb-2">Username</label>
                        <input type="text" id="username"
                               class="w-96 h-10 rounded-md shadow-stance-invert input border-0 p-4"
                               bind:value={$currentUser.username}>
                    </div>
                    <div class="m-5 mr-10">
                        <p class="mb-3 h4">Profile picture</p>
                        <div class="relative w-52 h-52">
                            <Avatar width="w-52 mr-3" initials="{$currentUser?.short_username || 'AB'}"
                                    src="{$currentUser?.avatar_url || ''}"></Avatar>
                            <button class="btn variant-ghost btn-sm flex items-center bottom-0 left-0 absolute bg-surface-200 mb-5 hover:shadow-stance">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"
                                     class="mr-1">
                                    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"></path>
                                </svg>
                                Edit
                            </button>
                        </div>
                    </div>
                </div>

                <h2 class="sr-only" id="account">Account</h2>


                <h2 class="h2" id="authentication">Password and authentication</h2>
                <hr class="w-full h-[2px] my-4 bg-gray-300 border-0">

                <div class="w-full p-5 flex flex-col">
                    <span class="h4 mb-2 w-full">
                    Update Password
                    </span>
                    <span class="inline-flex items-center justify-left w-96 relative">
                        <input id="password"
                               class="h-10 rounded-md shadow-stance-invert input border-0 p-4"
                               type="password" placeholder="New Password"
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
                        </span>
                    </span>
                    {#if $loading}
                        <ProgressBar class="mt-2 w-96" meter="bg-primary-400" track="bg-surface-400"/>
                    {/if}

                    {#if $message.text !== ""}
                        <p class="mt-2 w-96 {$message.style}">{$message.text}</p>
                    {/if}
                    <ul class="list ml-3 mb-8 mt-5 text-sm">
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
            </div>
        </div>
    </div>
{/if}