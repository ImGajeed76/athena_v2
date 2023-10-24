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

export class Trainer {
    cards: Card[] = [];
    side_to_learn: "value" | "definition" | "both" = "both";

    learned_deck: Card[] = [];
    current_deck: Card[] = [];
    unlearned_deck: Card[] = [];
    repetition_deck: Card[] = [];

    current_card_index: number = 0;
    current_deck_length: number = 5;

    learn_percentage: number = 0;
    settings: LearningSettings = {
        allow_partial_answers: false,
        case_sensitive: false
    };

    round: number = 0;
    round_side: Side = Side.Value;

    constructor(cards: Card[], settings?: LearningSettings, side_to_learn?: "value" | "definition" | "both") {
        this.cards = cards;
        this.settings = settings || this.settings;
        this.side_to_learn = side_to_learn || this.side_to_learn;

        this.unlearned_deck = this.cards.filter(card => card.value_streak < CARD_LEARNED || card.definition_streak < CARD_LEARNED);
        this.learned_deck = this.cards.filter(card => card.value_streak >= CARD_LEARNED && card.definition_streak >= CARD_LEARNED);
        this.chooseSideToLearn();
    }

    chooseSideToLearn() {
        if (this.side_to_learn === "both") {
            this.round_side = Math.random() < 0.5 ? Side.Value : Side.Definition;
        } else {
            this.round_side = this.side_to_learn === "value" ? Side.Value : Side.Definition;
        }
    }

    get randomIndex(): number {
        return Math.floor(Math.random() * this.cards.length);
    }

    randomCard(exclude?: Card[]): Card {
        let card = this.cards[this.randomIndex];
        while (exclude && exclude.includes(card)) {
            card = this.cards[this.randomIndex];
        }
        return card;
    }

    get nextCard(): NextCardReturn {
        if (this.repetition_deck.length > 0 && this.current_card_index == 0) {
            const card = this.repetition_deck[this.randomIndex];
            this.repetition_deck.splice(this.repetition_deck.indexOf(card), 1);
            return {card, side: this.round_side, error: null};
        }

        while (this.current_deck.length < this.current_deck_length) {
            if (this.unlearned_deck.length === 0) break;

            const index = this.randomIndex;
            this.current_deck.push(this.unlearned_deck[index]);
            this.unlearned_deck.splice(index, 1);
        }

        if (this.current_deck.length === 0) {
            return {
                error: {
                    message: "No cards to learn",
                    type: ErrorType.NoCards
                }
            }
        }

        const card = this.current_deck[this.current_card_index];
        this.current_card_index++;
        if (this.current_card_index >= this.current_deck.length) {
            this.current_card_index = 0;
            this.round++;
            this.chooseSideToLearn();
        }

        return {card, side: this.round_side, error: null};
    }

    updateCard(card: Card, side: Side, answer: string, solve_time: number): UpdateCardReturn {
        let correct = false;
        let right_answer = "";

        answer = answer.trim();

        if (side === Side.Value) {
            right_answer = card.value;
        }

        if (side === Side.Definition) {
            right_answer = card.definition;
        }

        if (this.settings.case_sensitive && answer === right_answer) correct = true;
        else if (!this.settings.case_sensitive && answer.toLowerCase() === right_answer.toLowerCase()) correct = true;

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

        if (correct) {
            if (side === Side.Value) {
                card.value_streak++;
                card.value_seen++;
            }

            if (side === Side.Definition) {
                card.definition_streak++;
                card.definition_seen++;
            }

            card.addSolveTime(solve_time);
            this.learn_percentage = Math.round((this.learned_deck.length / this.cards.length) * 100);
        } else {
            if (side === Side.Value) {
                if (card.value_streak == 0) {
                    this.repetition_deck.push(card);
                } else {
                    card.value_streak = 1;
                }
            }

            if (side === Side.Definition) {
                if (card.definition_streak == 0) {
                    this.repetition_deck.push(card);
                } else {
                    card.definition_streak = 1;
                }
            }
        }

        if (card.value_streak >= CARD_LEARNED && card.definition_streak >= CARD_LEARNED) {
            this.learned_deck.push(card);
            this.current_deck.splice(this.current_deck.indexOf(card), 1);
        }

        return {card, side, correct, correct_answer: right_answer, error: null};
    }
}

export function importCards(text: string, card_separator: string = ",", pair_separator: string = "\n") {
    const cards: Card[] = [];
    const pairs = text.split(pair_separator);
    for (const pair of pairs) {
        const [value, definition] = pair.split(card_separator);
        cards.push(new Card(value, definition));
    }
    return cards;
}

export function exportCards(cards: Card[], card_separator: string = ",", pair_separator: string = "\n") {
    for (const card of cards) {
        card.value = card.value.replace(card_separator, " ");
        card.definition = card.definition.replace(card_separator, " ");
    }

    return cards.map(card => `${card.value}${card_separator}${card.definition}`).join(pair_separator);
}