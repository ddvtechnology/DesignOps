import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getUserScheduleAlerts(userId: string) {
  // Busca todos os agendamentos do usuário
  const { data, error } = await supabase
    .from('scheduled_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return { overdue: [], upcoming: [] };
  }

  const now = new Date();
  const upcomingLimit = new Date();
  upcomingLimit.setDate(now.getDate() + 7);

  const overdue = (data || []).filter(
    (item) => item.status !== 'paid' && new Date(item.scheduled_date) < now
  );
  const upcoming = (data || []).filter(
    (item) => item.status !== 'paid' && new Date(item.scheduled_date) >= now && new Date(item.scheduled_date) <= upcomingLimit
  );

  return { overdue, upcoming };
}

export function formatDateUTC(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Ajusta para UTC (ignora fuso local)
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
