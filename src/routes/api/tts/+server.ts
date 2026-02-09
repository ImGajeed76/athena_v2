import {json, type RequestHandler} from "@sveltejs/kit";
import sdk from "microsoft-cognitiveservices-speech-sdk"
import {PRIVATE_SPEECH_KEY, PRIVATE_SPEECH_REGION} from "$env/static/private";
import he from "he";
import {franc} from "franc";
import {langMap} from "$lib/cards";

const {encode} = he;

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


function generateSSML(text: string, name: string, lang: string) {
    return ssmlTemplate.replace("$$TEXT$$", text).replace("$$LANG$$", lang).replace("$$NAME$$", name);
}


const ttsCache = new Map<string, {
    array: Uint8Array,
    lastUsed: number
}>();

export const POST: RequestHandler<Record<string, never>> = async ({request}): Promise<Response> => {
    let {text, gender, lang} = await request.json();
    gender = gender.toLowerCase();
    text = encode(text);

    if (!lang) {
        const detectedLangISO6393: string = franc(text);

        console.log(`Detected language: ${detectedLangISO6393}`)

        lang = langMap[detectedLangISO6393];

        if (!lang) {
            lang = 'en-US';
        }

        console.log(`Using language: ${lang}`)
    }

    if (!(gender === "male" || gender === "female")) {
        return json({}, {status: 400})
    }

    const speakersGender: "male" | "female" = gender;
    speechConfig.speechSynthesisVoiceName = speakers[speakersGender];

    const cacheKey = `${text}-${speakersGender}-${lang}`;
    if (ttsCache.has(cacheKey)) {
        console.log(`Cache hit for ${cacheKey}`);
        const cachedResponse = ttsCache.get(cacheKey);
        if (cachedResponse) {
            ttsCache.set(cacheKey, {
                array: cachedResponse.array,
                lastUsed: Date.now()
            });
            return new Response(cachedResponse.array, {headers: {"Content-Type": "audio/wav"}});
        } else {
            console.log(`Cache hit for ${cacheKey} was empty, regenerating...`);
        }
    }

    const pullStream = sdk.AudioOutputStream.createPullStream();
    const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream);
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    try {
        console.log(`Synthesizing text: ${text}`)
        let audioData: Uint8Array[] = [];
        await new Promise<void>((resolve, reject) => {
            synthesizer.speakSsmlAsync(
                generateSSML(text, speakers[speakersGender], lang),
                result => {
                    synthesizer.close();
                    if (result) {
                        console.log(`Speech synthesis succeeded.`);
                        audioData.push(Buffer.from(result.audioData));
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

        if (ttsCache.size > 100) {
            let cacheSize = 0;
            for (const [_, value] of ttsCache) {
                cacheSize += value.array.length;
            }

            const cacheSizeMB = cacheSize / 1024 / 1024;
            if (cacheSizeMB > 1024) {
                const sortedCache = new Map([...ttsCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed));
                for (const [key, value] of sortedCache) {
                    ttsCache.delete(key);
                    cacheSize -= value.array.length;
                    if (cacheSize < 512) {
                        break;
                    }
                }
            }
        }

        ttsCache.set(cacheKey, {
            array: Buffer.concat(audioData),
            lastUsed: Date.now()
        });
        return new Response(Buffer.concat(audioData), {headers: {"Content-Type": "audio/wav"}});
    } catch (error) {
        console.error(error);
        synthesizer.close();
        return json({}, {status: 500})
    }
}