import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private client?: SupabaseClient;

  // Cliente criado sob demanda: a API sobe mesmo sem o .env do Supabase,
  // e só falha (500 com mensagem clara) quando alguém tenta fazer upload.
  private get supabase(): SupabaseClient {
    if (!this.client) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_KEY;
      if (!url || !key) {
        throw new InternalServerErrorException(
          'Supabase não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_KEY no .env',
        );
      }
      this.client = createClient(url, key);
    }
    return this.client;
  }

  private get bucket(): string {
    return process.env.SUPABASE_BUCKET || 'anexos';
  }

  async enviar(arquivo: Express.Multer.File): Promise<string> {
    // Nome seguro: UUID + extensão. Nunca confiamos no nome original
    // (evita colisão, caracteres inválidos e path traversal).
    const caminho = `tarefas/${randomUUID()}${extname(arquivo.originalname).toLowerCase()}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(caminho, arquivo.buffer, { contentType: arquivo.mimetype });
    if (error) throw new InternalServerErrorException(error.message);

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(caminho);
    return data.publicUrl;
  }
}
