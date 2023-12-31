<script lang="ts">
    import type {NextCardReturn, UpdateCardReturn} from "$lib/cards";
    import {Card, getSet, saveProgress, Side, temporaryTrainers, Trainer} from "$lib/cards";
    import {writable} from "svelte/store";
    import {onMount} from "svelte";
    import {page} from "$app/stores";
    import {getModalStore, ProgressBar, ProgressRadial} from "@skeletonlabs/skeleton";
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
    const roundSide = writable<Side>(Side.Value);
    const readyToRender = writable<boolean>(false);

    roundSide.subscribe((side) => console.log(side))

    const currentCard = writable<Card>();

    const cardTitle = writable<string>("");
    const cardExample = writable<string | null>("");
    const cardReference = writable<string | null>("");
    const inputType = writable<"text" | "select">("text");
    const inputValue = writable<string>("");
    const inputOptions = writable<Card[]>([]);
    const inputSelectedOption = writable<number>(0);

    const updateResponse = writable<UpdateCardReturn>();

    const upperProgress1000 = writable<number>(0);
    const upperProgress = writable<number>(0);
    const updateProgress = writable<boolean>(false);

    const modalStore = getModalStore();

    const enterEnabled = writable<boolean>(true);

    cardTitle.subscribe(() => {
        setTimeout(() => {
            if (mounted && window && document) {
                const input_element = document.getElementById("text-input-field") as HTMLInputElement;
                if (!input_element) return;
                setTimeout(() => {
                    input_element.focus();
                    input_element.selectionStart = input_element.selectionEnd = input_element.value.length;
                }, 50)
            }
        }, 50)
    })

    currentCard.subscribe((card) => {
        if (card === undefined) return;

        if ($roundSide === Side.Value) {
            cardTitle.set(card.value);
            cardExample.set(card.value_example);
            cardReference.set(card.reference);
            inputType.set(card.value_streak > 0 ? "text" : "select");
            if (card.value_streak === 0) {
                const options = [card];
                for (let i = 0; i < Math.min(3, trainer.cards.length - 1); i++) {
                    options.push(trainer.randomCard(options));
                }
                options.sort(() => Math.random() - 0.5);
                inputOptions.set(options);
            }
            setTimeout(() => {
                readyToRender.set(true);
            }, 50)
        }

        if ($roundSide === Side.Definition) {
            cardTitle.set(card.definition);
            cardExample.set(card.definition_example);
            cardReference.set(card.reference);
            inputType.set(card.definition_streak > 0 ? "text" : "select");
            if (card.definition_streak === 0) {
                const options = [card];
                for (let i = 0; i < 3; i++) {
                    options.push(trainer.randomCard(options));
                }
                options.sort(() => Math.random() - 0.5);
                inputOptions.set(options);
            }
            setTimeout(() => {
                readyToRender.set(true);
            }, 50)
        }
    })

    function selectAnswer(card: Card) {
        inputSelectedOption.set($inputOptions.indexOf(card));
        update($roundSide === Side.Definition ? card.value : card.definition);
    }

    function submitAnswer() {
        update($inputValue);
    }

    function update(answer: string) {
        if (!$currentCard) {
            console.error("No current card to update");
            return;
        }

        updateProgress.set(true);

        updateResponse.set(trainer.updateCard($currentCard, $roundSide, answer, 0));
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
            if (temporaryTrainers[$set.set_uuid]) {
                saveProgress($set.set_uuid, trainer);
            } else {
                saveProgress($set.progress_uuid, trainer);
            }
            upperProgress1000.set(0);
            return;
        }

        if (trainer.learn_percentage === 100) {
            screen.set(Screen.End);
            initConfetti();
            render();
            return;
        }

        inputValue.set("");
        readyToRender.set(false);
        screen.set(Screen.Card);
    }

    screen.subscribe(() => {
        if ($screen === Screen.Card) {
            const response = trainer.nextCard as NextCardReturn;
            if (!response.error) {
                roundSide.set(response.side);
                currentCard.set(response.card);
            }
        }
    })

    function setMounted() {
        trainer.import($set.trainer);

        if (temporaryTrainers[$set.set_uuid]) {
            modalStore.trigger({
                type: "confirm",
                title: "You're not logged in!",
                body: "You're not logged in, so your progress will not be saved online. Do you want to learn anyway or would you like to log in?",
                buttonTextConfirm: "Log in",
                buttonTextCancel: "Learn anyway",
                response: (r) => {
                    if (r) {
                        goto("/login" + "?redirect=" + encodeURIComponent("/cards/train/" + $set.set_uuid));
                    }
                }
            })
        }

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

        const onKeyPress = (event: KeyboardEvent) => {
            if (!$page.route.id?.startsWith("/cards/train/")) {
                window.removeEventListener("keypress", onKeyPress);
                return;
            }
            if ($screen === Screen.Card_End || $screen === Screen.Round_End) {
                if (event.key === "Enter") $enterEnabled = false;
                nextCard();
            }
            if ($screen === Screen.Card && $inputType === "select") {
                if (event.key === "1" && $inputOptions.length > 0) selectAnswer($inputOptions[0]);
                if (event.key === "2" && $inputOptions.length > 1) selectAnswer($inputOptions[1]);
                if (event.key === "3" && $inputOptions.length > 2) selectAnswer($inputOptions[2]);
                if (event.key === "4" && $inputOptions.length > 3) selectAnswer($inputOptions[3]);
            }
            if (event.key === "Enter" && $screen === Screen.Card && $inputType === "text" && $enterEnabled) {
                $enterEnabled = false;
                submitAnswer();
            }
            if (event.key === "Escape") escape();
        }

        const onKeyUp = (event: KeyboardEvent) => {
            if (!$page.route.id?.startsWith("/cards/train/")) {
                window.removeEventListener("keyup", onKeyUp);
                return;
            }
            if (event.key === "Enter") $enterEnabled = true;
        }

        window.addEventListener("keydown", onKeyPress)
        window.addEventListener("keyup", onKeyUp)

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
            if ($loading) {
                const new_set = await getSet($page.params.uid, true)
                if (new_set.data) {
                    set.set(new_set.data)
                    loading.set(false)
                    setMounted();
                }
                if (new_set.error && new_set.error.code === "PGRST116") {
                    await goto("/cards")
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
                if (new_set.error && new_set.error.code === "PGRST116") {
                    await goto("/cards")
                }
            }
        })

        function updateProgressBar() {
            requestAnimationFrame(updateProgressBar)
            if (!$updateProgress) return;
            upperProgress.set((trainer.current_round_length - trainer.current_deck.length) / (trainer.current_round_length) );
            if ($upperProgress < 0 || !$upperProgress) upperProgress.set(0);
            const diff = ($upperProgress * 1000) - $upperProgress1000;
            upperProgress1000.set($upperProgress1000 + diff / 5);
            if (diff < 0.1 && diff > -0.1) updateProgress.set(false);
        }

        updateProgressBar();
    })

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
        if (trainer.unlearned_deck.length > 0) {
            screen.set(Screen.Start);
        } else {
            screen.set(Screen.End);
        }
    }

    function escape() {
        goto("/cards/" + $set.set_uuid);
    }

    function writeChar(char: string) {
        inputValue.set($inputValue + char);
        const input_element = document.getElementById("text-input-field") as HTMLInputElement;
        if (!input_element) return;
        setTimeout(() => {
            input_element.focus();
            input_element.selectionStart = input_element.selectionEnd = input_element.value.length;
        }, 50)
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
                     class="absolute top-16 duration-200"/>
        <div class="absolute top-16 left-0 m-5 md:ml-9 z-50">
            <button on:click={escape}
                    class="outline rounded-full p-1 outline-1 outline-gray-300 hover:bg-secondary-500 duration-200 hover:scale-110 hover:outline-none active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill-opacity="80%"
                          d="M5.72 5.72a.75.75 0 0 1 1.06 0L12 10.94l5.22-5.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L13.06 12l5.22 5.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L12 13.06l-5.22 5.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L10.94 12 5.72 6.78a.75.75 0 0 1 0-1.06Z"></path>
                </svg>
            </button>
        </div>
        <div class="absolute top-16 right-0 m-5 md:mr-9 z-50">
            <button on:click={() => goto("/cards/train/settings/" + $set.set_uuid)}
                    class="outline rounded-full p-1 outline-1 hover:rotate-90 duration-200 outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-1.5 0a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path>
                    <path d="M12 1c.266 0 .532.009.797.028.763.055 1.345.617 1.512 1.304l.352 1.45c.019.078.09.171.225.221.247.089.49.19.728.302.13.061.246.044.315.002l1.275-.776c.603-.368 1.411-.353 1.99.147.402.349.78.726 1.128 1.129.501.578.515 1.386.147 1.99l-.776 1.274c-.042.069-.058.185.002.315.112.238.213.481.303.728.048.135.142.205.22.225l1.45.352c.687.167 1.249.749 1.303 1.512.038.531.038 1.063 0 1.594-.054.763-.616 1.345-1.303 1.512l-1.45.352c-.078.019-.171.09-.221.225-.089.248-.19.491-.302.728-.061.13-.044.246-.002.315l.776 1.275c.368.603.353 1.411-.147 1.99-.349.402-.726.78-1.129 1.128-.578.501-1.386.515-1.99.147l-1.274-.776c-.069-.042-.185-.058-.314.002a8.606 8.606 0 0 1-.729.303c-.135.048-.205.142-.225.22l-.352 1.45c-.167.687-.749 1.249-1.512 1.303-.531.038-1.063.038-1.594 0-.763-.054-1.345-.616-1.512-1.303l-.352-1.45c-.019-.078-.09-.171-.225-.221a8.138 8.138 0 0 1-.728-.302c-.13-.061-.246-.044-.315-.002l-1.275.776c-.603.368-1.411.353-1.99-.147-.402-.349-.78-.726-1.128-1.129-.501-.578-.515-1.386-.147-1.99l.776-1.274c.042-.069.058-.185-.002-.314a8.606 8.606 0 0 1-.303-.729c-.048-.135-.142-.205-.22-.225l-1.45-.352c-.687-.167-1.249-.749-1.304-1.512a11.158 11.158 0 0 1 0-1.594c.055-.763.617-1.345 1.304-1.512l1.45-.352c.078-.019.171-.09.221-.225.089-.248.19-.491.302-.728.061-.13.044-.246.002-.315l-.776-1.275c-.368-.603-.353-1.411.147-1.99.349-.402.726-.78 1.129-1.128.578-.501 1.386-.515 1.99-.147l1.274.776c.069.042.185.058.315-.002.238-.112.481-.213.728-.303.135-.048.205-.142.225-.22l.352-1.45c.167-.687.749-1.249 1.512-1.304C11.466 1.01 11.732 1 12 1Zm-.69 1.525c-.055.004-.135.05-.161.161l-.353 1.45a1.832 1.832 0 0 1-1.172 1.277 7.147 7.147 0 0 0-.6.249 1.833 1.833 0 0 1-1.734-.074l-1.274-.776c-.098-.06-.186-.036-.228 0a9.774 9.774 0 0 0-.976.976c-.036.042-.06.131 0 .228l.776 1.274c.314.529.342 1.18.074 1.734a7.147 7.147 0 0 0-.249.6 1.831 1.831 0 0 1-1.278 1.173l-1.45.351c-.11.027-.156.107-.16.162a9.63 9.63 0 0 0 0 1.38c.004.055.05.135.161.161l1.45.353a1.832 1.832 0 0 1 1.277 1.172c.074.204.157.404.249.6.268.553.24 1.204-.074 1.733l-.776 1.275c-.06.098-.036.186 0 .228.301.348.628.675.976.976.042.036.131.06.228 0l1.274-.776a1.83 1.83 0 0 1 1.734-.075c.196.093.396.176.6.25a1.831 1.831 0 0 1 1.173 1.278l.351 1.45c.027.11.107.156.162.16a9.63 9.63 0 0 0 1.38 0c.055-.004.135-.05.161-.161l.353-1.45a1.834 1.834 0 0 1 1.172-1.278 6.82 6.82 0 0 0 .6-.248 1.831 1.831 0 0 1 1.733.074l1.275.776c.098.06.186.036.228 0 .348-.301.675-.628.976-.976.036-.042.06-.131 0-.228l-.776-1.275a1.834 1.834 0 0 1-.075-1.733c.093-.196.176-.396.25-.6a1.831 1.831 0 0 1 1.278-1.173l1.45-.351c.11-.027.156-.107.16-.162a9.63 9.63 0 0 0 0-1.38c-.004-.055-.05-.135-.161-.161l-1.45-.353c-.626-.152-1.08-.625-1.278-1.172a6.576 6.576 0 0 0-.248-.6 1.833 1.833 0 0 1 .074-1.734l.776-1.274c.06-.098.036-.186 0-.228a9.774 9.774 0 0 0-.976-.976c-.042-.036-.131-.06-.228 0l-1.275.776a1.831 1.831 0 0 1-1.733.074 6.88 6.88 0 0 0-.6-.249 1.835 1.835 0 0 1-1.173-1.278l-.351-1.45c-.027-.11-.107-.156-.162-.16a9.63 9.63 0 0 0-1.38 0Z"></path>
                </svg>
            </button>
        </div>
        <div class="w-full h-full">
            {#if $screen === Screen.Start}
                <div class="w-full h-full grid items-center">
                    <div class="w-full">
                        <p class="text-5xl text-center text-gray-800">{$set.trainer.learn_percentage <= 0 ? 'Ready to start learning?' : 'Let\'s continue!'}</p>
                        <div class="m-auto w-fit mt-5">
                            <button class="btn w-44 variant-filled-primary btn-3d-primary"
                                    on:click={() => setTimeout(() => $screen = Screen.Card, 200)}>START
                            </button>
                        </div>
                    </div>
                </div>
            {:else if $screen === Screen.Card && $readyToRender}
                <div class="w-full h-full grid items-center relative">
                    <div class="m-auto w-full max-w-2xl h-full max-h-96 md:shadow-stance p-10 rounded-md">
                        <div class="flex items-center">
                            <p class="text-2xl">{$cardTitle}</p>
                            <button class="ml-3" on:click={() => trainer.playAudio($cardTitle)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                    <path d="M11.553 3.064A.75.75 0 0 1 12 3.75v16.5a.75.75 0 0 1-1.255.555L5.46 16H2.75A1.75 1.75 0 0 1 1 14.25v-4.5C1 8.784 1.784 8 2.75 8h2.71l5.285-4.805a.752.752 0 0 1 .808-.13ZM10.5 5.445l-4.245 3.86a.748.748 0 0 1-.505.195h-3a.25.25 0 0 0-.25.25v4.5c0 .138.112.25.25.25h3c.187 0 .367.069.505.195l4.245 3.86Zm8.218-1.223a.75.75 0 0 1 1.06 0c4.296 4.296 4.296 11.26 0 15.556a.75.75 0 0 1-1.06-1.06 9.5 9.5 0 0 0 0-13.436.75.75 0 0 1 0-1.06Z"></path>
                                    <path d="M16.243 7.757a.75.75 0 1 0-1.061 1.061 4.5 4.5 0 0 1 0 6.364.75.75 0 0 0 1.06 1.06 6 6 0 0 0 0-8.485Z"></path>
                                </svg>
                            </button>
                        </div>

                        <div class="relative h-full">
                            {#if $inputType === 'select'}
                                <div class="w-full absolute bottom-0 mb-7">
                                    <p class="mb-3">Choose the right answer</p>
                                    <div class="w-full grid grid-cols-2">
                                        {#each $inputOptions as option, index}
                                            <div class="w-full h-full p-2">
                                                <button class="w-full h-full btn variant-ghost hover:variant-filled-primary hover:shadow-2xl duration-200 p-4"
                                                        on:click={() => selectAnswer(option)}
                                                >
                                                    {index + 1}.
                                                    <br>
                                                    <span class="text-start w-full truncate ...">{$roundSide === Side.Definition ? option.value : option.definition}</span>
                                                </button>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {:else}
                                <div class="w-full absolute bottom-0 mb-7">
                                    <form>
                                        <div class="flex flex-row items-center">
                                            {#each $set.trainer.getSpecialChars() as char}
                                                <button class="btn variant-ghost-secondary btn-sm mr-2 mb-2"
                                                        on:click={() => {writeChar(char)}}>
                                                    {char}
                                                </button>
                                            {/each}
                                        </div>
                                        <input id="text-input-field" type="text" class="input" placeholder="Your Answer"
                                               bind:value={$inputValue}>
                                        <div class="w-full flex justify-end">
                                            <button class="btn variant-filled-primary mt-2" on:click={submitAnswer}>
                                                Submit
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {:else if $screen === Screen.Card_End}
                <div class="w-full h-full grid items-center">
                    <div class="m-auto w-full max-w-2xl h-full max-h-96">
                        <div class="w-full h-full md:shadow-stance p-10 rounded-md">

                            {#if !$updateResponse.error}
                                <div class="flex items-center">
                                    <p class="text-2xl">{$cardTitle}</p>
                                    <button class="ml-3" on:click={() => trainer.playAudio($cardTitle)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                            <path d="M11.553 3.064A.75.75 0 0 1 12 3.75v16.5a.75.75 0 0 1-1.255.555L5.46 16H2.75A1.75 1.75 0 0 1 1 14.25v-4.5C1 8.784 1.784 8 2.75 8h2.71l5.285-4.805a.752.752 0 0 1 .808-.13ZM10.5 5.445l-4.245 3.86a.748.748 0 0 1-.505.195h-3a.25.25 0 0 0-.25.25v4.5c0 .138.112.25.25.25h3c.187 0 .367.069.505.195l4.245 3.86Zm8.218-1.223a.75.75 0 0 1 1.06 0c4.296 4.296 4.296 11.26 0 15.556a.75.75 0 0 1-1.06-1.06 9.5 9.5 0 0 0 0-13.436.75.75 0 0 1 0-1.06Z"></path>
                                            <path d="M16.243 7.757a.75.75 0 1 0-1.061 1.061 4.5 4.5 0 0 1 0 6.364.75.75 0 0 0 1.06 1.06 6 6 0 0 0 0-8.485Z"></path>
                                        </svg>
                                    </button>
                                </div>

                                <div class="relative h-full">
                                    {#if $inputType === 'select'}
                                        <div class="w-full absolute bottom-0 mb-7">
                                            {#if $updateResponse.correct}
                                                <p class="mb-3 text-success-500">Well done!</p>
                                            {:else}
                                                <p class="mb-3 text-error-500">Maybe next time...</p>
                                            {/if}
                                            <p class="mb-3"></p>
                                            <div class="w-full grid grid-cols-2">
                                                {#each $inputOptions as option, index}
                                                    {#if $inputSelectedOption === index && $updateResponse.correct}
                                                        <div class="w-full h-full p-2">
                                                            <div class="w-full h-full btn bg-success-600 duration-200 p-4">
                                                                {index + 1}.
                                                                <br>
                                                                <span class="text-start w-full truncate ...">{$roundSide === Side.Definition ? option.value : option.definition}</span>
                                                            </div>
                                                        </div>
                                                    {:else if $inputSelectedOption === index && !$updateResponse.correct}
                                                        <div class="w-full h-full p-2">
                                                            <div class="w-full h-full btn bg-error-300 duration-200 p-4">
                                                                {index + 1}.
                                                                <br>
                                                                <span class="text-start w-full truncate ...">{$roundSide === Side.Definition ? option.value : option.definition}</span>
                                                            </div>
                                                        </div>
                                                    {:else if ($roundSide === Side.Value && option.value === $updateResponse.correct_answer) || ($roundSide === Side.Definition && option.definition === $updateResponse.correct_answer)}
                                                        <div class="w-full h-full p-2">
                                                            <div class="w-full h-full btn bg-success-600 duration-200 p-4">
                                                                {index + 1}.
                                                                <br>
                                                                <span class="text-start w-full truncate ...">{$roundSide === Side.Definition ? option.value : option.definition}</span>
                                                            </div>
                                                        </div>
                                                    {:else}
                                                        <div class="w-full h-full p-2">
                                                            <div class="w-full h-full btn bg-gray-100 duration-200 p-4">
                                                                {index + 1}.
                                                                <br>
                                                                <span class="text-start w-full truncate ...">{$roundSide === Side.Definition ? option.value : option.definition}</span>
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
                                                    {$inputValue}
                                                </div>
                                            {:else}
                                                <p class="mb-3 text-gray-800">Maybe next time...</p>
                                                <div class="w-full outline-red-500 outline-1 outline rounded-md bg-error-200 p-5 text-gray-700">
                                                    {$inputValue || "Skipped"}
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
                    </div>

                    {#if !$updateResponse.error && !$updateResponse.correct}
                        <div class="absolute bottom-0 h-20 w-full bg-gray-100 p-5 flex justify-center">
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
                        <p class="mt-8 mb-2">What you already have <span class="text-success-500">learned</span> or  <span class="text-warning-500">seen</span>:</p>
                        <div class="h-full max-h-52 w-full overflow-y-auto rounded-md p-2 shadow-inner bg-surface-200">
                            {#each trainer.learning_deck as card}
                                <div class="w-full p-1">
                                    <div class="outline outline-1 w-full p-2 rounded-md outline-warning-600 bg-warning-100">
                                        <div class="w-full flex">
                                            <p class="w-[40%]">{card.value}</p>
                                            <p class="w-[40%]">{card.definition}</p>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                            {#each trainer.learned_deck as card}
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

                    <div class="absolute bottom-0 h-fit w-full bg-gray-100 p-5 flex justify-center">
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
                                <button class="btn variant-filled-primary btn-3d-primary mr-1" on:click={restart}>
                                    Restart Learning
                                </button>
                                <button class="btn variant-filled-secondary btn-3d-secondary ml-1" on:click={escape}>
                                    Exit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}