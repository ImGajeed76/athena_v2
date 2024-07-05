<script lang="ts">
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { AthenaPageRenderer } from '$lib/athena-pages';
	import hljs from 'highlight.js/lib/core';
	import xml from 'highlight.js/lib/languages/xml'; // for HTML
	import css from 'highlight.js/lib/languages/css';
	import json from 'highlight.js/lib/languages/json';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import shell from 'highlight.js/lib/languages/shell';
	import plaintext from 'highlight.js/lib/languages/plaintext';
	import java from 'highlight.js/lib/languages/java';
	import kotlin from 'highlight.js/lib/languages/kotlin';
	import python from 'highlight.js/lib/languages/python';
	import php from 'highlight.js/lib/languages/php';
	import sql from 'highlight.js/lib/languages/sql';
	import yaml from 'highlight.js/lib/languages/yaml';
	import swift from 'highlight.js/lib/languages/swift';
	import rust from 'highlight.js/lib/languages/rust';
	import ruby from 'highlight.js/lib/languages/ruby';
	import go from 'highlight.js/lib/languages/go';
	import dart from 'highlight.js/lib/languages/dart';
	import csharp from 'highlight.js/lib/languages/csharp';
	import cpp from 'highlight.js/lib/languages/cpp';
	import c from 'highlight.js/lib/languages/c';
	import bash from 'highlight.js/lib/languages/bash';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';


	export let content = writable<string>(null);
	const container = writable<HTMLDivElement>();
	const renderer = writable<AthenaPageRenderer | null>(null);

	function onContentChange(new_content: string) {
		console.log("Content changed");
		content.set(new_content);
	}

	container.subscribe((value) => {
		if (value && !$renderer) {
			renderer.set(new AthenaPageRenderer(value, content, onContentChange));
		}
	});

	onMount(() => {
		setTimeout(() => {
			if ($renderer && $container) {
				$renderer.renderIntervalTime = 100;
				$renderer.requestRender();
			}
		}, 100);
	});

	content.subscribe(() => {
		if ($renderer) {
			$renderer.requestRender();
		}
	});

	onMount(() => {
		hljs.registerLanguage('javascript', javascript);
		hljs.registerLanguage('js', javascript);
		hljs.registerLanguage('typescript', typescript);
		hljs.registerLanguage('ts', typescript);
		hljs.registerLanguage('xml', xml);
		hljs.registerLanguage('html', xml);
		hljs.registerLanguage('css', css);
		hljs.registerLanguage('json', json);
		hljs.registerLanguage('shell', shell);
		hljs.registerLanguage('plaintext', plaintext);
		hljs.registerLanguage('text', plaintext);
		hljs.registerLanguage('java', java);
		hljs.registerLanguage('kotlin', kotlin);
		hljs.registerLanguage('python', python);
		hljs.registerLanguage('php', php);
		hljs.registerLanguage('sql', sql);
		hljs.registerLanguage('yaml', yaml);
		hljs.registerLanguage('swift', swift);
		hljs.registerLanguage('rust', rust);
		hljs.registerLanguage('ruby', ruby);
		hljs.registerLanguage('go', go);
		hljs.registerLanguage('dart', dart);
		hljs.registerLanguage('csharp', csharp);
		hljs.registerLanguage('cpp', cpp);
		hljs.registerLanguage('c', c);
		hljs.registerLanguage('bash', bash);

		storeHighlightJs.set(hljs);
	})
</script>

<div class="sr-only">
	<h1 class="text-6xl">h1</h1>
	<h2 class="text-5xl">h2</h2>
	<h3 class="text-4xl">h3</h3>
	<h4 class="text-3xl">h4</h4>
	<h5 class="text-2xl">h5</h5>
	<h6 class="text-xl">h6</h6>
	<span class="font-bold italic underline bg-gray-200 px-1">paragraphs 1</span>
	<span class="line-through">paragraphs 2</span>
</div>

<div bind:this={$container}>
</div>