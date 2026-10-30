import { Module } from '@nestjs/common';
import { VectorSearchService } from './vector-search.service';

@Module({
    providers: [VectorSearchService],
    exports: [VectorSearchService],
})
export class VectorModule {}
