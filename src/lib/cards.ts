import {get, writable} from "svelte/store";
import {currentUser, loggedIn, supabase} from "$lib/database";
import {shortUUID} from "$lib/helpers";
import {permissions, permissions_loaded} from "$lib/permissions";
import {franc} from "franc";

const CARD_LEARNED = 2;

export enum Side {
    Value,
    Definition
}

export class Card {
    value: string;
    value_example: string | null = null;
    definition: string;
    definition_example: string | null = null;

    reference: string | null = null;

    value_streak: number = 0;
    definition_streak: number = 0;

    value_seen: number = 0;
    definition_seen: number = 0;

    solve_times: number[] = [];
    average_solve_time: number = 0;

    constructor(value: string, definition: string) {
        this.value = value;
        this.definition = definition;
    }

    import(card: Card) {
        this.value = card.value;
        this.value_example = card.value_example;
        this.definition = card.definition;
        this.definition_example = card.definition_example;
        this.reference = card.reference;
        this.value_streak = card.value_streak;
        this.definition_streak = card.definition_streak;
        this.value_seen = card.value_seen;
        this.definition_seen = card.definition_seen;
        this.solve_times = card.solve_times;
        this.average_solve_time = card.average_solve_time;
        return this;
    }

    addValueExample(example: string) {
        this.value_example = example;
    }

    addDefinitionExample(example: string) {
        this.definition_example = example;
    }

    addReference(reference: string) {
        this.reference = reference;
    }

    addSolveTime(time: number) {
        this.solve_times.push(time);
        this.average_solve_time = this.solve_times.reduce((a, b) => a + b, 0) / this.solve_times.length;
    }

    clearSolveTimes() {
        this.solve_times = [];
        this.average_solve_time = 0;
    }
}

export type LearningSettings = {
    allow_partial_answers: boolean;
    case_sensitive: boolean;
}

export enum ErrorType {
    NoCards,
    NoCardProvided,
}

export type NextCardReturn = {
    card: Card;
    side: Side;
    error: null;
} | {
    error: {
        message: string;
        type: ErrorType;
    }
}

export type UpdateCardReturn = {
    card: Card;
    side: Side;
    correct: boolean;
    correct_answer: string;
    error: null;
} | {
    error: {
        message: string;
        type: ErrorType;
    }
}


export const langMap: Record<string, string> = {
    'ara': 'ar-SA',
    'zho': 'zh-CN',
    'deu': 'de-DE',
    'dan': 'da-DK',
    'eng': 'en-US',
    'fin': 'fi-FI',
    'hin': 'hi-IN',
    'ind': 'id-ID',
    'ita': 'it-IT',
    'jpn': 'ja-JP',
    'kor': 'ko-KR',
    'nld': 'nl-NL',
    'nor': 'no-NO',
    'pol': 'pl-PL',
    'por': 'pt-BR',
    'rus': 'ru-RU',
    'spa': 'es-ES',
    'swe': 'sv-SE',
    'tha': 'th-TH',
    'ces': 'cs-CZ',
    'tur': 'tr-TR',
    'hun': 'hu-HU',
    'fra': 'fr-FR',
};

export function cardIndex(card: Card, cards: Card[]): number {
    return cards.findIndex(c => c.value === card.value && c.definition === card.definition && c.value_example === card.value_example && c.definition_example === card.definition_example && c.reference === card.reference);
}

export class Trainer {
    cards: Card[] = [];
    side_to_learn: "value" | "definition" | "both" = "both";

    learned_deck: Card[] = [];

    learning_deck: Card[] = [];
    current_deck: Card[] = [];

    unlearned_deck: Card[] = [];

    current_round_length: number = 5;
    default_round_length: number = 5;

    settings: LearningSettings = {
        allow_partial_answers: false,
        case_sensitive: false
    };

    round: number = 0;
    round_side: Side = Side.Value;

    value_language: string = "en-US";
    definition_language: string = "en-US";

    classVersion: number = 2;

    constructor(cards: Card[], settings?: LearningSettings, side_to_learn?: "value" | "definition" | "both") {
        this.cards = cards;
        this.settings = settings || this.settings;
        this.side_to_learn = side_to_learn || this.side_to_learn;

        this.unlearned_deck = this.cards.filter(card => card.value_streak < CARD_LEARNED && card.definition_streak < CARD_LEARNED);
        this.learned_deck = this.cards.filter(card => card.value_streak >= CARD_LEARNED || card.definition_streak >= CARD_LEARNED);
        this.chooseSideToLearn();
    }

