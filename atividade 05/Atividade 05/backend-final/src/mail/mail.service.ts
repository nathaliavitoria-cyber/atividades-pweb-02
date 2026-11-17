import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private client?: Resend;

  // Cliente criado sob demanda; sem a chave, apenas avisa e segue em frente.
  private get resend(): Resend | null {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    if (!this.client) this.client = new Resend(key);
    return this.client;
  }

  private escapar(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async tarefaCriada(para: string, titulo: string): Promise<void> {
    const resend = this.resend;
    if (!resend) {
      this.logger.warn('RESEND_API_KEY ausente: e-mail não enviado.');
      return;
    }

    const { error } = await resend.emails.send({
      from: process.env.MAIL_FROM || 'Tarefas <onboarding@resend.dev>',
      to: para,
      subject: 'Nova tarefa criada',
      // O título vem do usuário: escapamos o HTML para evitar injeção.
      html: `<p>Sua tarefa <b>${this.escapar(titulo)}</b> foi criada.</p>`,
    });
    // O SDK do Resend não lança exceção: devolve { error }.
    if (error) throw new Error(error.message);
  }
}
