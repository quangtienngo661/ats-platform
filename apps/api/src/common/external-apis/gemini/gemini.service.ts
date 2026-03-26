import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { GeminiModel } from '../../types/enums/gemini-model.enum';

@Injectable()
export class GeminiService {
    private readonly ai: GoogleGenAI;

    constructor(private configService: ConfigService) {
        this.ai = new GoogleGenAI({
            apiKey: this.configService.getOrThrow('GOOGLE_API_KEY'),
        });
    }

    async parseCV(prompt: string, content: string, model: string = GeminiModel.G_3_Flash) {
        const result = await this.generateContent(model, prompt, content);
        return result.text;
    }

    async screeningCV(model: string = GeminiModel.G_3_Flash, prompt: string, content: string) {
        // const result = await this.generateContent(model, prompt, content);
        // return result.text;
    }

    // General function
    private async generateContent(model: string, prompt: string, content: string) {
        // TODO: Implement AI Usage Log and self model management
        const response = await this.ai.models.generateContent({
            model: model,
            contents: `${prompt}\n\nPDF raw text:\n${content}`,
        });

        return {
            text: JSON.parse(response.text || '{}'),
        };
    }
}
