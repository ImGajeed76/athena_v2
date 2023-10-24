<script lang="ts">
    import type {NextCardReturn, UpdateCardReturn} from "$lib/cards";
    import {Card, importCards, Side, Trainer} from "$lib/cards";
    import {writable} from "svelte/store";
    import {onMount} from "svelte";
    import {page} from "$app/stores";

    enum Screen {
        Start,
        Card,
        Card_End,
        Round_End,
        End
    }

    let mounted = false;

    const trainingSet = importCards("dans,in\n" +
        "avec,mit\n" +
        "la cuisine,die Küche\n" +
        "ecoutez,hört\n" +
        "nous,wir\n" +
        "vous,ihr\n" +
        "combien,wie viel\n" +
        "comment,wie\n" +
        "qui,wer\n" +
        "quoi,was\n" +
        "où,wo\n" +
        "pourquoi,warum\n" +
        "il ya,es gibt\n" +
        "c'est,das ist\n" +
        "ce sont,das sind\n" +
        "qu'est-ce que,was ...\n" +
        "Qu'est-ce qu'il y a ...,Was hat es ...\n" +
        "est,ist\n" +
        "quelqu'un,jemand\n" +
        "se moquer,sich lustig machen\n" +
        "remis,übergeben\n" +
        "la veille de,am Tag vor\n" +
        "ordinaire,gewöhnlich\n" +
        "puis,dann\n" +
        "pour,für\n" +
        "sortir,ausgehen\n" +
        "tant pis,Da kann man nichts machen!; Schade!\n" +
        "je dois,ich muss\n" +
        "souvent,oft\n" +
        "le plus diificile,das schwierigste\n" +
        "du moins,zumindest\n" +
        "Qui est-ce?,Wer ist das?\n" +
        "jamais,niemals\n" +
        "tout d'un coup,plötzlich");

    const trainer = new Trainer(trainingSet);

    const screen = writable<Screen>(1);

    const currentCard = writable<Card>();

    const card_title = writable<string>("");
    const card_example = writable<string | null>("");
    const card_reference = writable<string | null>("");
    const input_type = writable<"text" | "select">("text");
    const input_value = writable<string>("");
    const input_options = writable<Card[]>([]);
    const input_selected_option = writable<number>(0);

    const updateResponse = writable<UpdateCardReturn>();

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
        if (!card) return;

        if (trainer.round_side === Side.Value) {
            card_title.set(card.definition);
            card_example.set(card.definition_example);
            card_reference.set(card.reference);
            input_type.set(card.value_streak > 0 ? "text" : "select");
            if (card.value_streak === 0) {
                const options = [card];
                for (let i = 0; i < 3; i++) {
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
        updateResponse.set(trainer.updateCard($currentCard, trainer.round_side, trainer.round_side === Side.Value ? card.value : card.definition, 0));
        screen.set(Screen.Card_End);
        if (!$updateResponse.error && $updateResponse.correct) {
            setTimeout(() => {
                screen.set(Screen.Card);
            }, 1000)
        }
    }

    function submitAnswer() {
        updateResponse.set(trainer.updateCard($currentCard, trainer.round_side, $input_value, 0));
        screen.set(Screen.Card_End);
        if (!$updateResponse.error && $updateResponse.correct) {
            setTimeout(() => {
                nextCard();
            }, 1000)
        }
    }

    function nextCard() {
        if (trainer.learn_percentage === 100) {
            screen.set(Screen.End);
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

    onMount(() => {
        mounted = true;
        window.addEventListener("keypress", (event) => {
            if (!$page.route.id?.startsWith("/cards/train/")) return;
            if ($screen === Screen.Card_End) nextCard();
            if ($screen === Screen.Card && $input_type === "select") {
                if (event.key === "1") selectAnswer($input_options[0]);
                if (event.key === "2") selectAnswer($input_options[1]);
                if (event.key === "3") selectAnswer($input_options[2]);
                if (event.key === "4") selectAnswer($input_options[3]);
            }
        })
    })
</script>

<div class="fixed w-screen h-screen">
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
                                                <div class="w-full h-full btn bg-success-500 duration-200 p-4">
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
                                                <div class="w-full h-full btn bg-success-500 duration-200 p-4">
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
        <h1>Round</h1>
        <button on:click={() => $screen = Screen.End}>Next</button>
    {:else if $screen === Screen.End}
        <h1>End</h1>
        <button on:click={() => $screen = Screen.Start}>Next</button>
    {/if}
</div>