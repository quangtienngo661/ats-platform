import { IsString, IsUUID, MinLength } from 'class-validator';

export class SubmitAnswerDto {
    @IsUUID()
    qnaId: string;

    @IsString()
    @MinLength(1)
    answerText: string;
}
