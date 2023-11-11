<script lang="ts">
    import '../app.postcss';

    // Floating UI for Popups
    import {arrow, autoUpdate, computePosition, flip, offset, shift} from '@floating-ui/dom';
    import {
        AppShell,
        Avatar,
        Drawer,
        getDrawerStore,
        initializeStores,
        Modal,
        storePopup,
        Toast
    } from '@skeletonlabs/skeleton';
    import {goto} from "$app/navigation";
    import {onMount} from "svelte";
    import {page} from "$app/stores";
    import {currentUser, get2FAid, loggedIn, logout} from "$lib/database";
    import {inject} from '@vercel/analytics';
    import {formatStars, github_star_count, updateGithubStarCount} from "$lib/other";

    inject({mode: 'production'});

    storePopup.set({computePosition, autoUpdate, flip, shift, offset, arrow});
    initializeStores();

    const drawerStore = getDrawerStore();

    const allowedIfNoUser = [
        "/login",
        "/signup",
        "/auth",
        "/ee",
        "/"
    ]

    function openAccountDrawer() {
        drawerStore.open({
            id: 'account',
            bgDrawer: 'bg-surface-50 text-black',
            width: 'w-[250px] md:w-[350px]',
            rounded: 'rounded-l-xl',
            position: 'right',
        })
    }

    onMount(() => {
        updateGithubStarCount();

        page.subscribe((value) => {
            if (!$loggedIn) {
                setTimeout(() => {
                    if (!$loggedIn && !allowedIfNoUser.includes(value.route.id || "")) {
                        goto('/login?redirect=' + encodeURIComponent(value.route.id || "/"))
                    }
                }, 1000)
            }

            let bar = document.getElementById('bar')!;
            if (value.status === 404) {
                bar.style.background = "linear-gradient(to bottom, rgba(0, 0, 0, L7zb6X), rgba(0, 0, 0, 0.L7zb6X))";
            } else {
                bar.style.background = "";
            }

            setTimeout(() => {
                if ($currentUser && $currentUser.aal.currentLevel === "aal1") {
                    get2FAid().then(({data, error}) => {
                        if (error || !data) return;
                        if (data.id) {
                            logout();
                        }
                    })
                }
            }, 1000)
        })
    })
</script>

<Drawer>
    <div class="h-full">
        {#if $drawerStore.id === 'account'}
            <div class="p-5 h-full grid grid-rows-[auto_1fr]">
                <div class="flex justify-between">
                    <div class="flex items-center h-10">
                        <Avatar width="w-10 mr-3" initials="{$currentUser?.short_username || 'AB'}"
                                src="{$currentUser?.avatar_url || ''}"></Avatar>
                        <h3 class="h5">{$currentUser?.username}</h3>
                    </div>
                    <button class="btn btn-sm w-fit h-full outline-0 border-0" on:click={drawerStore.close}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                            <path d="M5.72 5.72a.75.75 0 0 1 1.06 0L12 10.94l5.22-5.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L13.06 12l5.22 5.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L12 13.06l-5.22 5.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L10.94 12 5.72 6.78a.75.75 0 0 1 0-1.06Z"></path>
                        </svg>
                    </button>
                </div>

                <div class="pt-7 px-3 h-full relative">
                    <ul class="list">
                        <li>
                            <button class="py-2 pl-3 flex items-center w-full btn btn-3d-transparent duration-200 justify-start"
                                    on:click={() => {
                                        drawerStore.close();
                                        goto('/account')
                                    }}>
                                    <span class="mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16"
                                             height="16">
                                            <path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z">
                                            </path>
                                        </svg>
                                    </span>
                                Account
                            </button>
                        </li>
                    </ul>
                    <hr class="h-[2px] bg-surface-500-400-token my-2">

                    <button class="absolute bottom-0 w-full mb-5 text-error-500 hover:shadow-stance btn hover:bg-error-200 flex items-center"
                            on:click={logout}
                    >
                        <span class="mr-0">Logout</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                            <path fill="#f22c5d"
                                  d="M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 0 1 0 1.5h-2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5A1.75 1.75 0 0 1 2 13.25Zm10.44 4.5-1.97-1.97a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.97-1.97H6.75a.75.75 0 0 1 0-1.5Z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        {:else}
            <p>Error: Invalid Drawer ID</p>
        {/if}
    </div>
</Drawer>


<Modal/>
<Toast/>

<div class="h-screen w-screen">
    <AppShell>
        <svelte:fragment slot="header">
            <div id="bar" class="sticky grid w-full items-center h-16 px-5 overflow-hidden shadow-xl">
                <div class="w-full max-w-6xl mx-auto flex justify-between items-center">
                    <div class="flex flex-row items-center">
                        {#if $page.status === 404}
                            <a href="/" class="h3 p-2 text-white">Home</a>
                        {:else}
                            <div class="flex items-center">
                                <img src="/athenas_helmet_black.svg" alt="Helmet" class="h-8">
                                <a href="/" class="h3 p-2">Athena</a>
                            </div>
                        {/if}
                        <div class="mt-2 ml-5">
                            <a href="/cards" class="hover:bg-gray-100 p-2 px-4 rounded-md duration-200">Cards</a>
                        </div>
                    </div>
                    <div class="flex flex-row">
                        <a href="https://github.com/ImGajeed76/athena_v2" target="_blank" class="items-center flex flex-row p-2 rounded-md h-10 justify-center hover:bg-gray-100 mr-2 duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" class="">
                                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                            </svg>
                            <p class="ml-2">{formatStars($github_star_count)}</p>
                        </a>
                        {#if $loggedIn}
                            <button
                                    class="h-10 w-10 text-white rounded-full btn variant-ghost grid justify-center items-center"
                                    on:click={openAccountDrawer}
                            >
                                <Avatar width="w-10" initials="{$currentUser?.short_username || 'AB'}"
                                        src="{$currentUser?.avatar_url || ''}"></Avatar>
                            </button>
                        {:else}
                            <button
                                    class="h-10 w-10 text-white rounded-full btn variant-ghost grid justify-center items-center"
                                    on:click={() => {
                                    goto('/login')
                                }}
                            >
                                <svg viewBox="0 0 16 16" width="16" height="16">
                                    <path d="M4.243 4.757a3.757 3.757 0 1 1 5.851 3.119 6.006 6.006 0 0 1 3.9 5.339.75.75 0 0 1-.715.784H2.721a.75.75 0 0 1-.714-.784 6.006 6.006 0 0 1 3.9-5.34 3.753 3.753 0 0 1-1.664-3.118Z"></path>
                                </svg>
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        </svelte:fragment>
        <div class="w-full h-full pt-5">
            <slot/>
        </div>
    </AppShell>
</div>
