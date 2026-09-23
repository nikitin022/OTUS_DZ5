import { ApiError, type ApiClient, RequestFilters } from '../ApiClient';
import { toApiError } from '../errorMessages';
import type {
  Appointment,
  BloodRequest,
  Center,
  DonationHistoryEntry,
  RequestResponse,
} from '../../types';
import { supabase } from './config';
import {
  appointmentPatchToRow,
  bloodRequestPatchToRow,
  toAppointment,
  toBloodRequest,
  toCenter,
  toDonationHistory,
  toRequestResponse,
  type AppointmentRow,
  type BloodRequestRow,
  type CenterRow,
  type DonationHistoryRow,
  type RequestResponseRow,
} from './mappers';


function requireClient() {
  if (!supabase) {
    throw new ApiError('Бэкенд не настроен: задайте VITE_SUPABASE_URL и ключ', 'CONFIG_ERROR');
  }
  return supabase;
}

/**
 * Реализация контракта ApiClient (раздел 8 ТЗ) на Supabase REST/RPC.
 * Соответствие endpoints — docs/api_reference.md; маппинг — mappers.ts.
 */
export class SupabaseApiClient implements ApiClient {
  async getCenters(): Promise<Center[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('centers')
      .select('*')
      .order('name');
    if (error) throw toApiError(error);
    return (data as CenterRow[]).map(toCenter);
  }

  async getRequests(filters: RequestFilters = {}): Promise<BloodRequest[]> {
    const client = requireClient();
    let query = client
      .from('blood_requests')
      .select('*')
      // Лента отсортирована по свежести изменения (FR-3)
      .order('updated_at', { ascending: false });
    if (filters.bloodGroup) {
      query = query.eq('blood_group', filters.bloodGroup);
    }
    if (filters.urgency) {
      query = query.eq('urgency', filters.urgency);
    }
    if (filters.page && filters.pageSize) {
      const from = (filters.page - 1) * filters.pageSize;
      query = query.range(from, from + filters.pageSize - 1);
    }
    const { data, error } = await query;
    if (error) throw toApiError(error);
    return (data as BloodRequestRow[]).map(toBloodRequest);
  }

  async createRequest(
    request: Omit<BloodRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'collectedMl'>,
  ): Promise<BloodRequest> {
    const client = requireClient();
    const { data, error } = await client
      .from('blood_requests')
      .insert({
        center_id: request.centerId,
        blood_group: request.bloodGroup,
        rh_factor: request.rhFactor,
        volume_ml: request.volumeMl,
        urgency: request.urgency,
      })
      .select('*')
      .single();
    if (error) throw toApiError(error);
    return toBloodRequest(data as BloodRequestRow);
  }

  async updateRequest(id: string, patch: Partial<BloodRequest>): Promise<BloodRequest> {
    const client = requireClient();
    const { data, error } = await client
      .from('blood_requests')
      .update(bloodRequestPatchToRow(patch))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw toApiError(error);
    return toBloodRequest(data as BloodRequestRow);
  }
  async createAppointment(appointment: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> {
    const client = requireClient();
    // Бизнес-правила (интервал 60 дней, слот) проверяет RPC — миграция 0005
    const { data, error } = await client.rpc('create_appointment', {
      p_center_id: appointment.centerId,
      p_date: appointment.date,
      p_time: appointment.time,
    });
    if (error) throw toApiError(error);
    return toAppointment(data as AppointmentRow);
  }

  async updateAppointment(id: string, patch: Partial<Appointment>): Promise<Appointment> {
    const client = requireClient();
    const { data, error } = await client
      .from('appointments')
      .update(appointmentPatchToRow(patch))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw toApiError(error);
    return toAppointment(data as AppointmentRow);
  }

  async subscribeToPush(subscription: unknown): Promise<void> {
    const client = requireClient();
    // Подписка сохраняется на сервере (миграция 0007), донор определяется в RPC по JWT
    const { error } = await client.rpc('register_push_subscription', {
      p_subscription: subscription as Record<string, unknown>,
    });
    if (error) throw toApiError(error);
  }

  async getDonationHistory(donorId: string): Promise<DonationHistoryEntry[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('donation_history')
      .select('id, donor_id, center_id, date, volume_ml, type, status, centers(name)')
      .eq('donor_id', donorId)
      .order('date', { ascending: false });
    if (error) throw toApiError(error);
    return (data as unknown as DonationHistoryRow[]).map(toDonationHistory);
  }

  async getRequestResponses(requestId: string): Promise<RequestResponse[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('request_responses')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at');
    if (error) throw toApiError(error);
    return (data as RequestResponseRow[]).map(toRequestResponse);
  }
}