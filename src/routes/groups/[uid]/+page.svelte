<script lang="ts">
    import {writable} from "svelte/store";
    import {Code, deleteGroup, getInitials, Group} from "$lib/groups";
    import {
        Avatar,
        getModalStore,
        getToastStore,
        type ModalSettings,
        ProgressRadial,
        Tab,
        TabGroup
    } from "@skeletonlabs/skeleton";
    import {onMount} from "svelte";
    import {loggedIn} from "$lib/database";
    import {page} from "$app/stores";
    import {goto} from "$app/navigation";
    import {scale, fly} from 'svelte/transition';
    import {backOut, cubicInOut} from "svelte/easing";
    import {deleteSet} from "$lib/cards";

    const group = writable<Group | null>(null);
    const loading = writable<boolean>(true);

    const toastStore = getToastStore();
    const modalStore = getModalStore();

    let tabSet: number = 0;

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
    });

    const randomNames = writable<string[]>([]);
    const randomNameCount = writable<number>(1);

    async function showRandomNames() {
        const lastLength = $randomNames.length;
        $randomNames = [];

        setTimeout(() => {
            if ($group) {
                $randomNames = [];
                const response = $group.randomNames($randomNameCount);
                if (!response.error && response.data) {
                    for (let i = 0; i < response.data.length; i++) {
                        $randomNames = [...$randomNames, response.data![i]];
                    }

                    if (response.data.length <= lastLength - 2) {
                        $randomNames = [];
                        setTimeout(() => {
                            for (let i = 0; i < response.data!.length; i++) {
                                $randomNames = [...$randomNames, response.data![i]];
                            }
                        }, 100);
                    }
                } else {
                    toastStore.trigger({
                        message: response.error?.message || "An error occurred.",
                        background: "bg-error-500",
                        classes: "text-white",
                        timeout: 3000,
                        hideDismiss: true
                    })
                }

                setTimeout(() => {
                    const randomNamesInput = document.getElementById("random-names-input") as HTMLInputElement;
                    if (randomNamesInput) {
                        randomNamesInput.focus();
                        randomNamesInput.select();
                    }
                }, 100);
            }
        }, 100 * lastLength);
    }

    const randomGroups = writable<(string | null)[][]>([]);
    const randomGroupCount = writable<number>(1);
    const randomGroupSize = writable<number>(1);

    async function showRandomGroupBySize() {
        if ($group) {
            const response = $group.randomGroupsBySize($randomGroupSize);
            if (!response.error && response.data) {
                await animateAdding(response.data);
            } else {
                toastStore.trigger({
                    message: response.error?.message || "An error occurred.",
                    background: "bg-error-500",
                    classes: "text-white",
                    timeout: 3000,
                    hideDismiss: true
                })
            }
        }
    }

    async function showRandomGroupByCount() {
        if ($group) {
            const response = $group.randomGroupsByCount($randomGroupCount);
            if (!response.error && response.data) {
                await animateAdding(response.data);
            } else {
                toastStore.trigger({
                    message: response.error?.message || "An error occurred.",
                    background: "bg-error-500",
                    classes: "text-white",
                    timeout: 3000,
                    hideDismiss: true
                })
            }
        }
    }

    async function animateAdding(newGroups: string[][]) {
        $randomGroups = [...new Array(newGroups.length).fill(
            [...new Array(Math.max(...newGroups.map(group => group.length))).fill(null)]
        )];

        const newGroupsCopy: (string | null)[][] = [];

        setTimeout(() => {
            const max = Math.max(...newGroups.map(group => group.length));
            newGroups.forEach((group, index) => {
                newGroupsCopy[index] = [];
                for (let i = 0; i < max; i++) {
                    newGroupsCopy[index].push(group[i] || null);
                }
            })

            $randomGroups = [...newGroupsCopy];
        }, 1000);
    }

    async function deleteThisGroup() {
        if (!$group) return;
        const modal: ModalSettings = {
            type: 'prompt',
            title: 'Confirm Deletion',
            body: `Are you sure you want to delete this group? This action cannot be undone. Type "${$group.title}" to confirm.`,
            value: '',
            valueAttr: {type: 'text', minlength: $group.title.length, maxlength: $group.title.length, required: true},
            response: async (r: string) => {
                if (!$group) return false;
                if (r === $group.title) {
                    await deleteGroup($group.short_uuid);
                    await goto("/groups");
                } else {
                    return false
                }
            },
        };
        modalStore.trigger(modal);
    }
</script>

