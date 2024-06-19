import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParseEntity } from './parse.entity';

@Injectable()
export class ParseService {
  constructor() {}
}
