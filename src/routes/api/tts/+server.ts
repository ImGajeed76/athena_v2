import {json, type RequestHandler} from "@sveltejs/kit";
import sdk from "microsoft-cognitiveservices-speech-sdk"
import {PRIVATE_SPEECH_KEY, PRIVATE_SPEECH_REGION} from "$env/static/private";
import {shortUUID} from "$lib/helpers";
import {promises as fs} from "fs";
import {resolve as resolvePath} from "path";
import he from "he";
import {franc} from "franc";
import {langMap} from "$lib/cards";

const { encode } = he;

const speechConfig = sdk.SpeechConfig.fromSubscription(
    PRIVATE_SPEECH_KEY,
    PRIVATE_SPEECH_REGION
);

const speakers = {
    "male": "en-US-RyanMultilingualNeural",
    "female": "en-US-JennyMultilingualV2Neural"
}

const ssmlTemplate = `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
    <voice name="$$NAME$$">
        <lang xml:lang="$$LANG$$">$$TEXT$$</lang>
    </voice>
</speak>
`



function generateSSML(text: string, name: string, lang: string | null = null) {
    const sanitizedText = encode(text);
    let langToUse = lang;

    if (!lang) {
        const detectedLangISO6393: string = franc(sanitizedText);

        console.log(`Detected language: ${detectedLangISO6393}`)

        let langToUse = langMap[detectedLangISO6393];

        if (!langToUse) {
            langToUse = 'en-US';
        }

        console.log(`Using language: ${langToUse}`)
    }

    return ssmlTemplate.replace("$$TEXT$$", sanitizedText).replace("$$LANG$$", langToUse as string).replace("$$NAME$$", name);
}

export const POST: RequestHandler<Record<string, never>> = async ({request}): Promise<Response> => {
    let {text, gender, lang} = await request.json();
    gender = gender.toLowerCase();

    if (!(gender === "male" || gender === "female")) {
        return json({}, {status: 400})
    }

    const speakersGender: "male" | "female" = gender;
    speechConfig.speechSynthesisVoiceName = speakers[speakersGender];

    const tempFileName = `${shortUUID()}.wav`;

    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(tempFileName);
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    try {
        console.log(`Synthesizing text: ${text}`)

        await new Promise<void>((resolve, reject) => {
            synthesizer.speakSsmlAsync(
                generateSSML(text, speakers[speakersGender], lang),
                result => {
                    synthesizer.close();
                    if (result) {
                        console.log(`Speech synthesis succeeded.`);
                        resolve();
                    } else {
                        console.error("Speech synthesis canceled or failed.")
                        reject(new Error('Speech synthesis failed'));
                    }
                },
                error => {
                    synthesizer.close();
                    console.error(error)
                    reject(new Error(error));
                }
            );
        });

        const audioData = await fs.readFile(resolvePath(tempFileName));
        await fs.unlink(tempFileName);
        return new Response(audioData, {headers: {"Content-Type": "audio/wav"}});
    } catch (error) {
        console.error(error);
        synthesizer.close();
        return json({}, {status: 500})
    }
}