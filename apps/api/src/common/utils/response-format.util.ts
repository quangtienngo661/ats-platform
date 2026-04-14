import { ResponseFormat } from "@ats-platform/types";
import { ApiProperty } from "@nestjs/swagger";

export class Response<T> implements ResponseFormat<T> {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    status: number;

    @ApiProperty()
    message?: string;

    @ApiProperty({ required: false })
    data?: T;
}