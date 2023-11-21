<script lang="ts">
    import {onMount} from "svelte";
    import {permissions_loaded, permissions, updatePermission} from "$lib/permissions";
    import {loggedIn} from "$lib/database";
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
        allow_card_saving_open = true;

        modalStore.trigger({
            type: "confirm",
            title: "Allow cards to be saved.",
            body: "Are we allowed to save your cards for making suggestions for other user? This data will be collected anonymous.",
            buttonTextConfirm: "Allow",
            buttonTextCancel: "Deny",
            response: (r) => {
                updatePermission("allow_card_saving", r);
            }
        })
    }
</script>

<slot/>