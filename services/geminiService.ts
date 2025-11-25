import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
# Role
You are an experienced professional text editor specializing in converting colloquial, spoken transcripts into fluent, professional written articles.

# Task
Polish and rewrite the [Oral Text] provided by the user into standard [Written Language].

# Rules
1. **De-noise**: Remove all meaningless interjections (e.g., "um, uh, like, you know"), filler words, and repetitions.
2. **Correction**: Fix grammatical errors, adjust word order, and ensure sentence structure conforms to written standards.
3. **Faithfulness**: **Strictly maintain the core meaning and logic of the original text**. Do not arbitrarily delete key information or add content not present in the original.
4. **Style**: The writing style should be concise, objective, and smooth.

# Output
Output ONLY the polished text. Do not include any explanations, preambles, or markdown formatting blocks (like \`\`\`).
`;

export const polishTextWithGemini = async (inputText: string, model: string, apiKey: string): Promise<string> => {
  if (!inputText.trim()) {
    throw new Error("Input text cannot be empty.");
  }
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in Settings.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const response = await ai.models.generateContent({
      model: model,
      contents: inputText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    if (!response.text) {
      throw new Error("No response received from the model.");
    }

    return response.text.trim();

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to process text.");
  }
};

export const transcribeAudioWithGemini = async (audioBase64: string, mimeType: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in Settings.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          {
            text: "Transcribe the spoken audio into text. Write down exactly what is said, including prominent filler words, but do not add any commentary or timestamps."
          }
        ]
      },
    });

    if (!response.text) {
      throw new Error("No transcript received from the model.");
    }

    return response.text.trim();
  } catch (error: any) {
    console.error("Gemini Audio Transcription Error:", error);
    throw new Error(error.message || "Failed to transcribe audio.");
  }
};