    detectLanguages() {
        const allValuesCombined = this.cards.map(card => card.value).join(" ");
        const allDefinitionsCombined = this.cards.map(card => card.definition).join(" ");

        const valuesDetectedLangISO6393: string = franc(allValuesCombined);
        const definitionsDetectedLangISO6393: string = franc(allDefinitionsCombined);

        console.log(`Detected value language: ${valuesDetectedLangISO6393}`)
        console.log(`Detected definition language: ${definitionsDetectedLangISO6393}`)

        this.value_language = langMap[valuesDetectedLangISO6393] || "en-US";
        this.definition_language = langMap[definitionsDetectedLangISO6393] || "en-US";

        console.log(`Using value language: ${this.value_language}`)
        console.log(`Using definition language: ${this.definition_language}`)
    }

    import(trainer: Trainer) {
        if (!trainer.classVersion) {
            this.cards = trainer.cards.map(card => (new Card("", "")).import(card));
            this.side_to_learn = trainer.side_to_learn;
            this.learned_deck = trainer.learned_deck.map(card => (new Card("", "")).import(card));
            this.learning_deck = trainer.current_deck.map(card => (new Card("", "")).import(card));
            this.unlearned_deck = trainer.unlearned_deck.map(card => (new Card("", "")).import(card));
            this.settings = trainer.settings;
            this.round = trainer.round;
            this.chooseSideToLearn();

            if (trainer.value_language) this.value_language = trainer.value_language;
            if (trainer.definition_language) this.definition_language = trainer.definition_language;
            if (!trainer.value_language || !trainer.definition_language) this.detectLanguages();
        } else if (trainer.classVersion === 2) {
            this.cards = trainer.cards.map(card => (new Card("", "")).import(card));
            this.side_to_learn = trainer.side_to_learn;
            this.learned_deck = trainer.learned_deck.map(card => (new Card("", "")).import(card));
            this.learning_deck = trainer.learning_deck.map(card => (new Card("", "")).import(card));
            this.unlearned_deck = trainer.unlearned_deck.map(card => (new Card("", "")).import(card));
            this.settings = trainer.settings;
            this.round = trainer.round;
            this.chooseSideToLearn();

            if (trainer.value_language) this.value_language = trainer.value_language;
            if (trainer.definition_language) this.definition_language = trainer.definition_language;
            if (!trainer.value_language || !trainer.definition_language) this.detectLanguages();
        }

        console.log(this)
    }

    refresh() {
        this.unlearned_deck = this.cards.filter(card => card.value_streak < CARD_LEARNED && card.definition_streak < CARD_LEARNED);
        this.learned_deck = this.cards.filter(card => card.value_streak >= CARD_LEARNED || card.definition_streak >= CARD_LEARNED);
    }

    chooseSideToLearn(random: boolean = true) {
        if (this.side_to_learn === "both") {
            if (random) this.round_side = Math.random() < 0.5 ? Side.Value : Side.Definition;
            else this.round_side = this.round_side === Side.Value ? Side.Definition : Side.Value;
        } else {
            this.round_side = this.side_to_learn === "value" ? Side.Value : Side.Definition;
        }
    }

    randomIndex(stack: Card[]): number {
        return Math.floor(Math.random() * stack.length);
    }

    randomCard(exclude?: Card[]): Card {
        const max_tries = 100;
        let tries = 0;
        let card = this.cards[this.randomIndex(this.cards)];
        while (exclude && exclude.find(c => c.value === card.value && c.definition === card.definition)) {
            card = this.cards[this.randomIndex(this.cards)];
            tries++;
            if (tries >= max_tries) break;
        }
        return card;
    }

