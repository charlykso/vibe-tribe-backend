// API Service for Team Member Invitations
import { apiClient } from '../api';
import type { ApiResponse } from '../api';

export interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'moderator' | 'member';
  organization_id: string;
  invited_by: string;
  invitation_token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  message?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  cancelled_at?: string;
  last_sent_at?: string;
  inviter_name?: string;
  organization_name?: string;
}

export interface CreateInvitationRequest {
  email: string;
  role: 'admin' | 'moderator' | 'member';
  message?: string;
}

export interface InvitationResponse {
  invitation: {
    id: string;
    email: string;
    role: string;
    status: string;
    expires_at: string;
  };
  message: string;
}

export class InvitationsService {
  // Send invitation to join organization
  static async sendInvitation(data: CreateInvitationRequest): Promise<ApiResponse<InvitationResponse>> {
    try {
      return await apiClient.post<InvitationResponse>('/invitations/invite', data);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      throw error;
    }
  }

  // Get all invitations for the organization
  static async getInvitations(): Promise<ApiResponse<{ invitations: Invitation[] }>> {
    try {
      return await apiClient.get<{ invitations: Invitation[] }>('/invitations');
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      throw error;
    }
  }

  // Cancel an invitation
  static async cancelInvitation(invitationId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      console.log('🗑️ Canceling invitation:', invitationId);
      return await apiClient.delete<{ message: string }>(`/invitations/${invitationId}`);
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      throw error;
    }
  }

  // Resend an invitation
  static async resendInvitation(invitationId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await apiClient.post<{ message: string }>(`/invitations/${invitationId}/resend`);
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      throw error;
    }
  }

  // Accept invitation (for the invited user)
  static async acceptInvitation(token: string): Promise<ApiResponse<{ message: string; user: any }>> {
    try {
      return await apiClient.post<{ message: string; user: any }>(`/invitations/accept`, { token });
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  // Get invitation details by token (for the invited user)
  static async getInvitationByToken(token: string): Promise<ApiResponse<{ invitation: Invitation }>> {
    try {
      return await apiClient.get<{ invitation: Invitation }>(`/invitations/token/${token}`);
    } catch (error) {
      console.error('Failed to fetch invitation details:', error);
      throw error;
    }
  }

  // Get team statistics
  static async getTeamStats(): Promise<ApiResponse<TeamStats>> {
    try {
      return await apiClient.get<TeamStats>('/invitations/team-stats');
    } catch (error) {
      console.error('Failed to fetch team stats:', error);
      throw error;
    }
  }
}

export interface TeamStats {
  totalMembers: number;
  pendingInvites: number;
  admins: number;
}
