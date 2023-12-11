<script lang="ts">
    import {onMount} from "svelte";
    import ArrowDown from "../modules/other/ArrowDown.svelte";
    import {writable} from "svelte/store";
    import {fly} from 'svelte/transition';
    import {loggedIn} from "$lib/database";

    onMount(() => {
        const easterEggPath = window.location.origin + "/ee/Hy48Tz"

        const easterEggMessage = "" +
            "███████╗ ██████╗  ██████╗     ███╗   ██╗ ██╗   \n" +
            "██╔════╝██╔════╝ ██╔════╝     ████╗  ██║███║   \n" +
            "█████╗  ██║  ███╗██║  ███╗    ██╔██╗ ██║╚██║   \n" +
            "██╔══╝  ██║   ██║██║   ██║    ██║╚██╗██║ ██║   \n" +
            "███████╗╚██████╔╝╚██████╔╝    ██║ ╚████║ ██║██╗\n" +
            "╚══════╝ ╚═════╝  ╚═════╝     ╚═╝  ╚═══╝ ╚═╝╚═╝\n" +
            "🎉 Congratulation, you found an easter egg! 🎉\n"

        const eemLength = easterEggMessage.split("\n")[0].length;
        const finalMessage = easterEggMessage + " ".repeat((eemLength - easterEggPath.length) / 2) + easterEggPath

        console.log(finalMessage)
    })

    const athenaArgument = writable(0);
    const maxAthenaArgument = 4;

    function nextArgument() {
        if ($athenaArgument === maxAthenaArgument) {
            $athenaArgument = 0;
        } else {
            $athenaArgument += 1;
        }
    }

    function previousArgument() {
        if ($athenaArgument === 0) {
            $athenaArgument = maxAthenaArgument;
        } else {
            $athenaArgument -= 1;
        }
    }
</script>