    get nextCard(): NextCardReturn {
        while (this.learning_deck.length < this.default_round_length) {
            const card = this.unlearned_deck[this.randomIndex(this.unlearned_deck)];
            if (card === undefined) break;
            this.learning_deck.push(card);
            this.unlearned_deck.splice(cardIndex(card, this.unlearned_deck), 1);
        }

        if (this.current_deck.length === 0) {
            if (this.unlearned_deck.length === 0) {
                return {
                    error: {
                        message: "No cards left",
                        type: ErrorType.NoCards,
                    }
                }
            } else {
                this.current_deck = [...this.learning_deck];
                this.current_deck.sort(() => Math.random() - 0.5);
                this.current_round_length = this.learning_deck.length;
            }
        }

        const nextCard = this.current_deck[0];
        this.current_deck.splice(cardIndex(nextCard, this.current_deck), 1);

        const side = this.round_side;

        console.log(this)

        return {
            card: nextCard,
            side: side,
            error: null,
        }
    }

    updateCard(card: Card, side: Side, answer: string, solve_time: number): UpdateCardReturn {
        if (card === undefined) return {
            error: {
                message: "No card provided",
                type: ErrorType.NoCardProvided
            }
        }

        let correct = false;
        let right_answer = "";

        answer = answer.trim();

        if (side === Side.Value) {
            right_answer = card.definition;
        }

        if (side === Side.Definition) {
            right_answer = card.value;
        }

        if (this.settings.case_sensitive && answer === right_answer) correct = true;
        if (!this.settings.case_sensitive && answer.toLowerCase() === right_answer.toLowerCase()) correct = true;

        if (this.settings.allow_partial_answers && !this.settings.case_sensitive) {
            if (right_answer.split(",").includes(answer)) correct = true;
            if (right_answer.split(";").includes(answer)) correct = true;
            if (right_answer.replace(/\(.*?\)/g, "").trim().split(",").includes(answer)) correct = true;
            if (right_answer.replace(/\(.*?\)/g, "").trim().split(";").includes(answer)) correct = true;
        } else if (this.settings.allow_partial_answers && this.settings.case_sensitive) {
            if (right_answer.toLowerCase().split(",").includes(answer.toLowerCase())) correct = true;
            if (right_answer.toLowerCase().split(";").includes(answer.toLowerCase())) correct = true;
            if (right_answer.toLowerCase().replace(/\(.*?\)/g, "").trim().split(",").includes(answer.toLowerCase())) correct = true;
            if (right_answer.toLowerCase().replace(/\(.*?\)/g, "").trim().split(";").includes(answer.toLowerCase())) correct = true;
        }

        if (side === Side.Value) {
            card.value_seen++;
        } else {
            card.definition_seen++;
        }

        if (correct) {
            if (side === Side.Value) {
                card.value_streak++;
            } else {
                card.definition_streak++;
            }

            card.addSolveTime(solve_time);
        } else {
            if (side === Side.Value) {
                if (card.value_streak === 0) {
                    this.current_deck.push(card);
                    this.current_round_length++;
                } else {
                    card.value_streak = 1;
                }
            }

            if (side === Side.Definition) {
                if (card.definition_streak === 0) {
                    this.current_deck.push(card);
                    this.current_round_length++;
                } else {
                    card.definition_streak = 1;
                }
            }
        }

        this.learning_deck[cardIndex(card, this.learning_deck)] = card;

        if (card.value_streak >= CARD_LEARNED || card.definition_streak >= CARD_LEARNED) {
            this.learned_deck.push(card);
            this.learning_deck.splice(cardIndex(card, this.learning_deck), 1);
        }

        if (this.current_deck.length === 0) {
            this.round++;
            this.chooseSideToLearn(false);
        }

        console.log(this.learn_percentage)

        return {card, side, correct, correct_answer: right_answer, error: null};
    }

    get learn_percentage(): number {
        const valueStreakSum = this.learned_deck.reduce((a, b) => a + b.value_streak, 0) + this.learning_deck.reduce((a, b) => a + b.value_streak, 0);
        const definitionStreakSum = this.learned_deck.reduce((a, b) => a + b.definition_streak, 0) + this.learning_deck.reduce((a, b) => a + b.definition_streak, 0);
        const totalStreakSum = valueStreakSum + definitionStreakSum;
        const maxStreakSum = this.cards.length * CARD_LEARNED * 2;

        return Math.round((totalStreakSum / maxStreakSum) * 100);
    }

