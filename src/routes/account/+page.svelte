<script lang="ts">
    import type {ModalComponent} from "@skeletonlabs/skeleton";
    import {Avatar, getModalStore, TableOfContents, tocCrawler} from '@skeletonlabs/skeleton';
    import {currentUser, supabase, updateMetadata} from "$lib/database";
    import {writable} from "svelte/store";
    import CodeModalSix from "../../modules/modals/CodeModalSix.svelte";
    import PasswordCheck from "../../modules/auth/PasswordCheck.svelte";
    import Enable2FA from "../../modules/auth/Enable2FA.svelte";
    import Disable2FA from "../../modules/auth/Disable2FA.svelte";

    const modalStore = getModalStore();

    let userName = writable("");
    let changesMade = writable(false);

    userName.subscribe(() => {
        checkForChanges();
    });

    function checkForChanges() {
        changesMade.set(false);

        if ($userName !== "") {
            changesMade.set(true);
        }

        if ($password !== "") {
            changesMade.set(true);
        }
    }

    async function saveChanges() {
        if ($currentUser && $userName !== "") {
            $currentUser.username = $userName;
            $userName = "";
            await updateMetadata();
        }
        if ($password !== "") await updatePassword();

        checkForChanges();
    }

    const passPassed = writable(false);
    const passed = writable(true);
    const password = writable("");
    password.subscribe(() => {
        checkForChanges();
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

        if (!$passPassed) {
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
                        <label for="username" class="h4 mb-2">Update Username</label>
                        <input type="text" id="username"
                               class="w-96 h-10 rounded-md input p-4"
                               bind:value={$userName}
                               placeholder="Username"
                        >
                    </div>
                    <div class="m-5 mr-10">
                        <p class="mb-3 h4">Profile picture</p>
                        <div class="relative w-52 h-52">
                            <Avatar width="w-52 mr-3" initials="{$currentUser?.short_username || 'AB'}"
                                    src="{$currentUser?.avatar_url || ''}"></Avatar>
                            <a href="/account/change-avatar" class="btn variant-ghost btn-sm flex items-center bottom-0 left-0 absolute bg-surface-200 mb-5 hover:shadow-stance">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"
                                     class="mr-1">
                                    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"></path>
                                </svg>
                                Edit
                            </a>
                        </div>
                    </div>
                </div>

                <h2 class="sr-only" id="account">Account</h2>


                <h2 class="h2" id="authentication">Password and authentication</h2>
                <hr class="w-full h-[2px] my-4 bg-gray-300 border-0">

                <div class="w-96 p-5 flex flex-col">
                    <PasswordCheck passed={passed} password={password} passPassed={passPassed} message={message}
                                   loading={loading}>
                        <p class="h4 mb-2">Update Password</p>
                    </PasswordCheck>
                </div>

                <div class="p-5">
                    <p class="h4 mb-2 ml-2">2 Factor authentication</p>
                    {#if $currentUser.aal.currentLevel}
                        {#if $currentUser.aal.currentLevel.toString() === "aal1"}
                            <Enable2FA/>
                        {:else if $currentUser.aal.currentLevel.toString() === "aal2"}
                            <Disable2FA/>
                        {/if}
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}