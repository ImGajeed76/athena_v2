<script lang="ts">
    import {writable} from "svelte/store";
    import {Code, getInitials, Group} from "$lib/groups";
    import {onMount} from "svelte";
    import {loggedIn} from "$lib/database";
    import {page} from "$app/stores";
    import {goto} from "$app/navigation";
    import {Avatar, getToastStore, ProgressRadial} from "@skeletonlabs/skeleton";

    const group = writable<Group | null>(null);
    const loading = writable<boolean>(true);

    const toastStore = getToastStore();

    onMount(() => {
        setTimeout(async () => {
            if ($loggedIn && $loading) {
                $group = new Group($page.params.uid, false);
                const code = await $group.load();
                if (code === Code.Success) {
                    $loading = false;
                } else if (code === Code.NoGroup) {
                    await goto("/groups")
                }
            }
        }, 1000)

        loggedIn.subscribe(async (value) => {
            if (value && $loading) {
                $group = new Group($page.params.uid, false);
                const code = await $group.load();
                if (code === Code.Success) {
                    $loading = false;
                } else if (code === Code.NoGroup) {
                    await goto("/groups")
                }
            }
        })

        registerEventListeners();
    });

    function registerEventListeners() {

        const registerRoute = window.location.pathname;

        const onKeyDown = (event: KeyboardEvent) => {
            if (registerRoute !== window.location.pathname) {
                window.removeEventListener("keydown", onKeyDown);
                return;
            }

            if (event.ctrlKey && event.key === "s") {
                event.preventDefault();
                save();
            }
        }

        window.addEventListener("keydown", onKeyDown);

    }

    async function save() {
        if ($group) {
            const code = await $group.save();
            $group = $group.copy();

            if (code === Code.Success) {
                changesMade.set(false);
            } else {
                toastStore.trigger({
                    message: "Something went wrong",
                    background: "bg-error-500",
                    classes: "text-white",
                    timeout: 3000,
                    hideDismiss: true
                })
            }
        }
    }

    async function removeUser(user: string) {
        if ($group) {
            await $group.removeUser(user);
            $group = $group.copy();
        }
    }

    const currentInput = writable<string>("");
    async function addUser() {
        if ($group) {
            if ($currentInput === "") {
                return;
            }

            if ($group.users.includes($currentInput)) {
                toastStore.trigger({
                    message: "This name is already in the list",
                    background: "bg-error-500",
                    classes: "text-white",
                    timeout: 3000,
                    hideDismiss: true
                })

                setTimeout(() => {
                    selectNameInput(false);
                }, 100)
                return;
            }

            await $group.addUser($currentInput);
            $group = $group.copy();

            setTimeout(() => {
                scrollToBottom();
            }, 100)
            selectNameInput();
        }
    }

    function selectNameInput(clear_input: boolean = true) {
        const inputElement = document.getElementById("user-input") as HTMLInputElement;
        if (clear_input) inputElement.value = "";
        inputElement.focus();
        inputElement.select();
    }

    function scrollToBottom() {
        const namesElement = document.getElementById("names");
        if (namesElement) {
            namesElement.scrollTo({
                top: namesElement.scrollHeight,
                behavior: "smooth"
            })
        }
    }

    function displaySafeButton() {
        changesMade.set(true);
    }


    const changesMade = writable<boolean>(false);
</script>

<style>
    .no-scroll-background::-webkit-scrollbar-track {
        background-color: transparent;
        border-radius: 50px;
    }
</style>

{#if $loading}
    <div class="w-full h-full grid items-center justify-around">
        <ProgressRadial size="large"/>
    </div>
{:else if $group}
    <div class="w-full h-screen pt-16">
        <div class="absolute w-full bottom-0 z-50">
            <div class="mx-auto max-w-2xl w-full h-fit rounded-md">
                <div class="shadow-2xl ease-in-out transition-all {!$changesMade ? 'opacity-0 invisible lg:mb-0 -mb-10' : 'opacity-100 lg:mb-10 mb-0'} bg-white py-2 px-5 rounded-md flex flex-row items-center justify-between">
                    <p class="text-lg">Don't forget to save your changes!</p>
                    <button class="btn variant-ghost-error hover:variant-filled-error"
                            on:click={save}>
                        Save changes
                    </button>
                </div>
            </div>
        </div>

        <div class="w-full h-full max-w-4xl xl:max-w-6xl p-5 pt-10 m-auto grid grid-rows-[1fr_auto_1fr]">
            <div class="h-full">
                <div class="mb-5 flex flex-row justify-between">
                    <a href="/groups/{$group.short_uuid}" class="flex flex-row items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                            <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"></path>
                        </svg>
                        Back to Group
                    </a>
                </div>

                <input id="title-input" class="text-4xl input mb-2" bind:value={$group.title} on:input={displaySafeButton} placeholder="Title">
                <input id="description-input" class="input" bind:value={$group.description} on:input={displaySafeButton} placeholder="Description">
                <div class="h-7"></div>
            </div>

            <div class="overflow-y-auto h-full shadow-stance-invert rounded-md no-scroll-background" id="names">
                <div class="h-7"></div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-7xl px-10 m-auto">
                    {#each $group.users as user}
                        <div class="p-2">
                            <div class="p-5 shadow-stance-down rounded-md relative">
                                <div class="absolute top-0 right-0 p-3">
                                    <button on:click={(() => {removeUser(user)})}
                                            class="hover:shadow-stance active:shadow-stance-down active:translate-y-0 hover:bg-error-200 hover:-translate-y-1 duration-200 p-2 rounded-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                                            <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div class="flex flex-row items-center justify-center mb-2">
                                    <Avatar initials={getInitials(user)}/>
                                </div>
                                <p class="text-xl text-center">{user}</p>
                            </div>
                        </div>
                    {/each}
                </div>

                {#if $group.users.length === 0}
                    <div class="w-full flex justify-center">
                        <p class="text-xl">No names to show</p>
                    </div>
                {/if}

                <div class="h-7"></div>
            </div>


            <div class="h-full">
                <div class="h-7"></div>
                <div class="w-full flex justify-around">
                    <form class="input-group input-group-divider grid-cols-[1fr_auto] w-full max-w-lg" on:submit={addUser}>
                        <input id="user-input" type="text" placeholder="Name..." bind:value={$currentInput}/>
                        <button class="variant-filled-secondary" type="submit">Add Name</button>
                    </form>
                </div>

                <div class="h-14"></div>
            </div>
        </div>
    </div>
{/if}