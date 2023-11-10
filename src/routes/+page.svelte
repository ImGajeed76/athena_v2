<script lang="ts">
    import {onMount} from "svelte";

    onMount(() => {
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