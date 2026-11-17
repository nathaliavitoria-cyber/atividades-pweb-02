import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { TarefasService } from './tarefas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const TAMANHO_MAX = 5 * 1024 * 1024; // 5 MB (regra de negócio)
const TETO_UPLOAD = 10 * 1024 * 1024; // 10 MB (teto do Multer)
const TIPOS_PERMITIDOS = /^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/;

// @UseGuards protege TODAS as rotas: exige um token JWT válido no cookie.
@UseGuards(JwtAuthGuard)
@Controller('tarefas')
export class TarefasController {
  constructor(private readonly tarefasService: TarefasService) {}

  @Get()
  findAll() {
    return this.tarefasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tarefasService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTarefaDto, @Req() req: Request) {
    // O e-mail do destinatário vem do token JWT (JwtStrategy.validate).
    const user = req.user as { userId: number; email: string };
    return this.tarefasService.create(dto, user?.email);
  }

  // multipart/form-data, campo "arquivo". Sem "storage" o Multer guarda o
  // arquivo em memória (arquivo.buffer), que é enviado ao bucket do Supabase.
  // O limits é só um teto de segurança (protege a memória). Entre 5 MB e 10 MB
  // quem responde é o MaxFileSizeValidator, com 400 como no roteiro.
  @Post(':id/anexo')
  @UseInterceptors(
    FileInterceptor('arquivo', { limits: { fileSize: TETO_UPLOAD } }),
  )
  anexar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: TAMANHO_MAX }),
          new FileTypeValidator({ fileType: TIPOS_PERMITIDOS }),
        ],
      }),
    )
    arquivo: Express.Multer.File,
  ) {
    return this.tarefasService.anexar(id, arquivo);
  }

  // ---- Seção 4 do roteiro: upload em DISCO (só para aprender / dev local) ----
  // diskStorage grava direto em ./uploads com nome aleatório (UUID + extensão).
  // O fileFilter recusa tipos não permitidos ANTES de gravar, para não deixar
  // lixo no disco. Os arquivos ficam disponíveis em /uploads/<nome>.
  @Post(':id/anexo-disco')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) =>
          cb(null, randomUUID() + extname(file.originalname).toLowerCase()),
      }),
      fileFilter: (req, file, cb) =>
        TIPOS_PERMITIDOS.test(file.mimetype)
          ? cb(null, true)
          : cb(
              new BadRequestException(
                'Tipo de arquivo não permitido (use png, jpg, webp, gif ou pdf).',
              ),
              false,
            ),
      limits: { fileSize: TAMANHO_MAX }, // 5 MB
    }),
  )
  anexarEmDisco(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    arquivo: Express.Multer.File,
  ) {
    return {
      nome: arquivo.filename,
      tam: arquivo.size,
      url: `/uploads/${arquivo.filename}`,
    };
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTarefaDto) {
    return this.tarefasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tarefasService.remove(id);
  }
}