{#if $loading}
    <div class="w-full h-full grid items-center justify-around">
        <ProgressRadial size="large"/>
    </div>
{:else if $group}
    <div class="w-full h-screen pt-16">
        <div class="w-full h-full max-w-4xl xl:max-w-6xl p-5 pt-10 m-auto grid grid-rows-[auto_1fr]">
            <div>
                <div class="flex flex-row justify-between items-center">
                    <div>
                        <p class="text-4xl">{$group.title}</p>
                        <p class="text-xl max-w-3xl">{$group.description}</p>
                        <p class="opacity-50">({$group.users.length} names)</p>
                    </div>

                    <div class="flex flex-row items-center">
                        <button class="btn variant-filled-secondary btn-3d-secondary mr-2"
                                on:click={() => {if ($group) goto("/groups/edit/" + $group.short_uuid)}}>Edit
                        </button>
                        <button class="btn variant-filled-error btn-3d-error" on:click={deleteThisGroup}>Delete</button>
                    </div>
                </div>

                <div class="h-14"></div>
            </div>

            <div class="h-full">
                <TabGroup hover="hover:variant-filled-secondary" regionPanel="h-full"
                          active="border-b-2 border-surface-900-50-token variant-filled-primary"
                          class="h-full grid grid-rows-[auto_1fr]"
                          border="h-full border-b border-surface-400-500-token">
                    <Tab bind:group={tabSet} name="randomNames" value={0}>
                        <span>Random Names</span>
                    </Tab>
                    <Tab bind:group={tabSet} name="randomGroups" value={1}>
                        <span>Random Groups</span>
                    </Tab>

                    <svelte:fragment slot="panel">
                        {#if tabSet === 0}
                            <div class="h-full overflow-y-auto"
                                 in:fly={{
                                        duration: 200,
                                        y: 0,
                                        opacity: 0,
                                        easing: cubicInOut,
                                        x: -100,
                                        delay: 200
                                    }}
                                 out:fly={{
                                        duration: 200,
                                        y: 0,
                                        opacity: 0,
                                        easing: cubicInOut,
                                        x: -100
                                    }}
                            >
                                <p>This mode will randomly choose one or multiple names.</p>

                                <div class="h-7"></div>

                                <div class="w-full grid grid-rows-[auto_1fr]">
                                    <div>
                                        <form class="input-group input-group-divider grid-cols-[1fr_auto]"
                                              on:submit={showRandomNames}>
                                            <input id="random-names-input" type="number" placeholder="Amount"
                                                   bind:value={$randomNameCount}/>
                                            <button class="variant-filled-primary" type="submit">Choose</button>
                                        </form>
                                    </div>

                                    <div class="h-full w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-5 justify-center">
                                        {#each $randomNames as name, i}
                                            <div class="p-2" transition:scale={{duration: 200, delay: 100 * i + 100, easing: backOut}}>
                                                <div class="p-5 shadow-stance-down rounded-md relative max-w-sm w-full">
                                                    <div class="flex flex-row items-center justify-center mb-2">
                                                        <Avatar initials={getInitials(name)}/>
                                                    </div>
                                                    <p class="text-lg text-center">{name}</p>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {:else if tabSet === 1}
                            <div
                                    in:fly={{
                                        duration: 200,
                                        y: 0,
                                        opacity: 0,
                                        easing: cubicInOut,
                                        x: 100,
                                        delay: 200
                                    }}
                                    out:fly={{
                                        duration: 200,
                                        y: 0,
                                        opacity: 0,
                                        easing: cubicInOut,
                                        x: 100
                                    }}
                            >
                                <p>This mode will randomly generate groups with a specified size or specified
                                    group-count.</p>

                                <div class="h-7"></div>

                                <div class="w-full grid grid-rows-[auto_1fr]">
                                    <div class="w-full grid grid-cols-2">
                                        <div class="mr-5">
                                            <p>By Group Size:</p>
                                            <form class="input-group input-group-divider grid-cols-[1fr_auto]"
                                                  on:submit={showRandomGroupBySize}>
                                                <input id="random-names-input" type="number" placeholder="Group Size"
                                                       bind:value={$randomGroupSize}/>
                                                <button class="variant-filled-primary" type="submit">Generate</button>
                                            </form>
                                        </div>

                                        <div class="ml-5">
                                            <p>By Group Count:</p>
                                            <form class="input-group input-group-divider grid-cols-[1fr_auto]"
                                                  on:submit={showRandomGroupByCount}>
                                                <input id="random-names-input" type="number" placeholder="Group Count"
                                                       bind:value={$randomGroupCount}/>
                                                <button class="variant-filled-primary" type="submit">Generate</button>
                                            </form>
                                        </div>
                                    </div>

                                    <div class="h-full w-full grid grid-cols-1 sm:grid-cols-{Math.min(2, $randomGroups.length)} md:grid-cols-{Math.min(3, $randomGroups.length)} lg:grid-cols-{Math.min(4, $randomGroups.length)} pt-5 justify-center">
                                        {#each $randomGroups as group}
                                            <div class="p-3 w-full h-full">
                                                <div class="w-full h-full p-3 shadow-stance-invert bg-primary-100 rounded-md grid grid-cols-1 sm:grid-cols-{Math.max(1, 3 - $randomGroups.length)} md:grid-cols-{Math.max(1, 4 - $randomGroups.length)}">
                                                    {#each group as name}
                                                        {#if name}
                                                            <div class="p-2 h-full"
                                                                 in:scale={{duration: 200, delay: Math.random() * 1000, easing: backOut}}>
                                                                <div class="p-5 shadow-stance-down rounded-md relative bg-white max-w-sm w-full">
                                                                    <div class="flex flex-row items-center justify-center mb-2">
                                                                        <Avatar initials={getInitials(name)}/>
                                                                    </div>
                                                                    <p class="text-lg text-center">{name}</p>
                                                                </div>
                                                            </div>
                                                        {:else if name === null}
                                                            <div class="p-2 h-full">
                                                                <div class="p-5 w-full h-full invisible">
                                                                    <div class="flex flex-row items-center justify-center mb-2">
                                                                        <Avatar initials="NaN"/>
                                                                    </div>
                                                                    <p class="text-lg text-center">NaN</p>
                                                                </div>
                                                            </div>
                                                        {/if}
                                                    {/each}
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </svelte:fragment>
                </TabGroup>
            </div>
        </div>
    </div>
{/if}