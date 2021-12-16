import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export function parseDate(target: string): string {
  return format(new Date(target), 'i LLL yyyy', {
    locale: ptBR,
  });
}