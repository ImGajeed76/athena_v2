import {CodeBlock, storeHighlightJs} from '@skeletonlabs/skeleton';
import {get, writable, type Writable} from 'svelte/store';
import {mathjax} from 'mathjax-full/js/mathjax';
import {TeX} from 'mathjax-full/js/input/tex';
import {SVG} from 'mathjax-full/js/output/svg';
import {AllPackages} from 'mathjax-full/js/input/tex/AllPackages';
import {liteAdaptor} from 'mathjax-full/js/adaptors/liteAdaptor';
import {RegisterHTMLHandler} from 'mathjax-full/js/handlers/html';
import {shortUUID} from '$lib/helpers';
import createDOMPurify from 'dompurify';

async function filterHtmlInjection(text: string, allow_in_code_section: boolean = false): Promise<string> {
    try {
        const sections: string[] = [];
        const placeholders: string[] = [];

        if (allow_in_code_section) {
            text = text.replace(/`([^`]+)`/g, (match) => {
                sections.push(match);
                const uuid: string = shortUUID();
                placeholders.push(uuid);
                return uuid;
            });
        }

        const DOMPurify = createDOMPurify(window);
        const parsedHtml = new window.DOMParser().parseFromString(text, 'text/html').body.innerHTML;
        let filtered = DOMPurify.sanitize(parsedHtml, {
            ALLOWED_TAGS: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', // Headers
                'blockquote', 'p', // Paragraphs
                'a', // links
                'ul', 'ol', 'li', // Lists
                'code', 'pre', // Code blocks
                'em', 'strong', // Emphasis
                'hr' // Horizontal rule
            ],
            ALLOWED_ATTR: ['href', 'class']
        });

        if (allow_in_code_section) {
            for (const placeholder of placeholders) {
                const index = placeholders.indexOf(placeholder);
                const code = sections[index];

                filtered = filtered.replace(placeholder, code);
            }
        }

        return filtered;
    } catch (e) {
        return 'ERROR: ' + e;
    }
}

export enum ChangeCallbackType {
    CONTENT_CHANGE,
    CHECKBOX_CHANGE
}

export type OnChangeCallback = (
    content: string,
    meta: {
        type: ChangeCallbackType.CONTENT_CHANGE
    } | {
        type: ChangeCallbackType.CHECKBOX_CHANGE,
        line: number,
        checked: boolean
    }
) => void;

export class AthenaPageRenderer {

    private content: Writable<string> = writable('');
    private on_content_change: OnChangeCallback = () => {
    };
    private lastContent: string = '';

    // render
    private container: HTMLDivElement;
    private renderInterval: number = 1000;
    private rerender: boolean = false;
    private disableRender: boolean = false;
    private interval: NodeJS.Timeout | null = null;

    // code block
    private startBlockLine: number = -1;
    private inCodeBlock = false;
    private codeBlockLanguage = '';
    private codeBlockContent = '';

    // math block
    private startMathLine: number = -1;
    private inMathBlock = false;
    private mathBlockContent = '';
    private mathCache: { [key: string]: string } = {};

    // lists
    private startListLine: number = -1;
    private inList = false;
    private listStructure: HTMLUListElement | null = null;
    private indentationHistory: HTMLUListElement[] = [];
    private lastIndentation = 0;

    // links
    private links: string[] = [];

    // tables
    private startTableLine: number = -1;
    private inTable = false;
    private tableStructure: HTMLDivElement | null = null;
    private columnCount = 0;

    // line cache
    private lineCache: { [key: string]: HTMLElement } = {};

    constructor(container: HTMLDivElement, content: Writable<string>, on_content_change: OnChangeCallback = () => {
    }) {
        this.container = container;
        this.content = content;
        this.on_content_change = on_content_change;
        this.updateInterval();
    }

    private updateInterval() {
        if (this.interval !== null) {
            clearInterval(this.interval);
        }

        this.interval = setInterval(async () => {
            if (this.rerender && !this.disableRender) {
                await this.renderContent(get(this.content), this.on_content_change);
                this.rerender = false;
            }
        }, this.renderInterval);
    }

    set onContentChange(callback: OnChangeCallback) {
        this.on_content_change = callback;
    }

    set disableRenderInterval(disable: boolean) {
        this.disableRender = disable;
    }

    set renderIntervalTime(time: number) {
        this.renderInterval = time;
        this.updateInterval();
    }

    requestRender() {
        this.rerender = true;
    }

    private async renderContent(content: string, on_content_change: OnChangeCallback = () => {
    }): Promise<void> {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        this.startBlockLine = -1;
        this.inCodeBlock = false;
        this.codeBlockLanguage = '';
        this.codeBlockContent = '';

        this.startMathLine = -1;
        this.inMathBlock = false;
        this.mathBlockContent = '';

        this.startListLine = -1;
        this.inList = false;
        this.listStructure = null;
        this.indentationHistory = [];
        this.lastIndentation = 0;

        this.startTableLine = -1;
        this.inTable = false;
        this.tableStructure = null;

        this.links = [];

        if (!content.endsWith('\n')) {
            content += '\n';
        }

        const lastLines = this.lastContent.split('\n');
        const usedCache: string[] = [];

        const lines = content.split('\n');
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            let line = lines[lineIndex];
            if (line === '') {
                if (content.split('\n')[lineIndex - 1] === '') {
                    this.container.appendChild(document.createElement('br'));
                }

                if (this.inList) {
                    this.inList = false;

                    if (this.listStructure !== null) {
                        const copy = (this.listStructure as HTMLElement).cloneNode(true);
                        this.lineCache[`${this.startListLine}-${lineIndex}`] = copy as HTMLElement;
                        this.container.appendChild(copy);
                        this.listStructure = null;
                        this.indentationHistory = [];
                        this.lastIndentation = 0;
                    }
                }

                if (this.inTable) {
                    this.inTable = false;

                    if (this.tableStructure !== null) {
                        const copy = (this.tableStructure as HTMLElement).cloneNode(true);
                        this.lineCache[`${this.startTableLine}-${lineIndex}`] = copy as HTMLElement;
                        this.container.appendChild(copy);
                        this.tableStructure = null;
                    }
                }

                continue;
            }

            // search future lines until the next changed line
            let shiftDirection = 0;
            let continueLoop = false;
            for (let i = lineIndex + 1; i < lines.length; i++) {
                // if the last line is the same as the current line, take the cached line. if its shifted by one, take the cached line. if its shifted by more than one, render the line
                if (
                    lines[i] === lastLines[i] ||
                    (lines[i] === lastLines[i + 1] && (shiftDirection === 0 || shiftDirection === -1)) ||
                    (lines[i] === lastLines[i - 1] && (shiftDirection === 0 || shiftDirection === 1))
                ) {
                    if (shiftDirection === 0) {
                        if (lines[i] === lastLines[i]) {
                            shiftDirection = 0;
                        }
                        if (lines[i] === lastLines[i + 1]) {
                            shiftDirection = -1;
                        }
                        if (lines[i] === lastLines[i - 1]) {
                            shiftDirection = 1;
                        }
                    }

                    if (this.lineCache[`${lineIndex - shiftDirection}-${i - shiftDirection}`]) {
                        this.container.appendChild(this.lineCache[`${lineIndex - shiftDirection}-${i - shiftDirection}`]);
                        this.lineCache[`${lineIndex}-${i}`] = this.lineCache[`${lineIndex - shiftDirection}-${i - shiftDirection}`];
                        delete this.lineCache[`${lineIndex - shiftDirection}-${i - shiftDirection}`];
                        usedCache.push(`${lineIndex}-${i}`);
                        continueLoop = true;
                        console.log('used cache', `${lineIndex}-${i}`)
                        lineIndex = i;
                        continueLoop = true;
                        break;
                    }
                } else {
                    // delete the cached line if it's not the same as the current line including the shift
                    if (this.lineCache[`${lineIndex}-${i}`]) {
                        delete this.lineCache[`${lineIndex}-${i}`];
                    }
                    break;
                }
            }

            if (continueLoop) continue;

            // render blocks
            if (await this.renderList(line, lineIndex)) continue;
            line = line.trim();
            if (this.renderCodeBlock(line, lineIndex)) continue;
            if (await this.renderMathBlock(line, lineIndex)) continue;
            if (await this.renderTable(line, lines[lineIndex + 1], lineIndex)) continue;

            // links
            if (this.renderLink(line)) continue;

            // render lines

            if (
                lastLines[lineIndex] === line ||
                lastLines[lineIndex + 1] === line ||
                lastLines[lineIndex - 1] === line
            ) {
                const direction = lastLines[lineIndex] === line ? 0 : lastLines[lineIndex + 1] === line ? -1 : 1;

                if (this.lineCache[(lineIndex + direction).toString()]) {
                    this.container.appendChild(this.lineCache[lineIndex.toString()]);
                    this.lineCache[lineIndex.toString()] = this.lineCache[(lineIndex + direction).toString()];
                    delete this.lineCache[(lineIndex + direction).toString()];
                    usedCache.push(lineIndex.toString());
                    console.log('used cache', lineIndex.toString())
                    continue;
                }
            } else {
                if (this.lineCache[lineIndex.toString()]) {
                    delete this.lineCache[lineIndex.toString()];
                }
            }

            if (await this.renderAudio(line, lineIndex)) continue;
            if (await this.renderImage(line, lineIndex)) continue;
            if (await this.renderVideo(line, lineIndex)) continue;
            if (await this.renderFileDownload(line, lineIndex)) continue;
            if (await this.renderIndentedParagraph(line, lineIndex)) continue;
            if (this.renderHeader(line, lineIndex)) continue;
            if (this.horizontalRule(line, lineIndex)) continue;
            await this.renderParagraph(line, lineIndex);
        }

        this.container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            if (checkbox instanceof HTMLInputElement) {
                checkbox.addEventListener('change', () => {
                    const lineIndex = parseInt(checkbox.id.split('_')[1]);
                    const lines = content.split('\n');
                    lines[lineIndex] = lines[lineIndex].replace(/\[.]/, checkbox.checked ? '[x]' : '[ ]');
                    content = lines.join('\n');
                    on_content_change(content, {
                        type: ChangeCallbackType.CHECKBOX_CHANGE,
                        line: lineIndex,
                        checked: checkbox.checked
                    });
                });
            }
        });

        this.container.querySelectorAll('a').forEach((link) => {
            if (link instanceof HTMLAnchorElement && link.href && link.href.match(/__LINK_\d+__/)) {
                const linkId = parseInt(link.href.match(/__LINK_(\d+)__/)![1]);
                link.href = this.links[linkId] || '#';
            }
        });

        // clear cache if it's too big
        if (Object.keys(this.mathCache).length > 100) {
            this.mathCache = {};
        }

        // delete unused cache
        for (const key of Object.keys(this.lineCache)) {
            if (!usedCache.includes(key)) {
                delete this.lineCache[key];
            }
        }

        this.lastContent = content;
    }

    private horizontalRule(line: string, lineIndex: number): boolean {
        if (line.startsWith('---')) {
            const hr = document.createElement('div');
            hr.style.marginTop = '1rem';
            hr.style.marginBottom = '1rem';
            hr.style.height = '2px';
            hr.classList.add('bg-gray-700', 'dark:bg-gray-200');

            this.lineCache[lineIndex.toString()] = hr.cloneNode(true) as HTMLElement;
            this.container.appendChild(hr);
            return true;
        }
        return false;
    }

    private renderHeader(line: string, lineIndex: number): boolean {
        if (line.startsWith('#')) {
            const headerLevel = line.match(/^#+/)![0].length;
            const headerText = line.slice(headerLevel).trim();
            const wrapper = document.createElement('div');
            const header = document.createElement(`h${headerLevel}`);
            header.classList.add(`text-${7 - headerLevel}xl`);
            header.classList.add('mb-4');
            header.textContent = headerText;
            header.id = headerText.toLowerCase().replaceAll(' ', '-');
            wrapper.appendChild(header);

            this.lineCache[lineIndex.toString()] = wrapper.cloneNode(true) as HTMLElement;
            this.container.appendChild(wrapper);
            return true;
        }
        return false;
    }

    private renderLink(line: string): boolean {
        if (line.match(/^\[\d+]:/)) {
            const link = line.match(/^\[\d+]: <(.*)>/)?.[1];
            const id = parseInt(line.match(/^\[(\d+)]:/)?.[1] || '-1');
            if (link) {
                this.links[id] = link;
            }
            return true;
        }
        return false;
    }

    private async renderParagraphSection(text: string): Promise<HTMLParagraphElement> {
        let filtered = await filterHtmlInjection(text, true);
        if (filtered.startsWith('ERROR:')) {
            const error = document.createElement('p');
            error.classList.add('text-red-500');
            error.textContent = filtered;
            return error;
        } else {
            filtered += ' ';

            const boldRegex = /\*\*(.*?)\*\*/g;
            filtered = filtered.replace(boldRegex, '<span class="font-bold">$1</span>');
            // search for italic
            const italicRegex = /\*(.*?)\*/g;
            filtered = filtered.replace(italicRegex, '<span class="italic">$1</span>');
            // search for underline
            const underlineRegex = /\s__(.*?)__\s/g;
            filtered = filtered.replace(underlineRegex, ' <span class="underline">$1</span> ');
            // search for strikethrough
            const strikethroughRegex = /~~(.*?)~~/g;
            filtered = filtered.replace(strikethroughRegex, '<span class="line-through">$1</span>');
            // search for image (if the image alt text is empty, it will be replaced with the image url. if the alt text has a pipe, the first part will be the alt text and the second part will be the image width)
            const imageRegex = /!\[(.*?)]\((.*?)(?:\|(.*?))?\)/g;
            filtered = filtered.replace(imageRegex, '<img src="$2" alt="$1" width="$3" class="rounded">');
            // search for link (watch out for image links)
            const linkRegex = /(?<!!)\[(.*?)]\((.*?)\)/g;
            filtered = filtered.replace(linkRegex, '<a href="$2" class="text-blue-500 underline">$1</a>');
            // search for link reference (watch out for image links)
            const linkReferenceRegex = /(?<!!)\[(.*?)]\[(.*?)]/g;
            filtered = filtered.replace(linkReferenceRegex, '<a href="__LINK_$2__" class="text-blue-500 underline">$1</a>');
            // double space for line break
            const lineBreakRegex = / {2}/g;
            filtered = filtered.replace(lineBreakRegex, '<br>');

            // search for code
            const codeRegex = /`(.*?)`/g;
            filtered = filtered.replace(codeRegex, (match) => {
                const wrapper = document.createElement('div');
                const span = document.createElement('span');
                span.classList.add('bg-[#23292d]', 'dark:bg-[#171a1c]', 'px-2', 'rounded-md', 'text-white', 'text-xs');
                span.textContent = match.replaceAll('`', '');
                wrapper.appendChild(span);
                return wrapper.innerHTML;
            });


            // check for math notations
            const paragraph = document.createElement('p');

            let notationStarted = false;
            let notation = '';
            let spanContent = '';

            const adaptor = liteAdaptor();
            RegisterHTMLHandler(adaptor);

            const mathjax_document = mathjax.document('', {
                InputJax: new TeX({packages: AllPackages}),
                OutputJax: new SVG({fontCache: 'local'})
            });

            const mathjax_options = {
                em: 16,
                ex: 8,
                containerWidth: 1280
            };

            for (let i = 0; i < filtered.length; i++) {
                const char = filtered[i];
                if (char === '$') {
                    if (notationStarted) {
                        notationStarted = false;

                        if (notation.trim() !== '') {
                            notation = notation.trim();
                            let svg;

                            if (this.mathCache[`$${notation}$`]) {
                                svg = this.mathCache[`$${notation}$`];
                            } else {
                                const node = mathjax_document.convert(notation, mathjax_options);
                                svg = adaptor.innerHTML(node);

                                this.mathCache[`$${notation}$`] = svg;
                            }

                            const spanElement = document.createElement('span');
                            spanElement.innerHTML = svg;
                            spanElement.classList.add('inline-block');
                            paragraph.appendChild(spanElement);
                        }

                        notation = '';
                    } else {
                        notationStarted = true;
                        if (spanContent.trim() !== '') {
                            const spanElement = document.createElement('span');
                            spanElement.innerHTML = spanContent;
                            paragraph.appendChild(spanElement);
                            spanContent = '';
                        }
                    }
                } else if (notationStarted) {
                    notation += char;
                } else {
                    spanContent += char;
                }
            }

            if (spanContent.trim() !== '') {
                const spanElement = document.createElement('span');
                spanElement.innerHTML = spanContent;
                paragraph.appendChild(spanElement);
            }

            return paragraph;
        }
    }

    private async renderParagraph(line: string, lineIndex: number): Promise<boolean> {
        line = line.trim();
        // search for bold
        const paragraph = await this.renderParagraphSection(line);

        this.lineCache[lineIndex.toString()] = paragraph.cloneNode(true) as HTMLElement;
        this.container.appendChild(paragraph);
        return true;
    }

    private async renderIndentedParagraph(line: string, lineIndex: number): Promise<boolean> {
        // if it starts with > or a hex (3 or 6 long) color and then a >, it's a paragraph
        if (line.startsWith('>') || line.match(/^#[0-9a-fA-F]{3,6}>/)) {
            line = line.trim();
            const indentation = line.match(/^>*/)?.[0].length || 1;
            const colorRegex = /^#[0-9a-fA-F]{3,6}>/;
            let color = '#4982f3';
            if (line.match(colorRegex)) {
                color = line.match(colorRegex)![0].slice(0, -1);
                line = line.slice(color.length + indentation);
            } else {
                line = line.slice(indentation);
            }

            const wrapper = document.createElement('div');
            let currentSpan = document.createElement('span');
            currentSpan.textContent = ' ';
            currentSpan.style.borderLeft = `2px solid ${color}`;
            currentSpan.classList.add('inline-block');
            wrapper.appendChild(currentSpan);

            for (let i = 1; i < indentation; i++) {
                const span = document.createElement('span');
                span.textContent = ' ';
                span.style.borderLeft = `2px solid ${color}`;
                span.classList.add('ml-2', 'inline-block');
                currentSpan.appendChild(span);
                currentSpan = span;
            }

            const paragraph = await this.renderParagraphSection(line);
            paragraph.classList.add('ml-2', 'inline-block');

            currentSpan.appendChild(paragraph);

            this.lineCache[lineIndex.toString()] = wrapper.cloneNode(true) as HTMLElement;
            this.container.appendChild(wrapper);
            return true;
        }
        return false;
    }

    private async renderList(line: string, lineIndex: number): Promise<boolean> {
        // its a list if the trimmed line starts with:
        // - (unordered list)
        // * (unordered list)
        // + (unordered list)
        // number. (ordered list)
        // - [ ] (unordered list with checkbox)
        // - [x] (unordered list with checkbox)
        // -[ ] (unordered list with checkbox)
        // -[x] (unordered list with checkbox)
        // [ ] (unordered list with checkbox)
        // [x] (unordered list with checkbox)

        const regex = /^(\*|\d+\.|\[.]|-\[.]|- \[.]|-|\+)\s/;

        if (line.trim().match(regex)) {
            if (!this.inList) {
                this.inList = true;
                this.listStructure = document.createElement('ul');
                this.listStructure.classList.add('list', 'mb-4');
            }

            if (this.listStructure === null) {
                return false;
            }

            // count the indentation. one indentation is 1 space or 1 tab (4 spaces). the indentation can only be one more or less than the previous indentation. if not clamp it to the next valid indentation
            let indentation = 0;
            while (line[indentation] === ' ' || line[indentation] === '\t') {
                indentation++;
            }

            if (indentation > this.lastIndentation + 1) {
                indentation = this.lastIndentation + 1;
            }

            if (indentation < this.lastIndentation - 1) {
                indentation = this.lastIndentation - 1;
            }

            if (indentation < 0) {
                indentation = 0;
            }

            if (indentation > 0) {
                if (indentation > this.lastIndentation) {
                    const newIndentation = document.createElement('ul');
                    newIndentation.classList.add('list');
                    this.listStructure.appendChild(newIndentation);
                    this.indentationHistory.push(this.listStructure);
                } else if (indentation < this.lastIndentation) {
                    let historyIndentation = this.lastIndentation;
                    while (historyIndentation > indentation) {
                        this.indentationHistory.pop();
                        historyIndentation--;
                    }
                }
            }

            this.lastIndentation = indentation;

            const listItem = document.createElement('li');
            listItem.classList.add('mb-2');
            listItem.style.paddingLeft = `${indentation * 1.5}rem`;

            const listType = line.trim().match(regex)![0].trim().replaceAll(' ', '');

            if (listType === '-' || listType === '*' || listType === '+') {
                const span = document.createElement('span');
                span.classList.add('mr-2');
                span.textContent = '•';
                listItem.appendChild(span);
            } else if (!isNaN(parseInt(listType))) {
                const span = document.createElement('span');
                span.classList.add('mr-2');
                span.textContent = listType.slice(0, -1) + '.';
                listItem.appendChild(span);
            } else if (listType.endsWith(']')) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `checkbox_${lineIndex}`;
                checkbox.checked = listType.toLowerCase().endsWith('x]');
                checkbox.classList.add('mr-2', 'checkbox');
                listItem.appendChild(checkbox);
            }

            let content = line.trim().slice(line.trim().indexOf(' ')).trim();
            if (content.startsWith(']')) {
                content = content.slice(1).trim();
            } else if (content.startsWith('[') && content[2] === ']') {
                content = content.slice(3).trim();
            }

            const paragraph = await this.renderParagraphSection(content);
            listItem.appendChild(paragraph);

            if (this.indentationHistory.length > 0) {
                this.indentationHistory[this.indentationHistory.length - 1].appendChild(listItem);
            } else {
                this.listStructure.appendChild(listItem);
            }
            return true;
        } else if (this.inList) {
            this.inList = false;

            if (this.listStructure !== null) {
                const copy = this.listStructure.cloneNode(true);
                this.container.appendChild(copy);
                this.listStructure = null;
                this.indentationHistory = [];
                this.lastIndentation = 0;
            }

            return false;
        }
        return false;
    }

    private renderCodeBlock(line: string, lineIndex: number): boolean {
        if (line.startsWith('```')) {
            if (this.inCodeBlock) {
                this.inCodeBlock = false;

                if (this.codeBlockLanguage.trim() === '') {
                    this.codeBlockLanguage = 'text';
                }

                if (!get(storeHighlightJs).listLanguages().includes(this.codeBlockLanguage)) {
                    this.codeBlockLanguage = 'text';
                }

                const wrapper = document.createElement('div');
                new CodeBlock({
                    target: wrapper,
                    props: {
                        language: this.codeBlockLanguage,
                        code: this.codeBlockContent,
                        class: 'my-4'
                    }
                });
                this.lineCache[`${this.startBlockLine}-${lineIndex}`] = wrapper.cloneNode(true) as HTMLElement;
                this.container.appendChild(wrapper);

                this.codeBlockLanguage = '';
                this.codeBlockContent = '';
                return true;
            } else {
                this.startBlockLine = lineIndex;
                this.inCodeBlock = true;
                this.codeBlockLanguage = line.slice(3).trim().replace(/`/g, '');
                return true;
            }
        } else if (this.inCodeBlock) {
            this.codeBlockContent += line + '\n';
            return true;
        }
        return false;
    }

    private async renderMathBlock(line: string, lineIndex: number): Promise<boolean> {
        if (line.startsWith('$$')) {
            if (this.inMathBlock) {
                this.inMathBlock = false;
                if (this.mathBlockContent.trim() !== '') {
                    let svg = '';

                    if (this.mathCache[`$$${this.mathBlockContent}$$`]) {
                        svg = this.mathCache[`$$${this.mathBlockContent}$$`];
                    } else {
                        const adaptor = liteAdaptor();
                        RegisterHTMLHandler(adaptor);
                        const mathjax_document = mathjax.document('', {
                            InputJax: new TeX({packages: AllPackages}),
                            OutputJax: new SVG({fontCache: 'local'})
                        });
                        const mathjax_options = {
                            em: 16,
                            ex: 8,
                            containerWidth: 1280
                        };
                        const node = mathjax_document.convert(this.mathBlockContent, mathjax_options);
                        svg = adaptor.innerHTML(node);
                        this.mathCache[`$$${this.mathBlockContent}$$`] = svg;
                    }

                    const spanElement = document.createElement('span');
                    spanElement.innerHTML = svg;
                    spanElement.classList.add('block', 'p-4', 'mb-4', 'rounded-md', 'outline', 'outline-1');

                    // Added centering styles
                    spanElement.style.display = 'flex';
                    spanElement.style.justifyContent = 'center';
                    spanElement.style.alignItems = 'center';
                    spanElement.style.backgroundColor = '#f5f5f522';

                    this.lineCache[`${this.startMathLine}-${lineIndex}`] = spanElement.cloneNode(true) as HTMLElement;
                    this.container.appendChild(spanElement);
                }
                this.mathBlockContent = '';
                return true;
            } else {
                this.startMathLine = lineIndex;
                this.inMathBlock = true;
                return true;
            }
        } else if (this.inMathBlock) {
            this.mathBlockContent += line + '\n';
            return true;
        }
        return false;
    }

    private async renderTable(line: string, nextLine: string, lineIndex: number): Promise<boolean> {
        line = line.trim();
        if (line.startsWith('|') && (line.endsWith('|') || line.substring(line.length - 9, line.length - 6) === '<-#') && nextLine.startsWith('|-') && nextLine.endsWith('|')) {
            const pipeCount = line.split('|').length - 1;
            const nextPipeCount = nextLine.split('|').length - 1;
            if (pipeCount !== nextPipeCount) {
                return false;
            }

            this.columnCount = pipeCount;

            if (this.inTable) {
                if (this.tableStructure !== null) {
                    const copy = this.tableStructure.cloneNode(true);
                    this.container.appendChild(copy);
                    this.tableStructure = null;
                }
            } else {
                this.startTableLine = lineIndex;
                this.inTable = true;
            }

            const wrapper = document.createElement('div');
            wrapper.classList.add('table-container');

            const table = document.createElement('table');
            table.classList.add('table', 'table-hover');

            const headTexts = line.split('|').slice(1, -1);
            const head = document.createElement('thead');
            const headRow = document.createElement('tr');

            const bgColor = line.substring(line.length - 9, line.length - 6) === '<-#' ? line.substring(line.length - 6, line.length) : null;
            if (bgColor) {
                headRow.classList.add(`bg-[#${bgColor.trim()}]`);
            }

            for (const text of headTexts) {
                const cell = document.createElement('th');
                const paragraph = await this.renderParagraphSection(text.trim());
                cell.appendChild(paragraph);
                headRow.appendChild(cell);
            }

            head.appendChild(headRow);
            table.appendChild(head);

            const body = document.createElement('tbody');
            table.appendChild(body);

            wrapper.appendChild(table);
            this.tableStructure = wrapper;
            return true;
        } else if (this.inTable && this.tableStructure && line.startsWith('|') && line.endsWith('|')) {
            const pipeCount = line.split('|').length - 1;
            if (pipeCount !== this.columnCount) {
                return false;
            }

            // check if the line is only dashes or not
            if (line.startsWith('|-') && line.endsWith('|')) {
                return true;
            }

            const body = this.tableStructure.querySelector('tbody');
            if (body === null) {
                return false;
            }

            const rowTexts = line.split('|').slice(1, -1);
            const row = document.createElement('tr');

            for (const text of rowTexts) {
                const cell = document.createElement('td');
                const paragraph = await this.renderParagraphSection(text.trim());
                cell.appendChild(paragraph);
                row.appendChild(cell);
            }

            body.appendChild(row);
            return true;
        } else if (this.inTable) {
            this.inTable = false;

            if (this.tableStructure !== null) {
                const copy = this.tableStructure.cloneNode(true);
                this.lineCache[`${this.startTableLine}-${lineIndex}`] = copy as HTMLElement;
                this.container.appendChild(copy);
                this.tableStructure = null;
            }

            return false;
        }

        return false;
    }

    private async renderVideo(line: string, lineIndex: number): Promise<boolean> {
        if (line.startsWith('![[') && line.endsWith(']]')) {
            const elements = line.slice(3, -2).split('|');
            const videoUrl = elements[0];
            if (videoUrl === '') {
                return false;
            }

            const videoWidth = elements[1] ? `w-[${elements[1]}px]` : 'w-full';

            if (videoUrl.includes('youtube.com/watch?v=')) {
                const videoId = videoUrl.split('youtube.com/watch?v=')[1];
                const video = document.createElement('iframe');
                video.src = `https://www.youtube.com/embed/${videoId}`;
                video.classList.add('my-4', videoWidth, 'rounded-md');
                video.style.aspectRatio = '16/9';
                this.lineCache[lineIndex.toString()] = video.cloneNode(true) as HTMLElement;
                this.container.appendChild(video);
                return true;
            }

            // check if the url is actually a video by fetching it and checking the content type
            // if the content type is not a video, return false

            const validVideoExtensions = ['mp4', 'webm', 'ogv', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'm4v', 'm4p', 'mpg', 'mpeg', 'm2v', '3gp', '3g2', 'mxf', 'roq', 'nsv', 'f4v', 'f4p', 'f4a', 'f4b', 'mng', 'gifv'];

            if (!validVideoExtensions.includes(videoUrl.split('.').pop()!)) {
                try {
                    const response = await fetch(videoUrl, {method: 'HEAD', mode: 'no-cors'});
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.startsWith('video/')) {
                        return false;
                    }
                } catch (e) {
                    return false;
                }
            }

            try {
                const video = document.createElement('video');
                video.src = videoUrl;
                video.controls = true;
                video.classList.add('my-4', videoWidth, 'rounded-md');
                this.lineCache[lineIndex.toString()] = video.cloneNode(true) as HTMLElement;
                this.container.appendChild(video);
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    private async renderImage(line: string, lineIndex: number): Promise<boolean> {
        if (line.startsWith('![[') && line.endsWith(']]')) {
            const elements = line.slice(3, -2).split('|');
            const imageUrl = elements[0];
            if (imageUrl === '') {
                return false;
            }

            const imageWidth = elements[1] ? `w-[${elements[1]}px]` : 'w-full';

            // check if the url is actually an image by fetching it and checking the content type
            // if the content type is not an image, return false

            const validImageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'];

            if (!validImageExtensions.includes(imageUrl.split('.').pop()!)) {
                try {
                    const response = await fetch(imageUrl, {method: 'HEAD', mode: 'no-cors'});
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.startsWith('image/')) {
                        return false;
                    }
                } catch (e) {
                    return false;
                }
            }

            const image = document.createElement('img');
            image.src = imageUrl;
            image.classList.add('my-4', imageWidth, 'rounded-md');
            this.lineCache[lineIndex.toString()] = image.cloneNode(true) as HTMLElement;
            this.container.appendChild(image);
            return true;
        }
        return false;
    }

    private async renderAudio(line: string, lineIndex: number): Promise<boolean> {
        if (line.startsWith('![[') && line.endsWith(']]')) {
            const elements = line.slice(3, -2).split('|');
            const audioUrl = elements[0];
            if (audioUrl === '') {
                return false;
            }

            const audioWidth = elements[1] ? `w-[${elements[1]}px]` : 'w-full';

            // check if the url is actually an audio by fetching it and checking the content type
            // if the content type is not an audio, return false

            const validAudioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'wma', 'm4a', 'aiff', 'alac', 'ape', 'dsd', 'dsf', 'dff', 'mpc', 'mp+', 'mpp', 'mpc'];

            if (!validAudioExtensions.includes(audioUrl.split('.').pop()!)) {
                try {
                    const response = await fetch(audioUrl, {method: 'HEAD', mode: 'no-cors'});
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.startsWith('audio/')) {
                        return false;
                    }
                } catch (e) {
                    return false;
                }
            }

            const audio = document.createElement('audio');
            audio.controls = true;
            audio.classList.add('my-4', audioWidth, 'rounded-md');

            const source = document.createElement('source');
            source.src = audioUrl;
            source.type = 'audio/' + audioUrl.split('.').pop()!;

            audio.appendChild(source);
            this.lineCache[lineIndex.toString()] = audio.cloneNode(true) as HTMLElement;
            this.container.appendChild(audio);
            return true;
        }
        return false;
    }

    private async renderFileDownload(line: string, lineIndex: number): Promise<boolean> {
        if (line.startsWith('[[[') && line.endsWith(']]]')) {
            const urls = line.slice(3, -3);
            if (urls === '') {
                return false;
            }

            const fileUrls = urls.includes(';') ? urls.split(';') : [urls];
            let count = 0;
            for (const url of fileUrls) {
                const fileUrl = url.trim();
                if (fileUrl === '') {
                    continue;
                }
                count++;
            }

            const wrapper = document.createElement('div');
            wrapper.classList.add(
                'my-4',
                'grid',
                'grid-cols-1',
                `md:grid-cols-${Math.min(2, count)}`,
                `lg:grid-cols-${Math.min(3, count)}`,
                'gap-x-4'
            );

            for (const url of fileUrls) {
                const fileUrl = url.trim();
                if (fileUrl === '') {
                    continue;
                }

                const fullName = fileUrl.split('/').pop()!;

                const fileCard = document.createElement('div');
                fileCard.classList.add('flex', 'flex-row', 'items-center', 'justify-between', 'w-full', 'mb-2', 'p-4', 'rounded-md', 'bg-gray-100', 'dark:bg-gray-800');

                const fileName = fullName.split('.')[0];
                const span = document.createElement('p');
                span.textContent = fileName;
                span.classList.add('font-bold', 'truncate', 'mr-4', 'max-w-12');
                fileCard.appendChild(span);

                const downloadButton = document.createElement('a');
                downloadButton.href = fileUrl;
                downloadButton.download = fullName;
                downloadButton.target = '_blank';
                downloadButton.classList.add('ml-4', 'p-2', 'btn', 'variant-filled-primary');
                downloadButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M4.75 17.25a.75.75 0 0 1 .75.75v2.25c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V18a.75.75 0 0 1 1.5 0v2.25A1.75 1.75 0 0 1 18.25 22H5.75A1.75 1.75 0 0 1 4 20.25V18a.75.75 0 0 1 .75-.75Z"></path><path d="M5.22 9.97a.749.749 0 0 1 1.06 0l4.97 4.969V2.75a.75.75 0 0 1 1.5 0v12.189l4.97-4.969a.749.749 0 1 1 1.06 1.06l-6.25 6.25a.749.749 0 0 1-1.06 0l-6.25-6.25a.749.749 0 0 1 0-1.06Z"></path></svg>';
                fileCard.appendChild(downloadButton);

                wrapper.appendChild(fileCard);
            }

            this.lineCache[lineIndex.toString()] = wrapper.cloneNode(true) as HTMLElement;
            this.container.appendChild(wrapper);
            return true;
        }
        return false;
    }
}