    restart() {
        for (const card of this.cards) {
            card.value_streak = 0;
            card.definition_streak = 0;
            card.clearSolveTimes();
        }

        this.learned_deck = [];
        this.current_deck = [];
        this.learning_deck = [];
        this.unlearned_deck = [...this.cards.filter(card => card.value_streak < CARD_LEARNED && card.definition_streak < CARD_LEARNED)];
        this.round = 0;
    }

    static extractSpecialCharacters(input: string): string[] {
        const regex = /[^a-zA-Z0-9\s\p{P}]/gu;

        return input.match(regex) || [];
    }

    getSpecialChars(): string[] {
        const chars: string[] = [];

        for (const card of this.cards) {
            chars.push(...Trainer.extractSpecialCharacters(card.value));
            chars.push(...Trainer.extractSpecialCharacters(card.definition));
        }

        return [...new Set(chars)];
    }

    async playAudio(cardText: string, lang: string | null = null) {
        // find card
        const card = this.cards.find(card => card.value === cardText || card.definition === cardText);
        if (card === undefined) return;

        // get the side of the card by checking if the cardText is the value or the definition
        const side = card.value === cardText ? Side.Value : Side.Definition;
        const langToUse = lang || (side === Side.Value ? this.value_language : this.definition_language);

        cardText = cardText.replaceAll(/\/|;|\(.*?\)/g, "; ");

        const response = await fetch("/api/tts", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: cardText,
                gender: "male",
                lang: langToUse
            }),
        })

        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], {type: "audio/wav"});
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play().catch((error) => {
                console.error('Error message:', error.message);
                console.error('Error name:', error.name);
            });
        } else {
            console.error(response)
        }
    }
}

export function importCards(text: string, card_separator: string = ",", pair_separator: string = "\n") {
    const cards: Card[] = [];
    const pairs = text.split(pair_separator);
    for (const pair of pairs) {
        const [value, definition] = pair.split(card_separator);
        const card = new Card(value, definition);
        cards.push(card);
    }
    return cards;
}

export function exportCards(cards: Card[], card_separator: string = ",", pair_separator: string = "\n") {
    for (const card of cards) {
        card.value = card.value.replaceAll(card_separator, " ");
        card.definition = card.definition.replaceAll(card_separator, " ");
    }

    return cards.map(card => `${card.value}${card_separator}${card.definition}`).join(pair_separator);
}

export function CardsToArrays(cards: Card[]) {
    const values: string[] = [];
    const definitions: string[] = [];
    for (const card of cards) {
        values.push(card.value);
        definitions.push(card.definition);
    }
    return {
        values,
        definitions
    };
}

export function ArraysToCards(values: string[], definitions: string[]): Card[] {
    const cards: Card[] = [];
    for (let i = 0; i < values.length; i++) {
        if (i >= definitions.length) break;
        cards.push(new Card(values[i], definitions[i]))
    }
    return cards;
}


export async function getSetPreviews(): Promise<{
    title: string;
    short_uuid: string;
    length: number;
    author: string;
}[] | null> {
    if (!get(loggedIn)) {
        console.log("Not logged in")
        return null;
    }

    const currentEmail = get(currentUser)?.email;
    if (!currentEmail) {
        console.log("No email")
        return null;
    }

    const {data: progress_data, error: progress_error} = await supabase
        .from("cards_progress")
        .select("original_uuid, short_uuid")
        .eq("email", currentEmail);

    if (progress_error) {
        console.error(progress_error);
        return null;
    }

    const {data: set_data, error: set_error} = await supabase
        .from("cards")
        .select("title, short_uuid, values, editors")
        .in("short_uuid", progress_data.map(set => set.original_uuid));

    if (set_error) {
        console.error(set_error);
        return null;
    }

    for (const progress of progress_data) {
        if (!set_data.find(set => set.short_uuid === progress.original_uuid)) {
            await deleteProgress(progress.short_uuid);
        }
    }

    const result: {
        title: string;
        short_uuid: string;
        length: number;
        author: string;
    }[] = [];

    for (const set of set_data) {
        result.push({
            title: set.title as string,
            short_uuid: set.short_uuid as string,
            length: set.values.length as number,
            author: set.editors[0] as string,
        })
    }

    return result;
}

