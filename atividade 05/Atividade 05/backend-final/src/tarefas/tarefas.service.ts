import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { Tarefa } from './entities/tarefa.entity';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TarefasService {
  private readonly logger = new Logger(TarefasService.name);

  constructor(
    @InjectRepository(Tarefa)
    private readonly tarefaRepo: Repository<Tarefa>,
    private readonly storage: StorageService,
    private readonly mail: MailService,
  ) {}

  findAll(): Promise<Tarefa[]> {
    return this.tarefaRepo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Tarefa> {
    const tarefa = await this.tarefaRepo.findOneBy({ id });
    if (!tarefa) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return tarefa;
  }

  async create(dto: CreateTarefaDto, emailUsuario?: string): Promise<Tarefa> {
    const tarefa = await this.tarefaRepo.save(this.tarefaRepo.create(dto));

    // Sem await: o e-mail é enviado em segundo plano e NÃO bloqueia a resposta.
    // O .catch evita que uma falha no envio vire erro não tratado.
    if (emailUsuario) {
      this.mail
        .tarefaCriada(emailUsuario, tarefa.titulo)
        .catch((e) => this.logger.error(`Falha ao enviar e-mail: ${e.message}`));
    }
    return tarefa;
  }

  async update(id: number, dto: UpdateTarefaDto): Promise<Tarefa> {
    const tarefa = await this.findOne(id);
    Object.assign(tarefa, dto);
    return this.tarefaRepo.save(tarefa);
  }

  async remove(id: number): Promise<void> {
    const tarefa = await this.findOne(id);
    await this.tarefaRepo.remove(tarefa);
  }

  async anexar(id: number, arquivo: Express.Multer.File): Promise<Tarefa> {
    const tarefa = await this.findOne(id); // 404 antes de gastar upload
    tarefa.anexoUrl = await this.storage.enviar(arquivo);
    return this.tarefaRepo.save(tarefa);
  }
}
