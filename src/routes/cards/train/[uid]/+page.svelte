<script lang="ts">
    import type {NextCardReturn, UpdateCardReturn} from "$lib/cards";
    import {Card, getSet, importCards, saveProgress, Side, Trainer} from "$lib/cards";
    import {writable} from "svelte/store";
    import {onMount} from "svelte";
    import {page} from "$app/stores";
    import {ProgressBar, ProgressRadial} from "@skeletonlabs/skeleton";
    import {goto} from "$app/navigation";
    import {loggedIn} from "$lib/database";

    enum Screen {
        Start,
        Card,
        Card_End,
        Round_End,
        End
    }

    let mounted = false;

    let trainer = new Trainer([], undefined, "definition");

    const screen = writable<Screen>(Screen.Start);
    const round = writable<number>(0);

    const currentCard = writable<Card>();

    const card_title = writable<string>("");
    const card_example = writable<string | null>("");
    const card_reference = writable<string | null>("");
    const input_type = writable<"text" | "select">("text");
    const input_value = writable<string>("");
    const input_options = writable<Card[]>([]);
    const input_selected_option = writable<number>(0);

    const updateResponse = writable<UpdateCardReturn>();

    const upperProgress1000 = writable<number>(0);
    const upperProgress = writable<number>(0);
    const updateProgress = writable<boolean>(false);

    card_title.subscribe(() => {
        setTimeout(() => {
            if (mounted && window && document) {
                const input_element = document.getElementById("text-input-field") as HTMLInputElement;
                if (!input_element) return;
                input_element.focus();
                input_element.select();
            }
        }, 50)
    })

    currentCard.subscribe((card) => {
        if (card === undefined) return;

        if (trainer.round_side === Side.Value) {
            card_title.set(card.definition);
            card_example.set(card.definition_example);
            card_reference.set(card.reference);
            input_type.set(card.value_streak > 0 ? "text" : "select");
            if (card.value_streak === 0) {
                const options = [card];
                for (let i = 0; i < Math.min(3, trainer.cards.length - 1); i++) {
                    options.push(trainer.randomCard(options));
                }
                options.sort(() => Math.random() - 0.5);
                input_options.set(options);
            }
        }

        if (trainer.round_side === Side.Definition) {
            card_title.set(card.value);
            card_example.set(card.value_example);
            card_reference.set(card.reference);
            input_type.set(card.definition_streak > 0 ? "text" : "select");
            if (card.definition_streak === 0) {
                const options = [card];
                for (let i = 0; i < 3; i++) {
                    options.push(trainer.randomCard(options));
                }
                options.sort(() => Math.random() - 0.5);
                input_options.set(options);
            }
        }
    })

    function selectAnswer(card: Card) {
        input_selected_option.set($input_options.indexOf(card));
        update(trainer.round_side === Side.Value ? card.value : card.definition);
    }

    function submitAnswer() {
        update($input_value);
    }

    function update(answer: string) {
        if (!$currentCard) {
            console.error("No current card to update");
            return;
        }

        updateProgress.set(true);

        updateResponse.set(trainer.updateCard($currentCard, trainer.round_side, answer, 0));
        screen.set(Screen.Card_End);
        if (!$updateResponse.error && $updateResponse.correct) {
            setTimeout(() => {
                nextCard();
            }, 1000)
        }
    }

    function nextCard() {
        if ($round !== trainer.round) {
            round.set(trainer.round);
            screen.set(Screen.Round_End);
            saveProgress($set.progress_uuid, trainer);
            return;
        }

        if (trainer.learn_percentage === 100) {
            screen.set(Screen.End);
            initConfetti();
            render();
            return;
        }

        input_value.set("");
        screen.set(Screen.Card);
    }

    screen.subscribe(() => {
        if ($screen === Screen.Card) {
            const response = trainer.nextCard as NextCardReturn;
            if (!response.error) {
                currentCard.set(response.card);
            }
        }
    })

    function setMounted() {
        trainer.import($set.trainer);

        if (trainer.learn_percentage === 100 || trainer.cards.length === 0) {
            screen.set(Screen.End);
            return;
        }

        mounted = true;
        round.set(trainer.round);

        console.log(trainer)

        if (trainer.learned_deck.length > 0) {
            screen.set(Screen.Card);
        }

        window.addEventListener("keypress", (event) => {
            if (!$page.route.id?.startsWith("/cards/train/")) return;
            if ($screen === Screen.Card_End || $screen === Screen.Round_End) nextCard();
            if ($screen === Screen.Card && $input_type === "select") {
                if (event.key === "1" && $input_options.length > 0) selectAnswer($input_options[0]);
                if (event.key === "2" && $input_options.length > 1) selectAnswer($input_options[1]);
                if (event.key === "3" && $input_options.length > 2) selectAnswer($input_options[2]);
                if (event.key === "4" && $input_options.length > 3) selectAnswer($input_options[3]);
            }
            if (event.key === "Escape") escape();
        })

        //---------Execution--------
        setTimeout(() => {
            initializeConfetti();

            window.addEventListener('resize', function () {
                resizeCanvas();
            });
        }, 1000)

    }

    const loading = writable<boolean>(true);
    const set = writable<{
        set_uuid: string,
        progress_uuid: string,
        title: string,
        authors: string[],
        private: boolean,
        values: string[],
        definitions: string[],
        trainer: Trainer,
    }>();

    onMount(() => {
        setTimeout(async () => {
            if ($loggedIn && $loading) {
                const new_set = await getSet($page.params.uid)
                if (new_set.data) {
                    set.set(new_set.data)
                    loading.set(false)
                    setMounted();
                }
            }
        }, 1000)

        loggedIn.subscribe(async (loggedIn) => {
            if (loggedIn && $loading) {
                const new_set = await getSet($page.params.uid)
                if (new_set.data) {
                    set.set(new_set.data)
                    loading.set(false)
                    setMounted();
                }
            }
        })
    })

    setInterval(() => {
        if (!$updateProgress) return;
        let currentLength = trainer.current_card_index;
        if (currentLength === 0 && trainer.repetition_deck.length > 0) currentLength = trainer.current_deck_length;
        upperProgress.set(currentLength / (trainer.current_deck_length + trainer.repetition_deck.length));
        if ($upperProgress < 0 || !$upperProgress) upperProgress.set(0);
        const diff = ($upperProgress * 1000) - $upperProgress1000;
        upperProgress1000.set($upperProgress1000 + diff / 5);
        if (diff < 0.1 && diff > -0.1) updateProgress.set(false);
    }, 10)

    let resizeCanvas: () => void;
    let randomRange: (min: number, max: number) => number;
    let initConfetti: () => void;
    let render: () => void;

    function initializeConfetti() {
        //-----------Var Inits--------------
        let canvas = document.getElementById("canvas") as HTMLCanvasElement;
        if (!canvas) return;
        let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let cx = ctx.canvas.width / 2;
        let cy = ctx.canvas.height / 2;

        let confetti: {
            color: { front: string, back: string },
            dimensions: { x: number, y: number },
            position: { x: number, y: number },
            rotation: number,
            scale: { x: number, y: number },
            velocity: { x: number, y: number }
        }[] = [];
        const confettiCount = 300;
        const gravity = 0.5;
        const terminalVelocity = 5;
        const drag = 0.075;
        const colors = [
            {front: 'red', back: 'darkred'},
            {front: 'green', back: 'darkgreen'},
            {front: 'blue', back: 'darkblue'},
            {front: 'yellow', back: 'darkyellow'},
            {front: 'orange', back: 'darkorange'},
            {front: 'pink', back: 'darkpink'},
            {front: 'purple', back: 'darkpurple'},
            {front: 'turquoise', back: 'darkturquoise'}];


        //-----------Functions--------------
        resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            cx = ctx.canvas.width / 2;
            cy = ctx.canvas.height / 2;
        };

        randomRange = (min, max) => Math.random() * (max - min) + min;

        initConfetti = () => {
            for (let i = 0; i < confettiCount; i++) {
                confetti.push({
                    color: colors[Math.floor(randomRange(0, colors.length))],
                    dimensions: {
                        x: randomRange(10, 20),
                        y: randomRange(10, 30)
                    },

                    position: {
                        x: randomRange(0, canvas.width),
                        y: canvas.height - 1
                    },

                    rotation: randomRange(0, 2 * Math.PI),
                    scale: {
                        x: 1,
                        y: 1
                    },

                    velocity: {
                        x: randomRange(-25, 25),
                        y: randomRange(0, -50)
                    }
                });


            }
        };

        //---------Render-----------
        render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            confetti.forEach((confetto, index) => {
                let width = confetto.dimensions.x * confetto.scale.x;
                let height = confetto.dimensions.y * confetto.scale.y;

                // Move canvas to position and rotate
                ctx.translate(confetto.position.x, confetto.position.y);
                ctx.rotate(confetto.rotation);

                // Apply forces to velocity
                confetto.velocity.x -= confetto.velocity.x * drag;
                confetto.velocity.y = Math.min(confetto.velocity.y + gravity, terminalVelocity);
                confetto.velocity.x += Math.random() > 0.5 ? Math.random() : -Math.random();

                // Set position
                confetto.position.x += confetto.velocity.x;
                confetto.position.y += confetto.velocity.y;

                // Delete confetti when out of frame
                if (confetto.position.y >= canvas.height) confetti.splice(index, 1);

                // Loop confetto x position
                if (confetto.position.x > canvas.width) confetto.position.x = 0;
                if (confetto.position.x < 0) confetto.position.x = canvas.width;

                // Spin confetto by scaling y
                confetto.scale.y = Math.cos(confetto.position.y * 0.1);
                ctx.fillStyle = confetto.scale.y > 0 ? confetto.color.front : confetto.color.back;

                // Draw confetti
                ctx.fillRect(-width / 2, -height / 2, width, height);

                // Reset transform matrix
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            });

            window.requestAnimationFrame(render);
        };
    }

    function restart() {
        trainer.restart();
        screen.set(Screen.Start);
    }

    function escape() {
        goto("/cards/" + $set.set_uuid);
    }