export async function getSetSearchPreviews(search: string, last_created_at: string = ""): Promise<{
    previews: {
        title: string;
        short_uuid: string;
        length: number;
        author: string;
    }[]
    last_created_at: string;
} | null> {
    if (!get(loggedIn)) {
        console.log("Not logged in")
        return null;
    }

    const currentEmail = get(currentUser)?.email;
    if (!currentEmail) {
        console.log("No email")
        return null;
    }

    if (last_created_at === "" || last_created_at === null || last_created_at === undefined) {
        last_created_at = "1970-01-01T00:00:00Z";
    }

    const {data: cards_data, error: cards_error} = await supabase
        .rpc("search_cards", {search, last_created_at});

    if (cards_error) {
        console.error(cards_error);
        return null;
    }

    console.log(cards_data)

    const result: {
        title: string;
        short_uuid: string;
        length: number;
        author: string;
    }[] = [];

    if (!cards_data) return {previews: result, last_created_at};

    const new_last_created_at = cards_data[cards_data.length - 1]?.created_at as string || last_created_at;

    for (const set of cards_data) {
        result.push({
            title: set.title as string,
            short_uuid: set.short_uuid as string,
            length: set.values.length as number,
            author: set.editors[0] as string,
        })
    }

    return {
        previews: result,
        last_created_at: new_last_created_at,
    };
}

export async function createNewSet(title: string = "Untitled"): Promise<string> {
    if (!get(loggedIn)) {
        console.log("Not logged in")
        return "";
    }

    const currentEmail = get(currentUser)?.email;
    if (!currentEmail) {
        console.log("No email")
        return "";
    }

    const short_uuid = shortUUID();

    const {data, error} = await supabase
        .from("cards")
        .insert({
            title,
            short_uuid,
            editors: [currentEmail],
            private: true,
            values: [],
            definitions: [],
        });

    if (error) {
        console.error(error);
        return "";
    }

    return short_uuid;
}

export let temporaryTrainers: Record<string, Trainer> = {};

