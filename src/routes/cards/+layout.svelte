<script lang="ts">
    import {onMount} from "svelte";
    import {permissions, permissions_loaded, updatePermission} from "$lib/permissions";
    import {getModalStore} from "@skeletonlabs/skeleton";

    const modalStore = getModalStore()

    let allow_card_saving_open = false;

    onMount(() => {
        permissions_loaded.subscribe((value) => {
            if (value && !allow_card_saving_open) {
                if ($permissions.show_allow_card_saving) triggerAllowCardSaving();
            }
        })

        if ($permissions_loaded && !allow_card_saving_open) {
            if ($permissions.show_allow_card_saving) triggerAllowCardSaving();
        }
    })

    function triggerAllowCardSaving() {
        setTimeout(() => {
            if (allow_card_saving_open) return;
            allow_card_saving_open = true;

            modalStore.trigger({
                type: "confirm",
                title: "Enhance Your Card Creation! ✨",
                body: "<p class=''>\n" +
                    "        Are we allowed to store your card data <span class=\"italic\">(anonymously)</span> to offer you <span class=\"font-medium\">smarter suggestions</span> for future cards? This helps in creating better cards <span class=\"font-medium\">faster and easier</span>, while fully respecting your privacy.\n" +
                    "    </p>",
                buttonTextConfirm: "Allow",
                buttonTextCancel: "Deny",
                response: (r) => {
                    updatePermission("allow_card_saving", r);
                }
            })
        }, 1000)
    }
</script>

<slot/>