</script>

<style>
    .confetti {
        display: block;
    }
</style>

{#if $loading}
    <div class="w-full h-full grid items-center justify-around">
        <ProgressRadial size="large"/>
    </div>
{:else if $set}
    <div class="fixed w-screen h-screen">
        <canvas class="confetti absolute top-0 left-0 w-screen h-screen -z-10" id="canvas"></canvas>
        <ProgressBar value={$upperProgress1000} max={1000} meter="bg-secondary-500"
                     class="absolute -top-5 duration-200"/>
        <div class="absolute top-0 right-0 m-5 mr-9">
            <button on:click={escape}
                    class="outline rounded-full p-1 outline-1 outline-gray-300 hover:bg-secondary-500 duration-200 hover:scale-110 hover:outline-none active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill-opacity="80%"
                          d="M5.72 5.72a.75.75 0 0 1 1.06 0L12 10.94l5.22-5.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L13.06 12l5.22 5.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L12 13.06l-5.22 5.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L10.94 12 5.72 6.78a.75.75 0 0 1 0-1.06Z"></path>
                </svg>
            </button>
        </div>
        {#if $screen === Screen.Start}
            <div class="w-full h-full grid items-center">
                <div class="w-full">
                    <p class="text-5xl text-center text-gray-800">Ready to start learning?</p>
                    <div class="m-auto w-fit mt-5">
                        <button class="btn w-44 variant-filled-primary btn-3d-primary"
                                on:click={() => setTimeout(() => $screen = Screen.Card, 200)}>START
                        </button>
                    </div>
                </div>
            </div>
        {:else if $screen === Screen.Card}
            <div class="w-full h-full grid items-center relative">
                <div class="m-auto w-full max-w-2xl h-full max-h-96 shadow-stance p-10 rounded-md">
                    <p class="text-xl">{$card_title}</p>

                    <div class="relative h-full">
                        {#if $input_type === 'select'}
                            <div class="w-full absolute bottom-0 mb-7">
                                <p class="mb-3">Choose the right answer</p>
                                <div class="w-full grid grid-cols-2">
                                    {#each $input_options as option, index}
                                        <div class="w-full h-full p-2">
                                            <button class="w-full h-full btn variant-ghost hover:variant-filled-primary hover:shadow-2xl duration-200 p-4"
                                                    on:click={() => selectAnswer(option)}
                                            >
                                                {index + 1}.
                                                <br>
                                                <span class="text-start w-full truncate ...">{trainer.round_side === Side.Value ? option.value : option.definition}</span>
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {:else}
                            <div class="w-full absolute bottom-0 mb-7">
                                <form on:submit={submitAnswer}>
                                    <input id="text-input-field" type="text" class="input" placeholder="Your Answer"
                                           bind:value={$input_value}>
                                    <div class="w-full flex justify-end">
                                        <button type="submit" class="btn variant-filled-primary mt-2">Submit</button>
                                    </div>
                                </form>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {:else if $screen === Screen.Card_End}
            <div class="w-full h-full grid items-center">
                <div class="m-auto w-full max-w-2xl h-full max-h-96 shadow-stance p-10 rounded-md">
                    {#if !$updateResponse.error}
                        <p class="text-xl">{$card_title}</p>

                        <div class="relative h-full">
                            {#if $input_type === 'select'}
                                <div class="w-full absolute bottom-0 mb-7">
                                    {#if $updateResponse.correct}
                                        <p class="mb-3 text-success-500">Well done!</p>
                                    {:else}
                                        <p class="mb-3 text-error-500">Maybe next time...</p>
                                    {/if}
                                    <p class="mb-3"></p>
                                    <div class="w-full grid grid-cols-2">
                                        {#each $input_options as option, index}
                                            {#if $input_selected_option === index && $updateResponse.correct}
                                                <div class="w-full h-full p-2">
                                                    <div class="w-full h-full btn bg-success-600 duration-200 p-4">
                                                        {index + 1}.
                                                        <br>
                                                        <span class="text-start w-full truncate ...">{trainer.round_side === Side.Value ? option.value : option.definition}</span>
                                                    </div>
                                                </div>
                                            {:else if $input_selected_option === index && !$updateResponse.correct}
                                                <div class="w-full h-full p-2">
                                                    <div class="w-full h-full btn bg-error-300 duration-200 p-4">
                                                        {index + 1}.
                                                        <br>
                                                        <span class="text-start w-full truncate ...">{trainer.round_side === Side.Value ? option.value : option.definition}</span>
                                                    </div>
                                                </div>
                                            {:else if (trainer.round_side === Side.Value && option.value === $updateResponse.correct_answer) || (trainer.round_side === Side.Definition && option.definition === $updateResponse.correct_answer)}
                                                <div class="w-full h-full p-2">
                                                    <div class="w-full h-full btn bg-success-600 duration-200 p-4">
                                                        {index + 1}.
                                                        <br>
                                                        <span class="text-start w-full truncate ...">{trainer.round_side === Side.Value ? option.value : option.definition}</span>
                                                    </div>
                                                </div>
                                            {:else}
                                                <div class="w-full h-full p-2">
                                                    <div class="w-full h-full btn bg-gray-100 duration-200 p-4">
                                                        {index + 1}.
                                                        <br>
                                                        <span class="text-start w-full truncate ...">{trainer.round_side === Side.Value ? option.value : option.definition}</span>
                                                    </div>
                                                </div>
                                            {/if}
                                        {/each}
                                    </div>
                                </div>
                            {:else}
                                <div class="w-full absolute bottom-0 mb-7">
                                    {#if $updateResponse.correct}
                                        <p class="mb-3 text-success-500">Well done!</p>
                                        <div class="w-full outline-green-500 outline-1 outline rounded-md bg-success-200 p-5 text-gray-700">
                                            {$input_value}
                                        </div>
                                    {:else}
                                        <p class="mb-3 text-gray-800">Maybe next time...</p>
                                        <div class="w-full outline-red-500 outline-1 outline rounded-md bg-error-200 p-5 text-gray-700">
                                            {$input_value || "Skipped"}
                                        </div>
                                        <p class="my-3 text-gray-800">Correct Value</p>
                                        <div class="w-full outline-green-500 outline-1 outline rounded-md bg-success-200 p-5 text-gray-700">
                                            {$updateResponse.correct_answer}
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <div>Something went wrong 😬</div>
                    {/if}
                </div>

                {#if !$updateResponse.error && !$updateResponse.correct}
                    <div class="absolute bottom-0 h-fit mb-20 w-full bg-gray-100 p-5 flex justify-center">
                        <div class="max-w-2xl w-full flex items-center justify-between">
                            <p>Press any key to continue...</p>
                            <button class="btn variant-filled-primary" on:click={nextCard}>Continue</button>
                        </div>
                    </div>
                {/if}
            </div>
        {:else if $screen === Screen.Round_End}
            <div class="w-full h-full grid items-center">
                <div class="m-auto w-full max-w-2xl h-96 shadow-stance p-10 rounded-md">
                    <div class="flex justify-between">
                        <p class="text-3xl">Your doing great! 🎉</p>
                        <p class="text-5xl text-success-600">{trainer.learn_percentage}%</p>
                    </div>
                    <p class="mt-8 mb-2">What you already have learned or seen:</p>
                    <div class="h-full max-h-52 w-full overflow-y-auto rounded-md p-2 shadow-inner bg-surface-200">
                        {#each trainer.learned_deck.concat(trainer.current_deck) as card}
                            <div class="w-full p-1">
                                <div class="outline outline-1 w-full p-2 rounded-md outline-success-600 bg-success-100">
                                    <div class="w-full flex">
                                        <p class="w-[40%]">{card.value}</p>
                                        <p class="w-[40%]">{card.definition}</p>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="absolute bottom-0 h-fit mb-20 w-full bg-gray-100 p-5 flex justify-center">
                    <div class="max-w-2xl w-full flex items-center justify-between">
                        <p>Press any key to continue...</p>
                        <button class="btn variant-filled-primary" on:click={nextCard}>Continue</button>
                    </div>
                </div>
            </div>
        {:else if $screen === Screen.End}
            <div class="w-full h-full grid items-center">
                <div class="w-full">
                    <p class="text-center text-4xl w-full">🎉 Congratulations, you learned all your cards! 🎉</p>
                    <div class="w-full flex justify-center mt-5">
                        <div>
                            <button class="btn variant-filled-primary btn-3d-primary ml-2" on:click={restart}>Restart
                                Learning
                            </button>
                            <button class="btn variant-ghost btn-3d-ghost mr-2" on:click={escape}>Exit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
{/if}