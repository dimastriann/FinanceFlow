import { GoogleGenerativeAI } from '@google/generative-ai';

// Note: In a production app, the API key should be handled securely.
// We'll use expo-constants or .env for this.
const GENAI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

export interface ReceiptData {
  amount: number;
  merchant: string;
  category: string;
  date: string;
  confidence: number;
}

export const parseReceipt = async (
  imageUri: string
): Promise<ReceiptData | null> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    // Helper to convert URI to base64 (simplified for brevity)
    // In React Native, you'd use expo-file-system to read the file
    const imageData = await fetch(imageUri).then((r) => r.blob());
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(imageData);
    });

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - amount (number)
      - merchant (string)
      - category (string, one of: Food, Transport, Shopping, Utilities, Entertainment, Other)
      - date (string, YYYY-MM-DD)
      - confidence (number, 0-1)

      Return ONLY the JSON object.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data.split(',')[1],
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text) as ReceiptData;
  } catch (error) {
    console.error('AI Parsing Error:', error);
    return null;
  }
};
