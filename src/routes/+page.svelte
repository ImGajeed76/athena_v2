<script lang="ts">
    import {onMount} from "svelte";

    onMount(() => {
        const easterEggMessage1 = "🐰🥚🐰🥚🐰🥚🐰🥚🐰🥚🐰🥚\n" +
            "🥚 \t\t\t\t\t\t\t🐰\n" +
            "🐰   If you are searching\t🥚\n" +
            "🥚   for easter eggs, you \t🐰\n" +
            "🐰   made it! Congrats 🥳\t🥚\n" +
            "🥚\t\t\t\t\t\t\t🐰\n" +
            "🐰   ---> /ee/Hy48Tz <---  \t🥚\n" +
            "🥚\t\t\t\t\t\t\t🐰\n" +
            "🐰🥚🐰🥚🐰🥚🐰🥚🐰🥚🐰🥚"

        const easterEggPath = window.location.origin + "/ee/Hy48Tz"

        const easterEggMessage2 = "" +
            "███████╗ ██████╗  ██████╗     ███╗   ██╗ ██╗   \n" +
            "██╔════╝██╔════╝ ██╔════╝     ████╗  ██║███║   \n" +
            "█████╗  ██║  ███╗██║  ███╗    ██╔██╗ ██║╚██║   \n" +
            "██╔══╝  ██║   ██║██║   ██║    ██║╚██╗██║ ██║   \n" +
            "███████╗╚██████╔╝╚██████╔╝    ██║ ╚████║ ██║██╗\n" +
            "╚══════╝ ╚═════╝  ╚═════╝     ╚═╝  ╚═══╝ ╚═╝╚═╝\n" +
            "🎉 Congratulation, you found an easter egg! 🎉\n"

        const eemLength = easterEggMessage2.split("\n")[0].length;
        const finalMessage = easterEggMessage2 + " ".repeat((eemLength - easterEggPath.length) / 2) + easterEggPath

        console.log(finalMessage)
    })
</script>