export async function getSet(short_uuid: string, ignore_not_logged_in: boolean = false): Promise<{
    data: {
        set_uuid: string,
        progress_uuid: string,
        title: string,
        authors: string[],
        private: boolean,
        values: string[],
        definitions: string[],
        trainer: Trainer,
    } | null,
    error: any
}> {
    if (!get(loggedIn) && !ignore_not_logged_in) {
        console.log("Not logged in")
        return {data: null, error: "Not logged in"};
    }

    const currentEmail = get(currentUser)?.email;
    if (!currentEmail && !ignore_not_logged_in) {
        console.log("No email")
        return {data: null, error: "No email"};
    }

    const result = {
        set_uuid: short_uuid,
        progress_uuid: "",
        title: "",
        authors: [],
        private: false,
        values: [],
        definitions: [],
        trainer: new Trainer([]),
    };

    const {data: set_data, error: set_error} = await supabase
        .from("cards")
        .select("*")
        .eq("short_uuid", short_uuid)
        .single();

    if (set_error) {
        console.error(set_error);
        return {data: null, error: set_error};
    }

    if (!set_data) {
        console.error("No set data");
        return {data: null, error: "No set data"};
    }

    result.title = set_data.title;
    result.authors = set_data.editors;
    result.private = set_data.private;
    result.values = set_data.values;
    result.definitions = set_data.definitions;

    const cards: Card[] = [];
    for (let i = 0; i < set_data.values.length; i++) {
        const card = new Card(set_data.values[i], set_data.definitions[i]);
        cards.push(card);
    }

    if (ignore_not_logged_in && !currentEmail) {
        loadTemporaryTrainersFromWebStorage();

        if (temporaryTrainers[short_uuid]) {
            result.trainer = temporaryTrainers[short_uuid];
            return {data: result, error: null};
        }

        result.trainer = new Trainer(cards);
        temporaryTrainers[short_uuid] = result.trainer;
        return {data: result, error: null};
    }

    if (temporaryTrainers[short_uuid]) {
        delete temporaryTrainers[short_uuid];
    }

    const {data: progress_data, error: progress_error} = await supabase
        .from("cards_progress")
        .select("*")
        .eq("original_uuid", short_uuid)
        .single();

    if (progress_error) {
        if (progress_error.code === "PGRST116") {
            const new_progress_data = {
                original_uuid: short_uuid,
                short_uuid: shortUUID(),
                trainer: new Trainer(cards),
                email: currentEmail,
            }

            const {error: new_progress_error} = await supabase
                .from("cards_progress")
                .insert(new_progress_data)

            if (new_progress_error) {
                console.error(new_progress_error);
                return {data: null, error: new_progress_error};
            }

            result.progress_uuid = new_progress_data.short_uuid;
            result.trainer = new_progress_data.trainer as Trainer;

            return {data: result, error: null};
        } else {
            console.error(progress_error);
            return {data: null, error: progress_error};
        }
    }

    if (!progress_data) {
        console.error("No progress data");
        return {data: null, error: "No progress data"};
    }

    result.progress_uuid = progress_data.short_uuid;
    result.trainer.import(progress_data.trainer as Trainer);

    if (result.trainer.cards.length !== result.values.length) {
        for (let i = 0; i < result.values.length; i++) {
            // if the card is not in the trainer, add it to the trainer
            if (!result.trainer.cards.find(card => card.value === result.values[i] && card.definition === result.definitions[i])) {
                const card = new Card(result.values[i], result.definitions[i]);
                result.trainer.cards.push(card);
            }
        }

        // if the trainer has more cards than the set, remove the extra cards
        if (result.trainer.cards.length > result.values.length) {
            for (let i = 0; i < result.trainer.cards.length; i++) {
                if (!result.values.find(value => value === result.trainer.cards[i].value && result.definitions.find(definition => definition === result.trainer.cards[i].definition))) {
                    result.trainer.cards.splice(i, 1);
                }
            }

            for (let i = 0; i < result.trainer.current_deck.length; i++) {
                if (!result.values.find(value => value === result.trainer.current_deck[i].value && result.definitions.find(definition => definition === result.trainer.current_deck[i].definition))) {
                    result.trainer.current_deck.splice(i, 1);
                }
            }

            for (let i = 0; i < result.trainer.learned_deck.length; i++) {
                if (!result.values.find(value => value === result.trainer.learned_deck[i].value && result.definitions.find(definition => definition === result.trainer.learned_deck[i].definition))) {
                    result.trainer.learned_deck.splice(i, 1);
                }
            }

            for (let i = 0; i < result.trainer.unlearned_deck.length; i++) {
                if (!result.values.find(value => value === result.trainer.unlearned_deck[i].value && result.definitions.find(definition => definition === result.trainer.unlearned_deck[i].definition))) {
                    result.trainer.unlearned_deck.splice(i, 1);
                }
            }
        }

        result.trainer.refresh();
    }

    return {data: result, error: null};
}

export async function saveSet(set_uuid: string, title: string, values: string[], definitions: string[], private_set: boolean) {
    if (!get(loggedIn)) {
        console.log("Not logged in")
        return "";
    }

    const {data, error} = await supabase
        .from("cards")
        .update({
            title,
            values,
            definitions,
            private: private_set,
        })
        .eq("short_uuid", set_uuid);

    if (error) {
        console.error(error);
        return "";
    }

    return set_uuid;
}

export async function saveProgress(progress_uuid: string, trainer: Trainer) {
    if (!get(loggedIn)) {
        console.log("Not logged in")

        if (temporaryTrainers[progress_uuid]) {
            temporaryTrainers[progress_uuid] = trainer;
            saveTemporaryTrainersInWebStorage();
            return progress_uuid;
        }

        return "";
    }

    const {data, error} = await supabase
        .from("cards_progress")
        .update({
            trainer,
        })
        .eq("short_uuid", progress_uuid);

    if (error) {
        console.error(error);
        return "";
    }

    console.log("saved progress")

    return progress_uuid;
}

export async function deleteSet(set_uuid: string) {
    if (!get(loggedIn)) {
        console.log("Not logged in")
        return "";
    }

    const {data, error} = await supabase
        .from("cards")
        .delete()
        .eq("short_uuid", set_uuid);

    if (error) {
        console.error(error);
        return "";
    }

    return set_uuid;
}

export async function deleteProgress(progress_uuid: string) {
    if (!get(loggedIn)) {
        console.log("Not logged in")
        return "";
    }

    const {data, error} = await supabase
        .from("cards_progress")
        .delete()
        .eq("short_uuid", progress_uuid);

    if (error) {
        console.error(error);
        return "";
    }

    return progress_uuid;
}

