import { Injectable } from '@nestjs/common';
import { CreateRecruiterDto, UpdateRecruiterDto } from './dtos/recruiters.dto';

@Injectable()
export class RecuitersService {
	async create(createRecruiterDto: CreateRecruiterDto) {
		return { createRecruiterDto };
	}

	async findAll() {
		return [];
	}

	async findOne(id: string) {
		return { id };
	}

	async update(id: string, updateRecruiterDto: UpdateRecruiterDto) {
		return { id, updateRecruiterDto };
	}

	async remove(id: string) {
		return { id };
	}
}