<div class="w-screen">
    <div class="w-full max-w-6xl m-auto px-10 xl:px-0">
        <div class="grid grid-rows-[1fr_auto] items-center w-full h-screen">
            <div class="grid lg:grid-cols-2 grid-cols-1 items-center h-full">
                <div class="mt-10">
                    <h1 class="lg:text-6xl text-5xl font-bold" style="letter-spacing: -1px; line-height: 1.2">Welcome to
                        <br> Athena Learning</h1>
                    <p class="text-xl mt-6">Dive into our world of free, interactive tools designed to make learning
                        accessible and engaging for everyone.</p>
                    {#if $loggedIn}
                        <a href="/home" class="btn variant-filled-primary mt-10 btn-3d-primary">Start exploring</a>
                    {:else}
                        <a href="/signup" class="btn variant-filled-primary mt-10 btn-3d-primary">Create an account</a>
                    {/if}
                </div>
            </div>

            <div class="mb-5">
                <ArrowDown/>
            </div>
        </div>
    </div>

    <div class="w-full bg-primary-500">
        <div class="w-full max-w-6xl m-auto h-screen grid items-center px-10 xl:px-0 lg:grid-cols-2 grid-cols-1">
            <div class="h-fit lg:h-0 visible lg:hidden">
                <h1 class="text-5xl lg:text-6xl font-bold text-white" style="letter-spacing: -1px; line-height: 1.2">Why
                    Athena?</h1>
            </div>
            <div class="lg:mr-32 lg:h-[26rem] h-[28rem] grid items-center text-white">
                <div class="lg:p-5 h-full w-full flex flex-col justify-between">
                    {#if $athenaArgument === 0}
                        <div in:fly={{ duration: 300 }}>
                            <h3 class="text-4xl mb-4">Free and Open</h3>
                            <p class="text-xl">
                                <span class="font-bold">Accessibility for All:</span>
                                We believe education is
                                a right, not a privilege. That's why Athena is completely free, ensuring everyone has
                                access
                                to quality learning resources.
                            </p>
                        </div>
                    {:else if $athenaArgument === 1}
                        <div in:fly={{ duration: 300 }}>
                            <h3 class="text-4xl mb-4">Innovative Tools</h3>
                            <p class="text-xl">
                                <span class="font-bold">Interactive Learning:</span>
                                With features like quiz modes, interactive slides, and collaborative classes, Athena
                                makes learning engaging and effective.
                            </p>
                        </div>
                    {:else if $athenaArgument === 2}
                        <div in:fly={{ duration: 300 }}>
                            <h3 class="text-4xl mb-4">User-Friendly Design</h3>
                            <p class="text-xl">
                                <span class="font-bold">Intuitive Interface:</span>
                                Athena's clean and simple design ensures a seamless user experience, making learning and
                                teaching straightforward and enjoyable.
                            </p>
                            <p class="text-xl mt-3">
                                <span class="font-bold">Community Driven:</span>
                                Built with feedback from educators and learners, Athena is continuously evolving to meet
                                the real needs of its users.
                            </p>
                        </div>
                    {:else if $athenaArgument === 3}
                        <div in:fly={{ duration: 300 }}>
                            <h3 class="text-4xl mb-4">Universal Application</h3>
                            <p class="text-xl">
                                <span class="font-bold">For Learners and Educators:</span>
                                Whether you're a student seeking knowledge or a teacher shaping minds, Athena is your
                                companion in the journey of education.
                            </p>
                        </div>
                    {:else if $athenaArgument === 4}
                        <div in:fly={{ duration: 300 }}>
                            <h3 class="text-4xl mb-4">Committed to Growth</h3>
                            <p class="text-xl">
                                <span class="font-bold">Regular Updates:</span>
                                We're constantly improving and expanding Athena's capabilities, staying ahead in the
                                ever-changing landscape of educational technology.
                            </p>
                            <p class="text-xl mt-3">
                                <span class="font-bold">Your Voice Matters:</span>
                                We listen to our users, making sure Athena grows in ways that truly matter to you.
                            </p>
                        </div>
                    {/if}
                    <div class="w-full flex-row flex justify-between mt-5 items-center">
                        <button class="btn rounded-full hover:variant-ghost w-10 h-10 p-2 duration-200"
                                on:click={previousArgument}>
                            <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24"
                                 height="24" fill="#fff">
                                <path d="M15.28 5.22a.75.75 0 0 1 0 1.06L9.56 12l5.72 5.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-6.25-6.25a.75.75 0 0 1 0-1.06l6.25-6.25a.75.75 0 0 1 1.06 0Z"></path>
                            </svg>
                        </button>
                        <div>
                            <p>{$athenaArgument + 1} / {maxAthenaArgument + 1}</p>
                        </div>
                        <button class="btn rounded-full hover:variant-ghost w-10 h-10 p-2 duration-200"
                                on:click={nextArgument}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
                                 fill="#fff">
                                <path d="M8.72 18.78a.75.75 0 0 1 0-1.06L14.44 12 8.72 6.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018l6.25 6.25a.75.75 0 0 1 0 1.06l-6.25 6.25a.75.75 0 0 1-1.06 0Z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div class="h-0 lg:h-fit invisible lg:visible">
                <h1 class="text-5xl lg:text-6xl font-bold text-white" style="letter-spacing: -1px; line-height: 1.2">Why
                    Athena?</h1>
            </div>
        </div>
    </div>

    <div class="w-full">
        <div class="w-full max-w-6xl m-auto h-screen grid items-center px-10 xl:px-0 lg:grid-cols-2 grid-cols-1">
            <div>
                <h1 class="text-6xl font-bold" style="letter-spacing: -1px; line-height: 4.5rem">
                    Join <br>
                    Support <br>
                    Contribute
                </h1>
            </div>
            <div class="w-full flex justify-center">
                <div class="flex flex-col justify-around">
                    <a href="https://discord.gg/EnHvQYtsUz" target="_blank"
                       class="w-80 h-20 hover:scale-105 duration-200 bg-[#5865F2] p-4 rounded-md mb-5">
                        <img alt="discord_logo" class="w-full h-[90%] object-contain" src="/discord-logo-white.svg"/>
                    </a>
                    <a href="https://ko-fi.com/athena_learning" target="_blank"
                       class="w-80 h-20 hover:scale-105 duration-200 bg-[#434b57] p-4 rounded-md mb-5">
                        <img alt="discord_logo" class="w-full h-[90%] object-contain" src="/kofi-logo.png"/>
                    </a>
                    <a href="https://github.com/ImGajeed76/athena_v2" target="_blank"
                       class="w-80 h-20 hover:scale-105 duration-200 bg-[#171515] p-4 rounded-md">
                        <img alt="discord_logo" class="w-full h-[90%] object-contain" src="/GitHub_Logo_White.png"/>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