export async function updateSetPrivacy(set_uuid: string, private_set: boolean) {
    if (!get(loggedIn)) {
        console.log("Not logged in")
        return "";
    }

    const {data, error} = await supabase
        .from("cards")
        .update({
            private: private_set,
        })
        .eq("short_uuid", set_uuid);

    if (error) {
        console.error(error);
        return "";
    }

    return set_uuid;
}

export async function saveCardsForSuggestions(values: string[], definitions: string[], authors: string[]) {
    if (!get(loggedIn)) {
        console.log("Not logged in")
        return "";
    }

    if (!get(permissions_loaded)) {
        console.log("Permissions not loaded")
        return "";
    }

    if (!get(permissions).allow_card_saving) {
        console.log("Card saving not allowed")
        return "";
    }

    const currentEmail = get(currentUser)?.email;
    if (!currentEmail) {
        console.log("No email")
        return "";
    }

    if (!authors.includes(currentEmail)) {
        console.log("Not an author")
        return "";
    }

    const words: {
        value: string,
        suggestions: string[]
    }[] = [];


    for (let value_index = 0; value_index < values.length; value_index++) {
        const index = words.findIndex(word => word.value === values[value_index]);
        if (index === -1) {
            if (values[value_index] === "") continue;
            words.push({
                value: values[value_index],
                suggestions: definitions[value_index] === "" ? [] : [definitions[value_index]]
            })
        } else {
            if (definitions[value_index] === "") continue;
            words[index].suggestions.push(definitions[value_index]);
        }
    }

    for (let definition_index = 0; definition_index < definitions.length; definition_index++) {
        const index = words.findIndex(word => word.value === definitions[definition_index]);
        if (index === -1) {
            words.push({
                value: definitions[definition_index],
                suggestions: [values[definition_index]]
            })
        } else {
            words[index].suggestions.push(values[definition_index]);
        }
    }


    for (const word of words) {
        const {value, suggestions} = word;

        // Check if the value already exists
        const {data, error} = await supabase
            .from('cards_suggestions')
            .select('suggestions')
            .eq('value', value)
            .single();

        if (error && error.code !== "PGRST116") {
            console.error('Error fetching data:', error);
            continue;
        } else if (error) {
            // create new row if it doesn't exist
            await supabase
                .from('cards_suggestions')
                .insert({value, suggestions});

            continue;
        }

        if (data) {
            // If value exists, merge suggestions arrays and update
            const mergedSuggestions = [...new Set([...data.suggestions, ...suggestions])];
            await supabase
                .from('cards_suggestions')
                .update({suggestions: mergedSuggestions})
                .eq('value', value);
        } else {
            // If value does not exist, insert new row
            await supabase
                .from('cards_suggestions')
                .insert([{value, suggestions}]);
        }
    }
}

export async function getSuggestions(value: string): Promise<string[]> {
    if (!get(loggedIn)) {
        console.log("Not logged in")
        return [];
    }

    if (value.length < 2) return [];

    const {data, error} = await supabase
        .from('cards_suggestions')
        .select('suggestions')
        .ilike('value', `%${value}%`)
        .limit(5);

    if (error) {
        console.error('Error fetching data:', error);
        return [];
    }

    if (!data) {
        console.error('No data');
        return [];
    }

    const suggestions: string[] = [];

    for (const row of data) {
        suggestions.push(...row.suggestions);
    }

    return [...new Set(suggestions)].filter(suggestion => suggestion !== "");
}

export function saveTemporaryTrainersInWebStorage() {
    console.log("Saving temporary trainers")
    console.log(temporaryTrainers)
    localStorage.setItem("temporaryTrainers", JSON.stringify(temporaryTrainers));
}

export function loadTemporaryTrainersFromWebStorage() {
    const trainers = localStorage.getItem("temporaryTrainers");
    if (!trainers) return;
    const parsedTrainers = JSON.parse(trainers);
    const importedTrainers: Record<string, Trainer> = {};

    for (const key in parsedTrainers) {
        const trainer = new Trainer([]);
        trainer.import(parsedTrainers[key]);
        importedTrainers[key] = trainer;
    }

    temporaryTrainers = importedTrainers;
}