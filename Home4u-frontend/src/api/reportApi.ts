import axiosInstance from './axiosInstance';

export type ReportTargetType = 'PROPERTY' | 'REVIEW' | 'USER';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: number;
  reporter?: { id: number; username: string };
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export async function fileReport(
  reporterId: number,
  targetType: ReportTargetType,
  targetId: number,
  reason: string,
): Promise<{ reportId: number; status: ReportStatus }> {
  const res = await axiosInstance.post('/reports', { targetType, targetId, reason }, {
    params: { reporterId },
  });
  return res.data;
}

export async function listMyReports(reporterId: number): Promise<Report[]> {
  const res = await axiosInstance.get<Report[]>('/reports/mine', { params: { reporterId } });
  return res.data;
}

export async function listAdminReports(status?: ReportStatus): Promise<Report[]> {
  const res = await axiosInstance.get<Report[]>('/admin/reports', {
    params: status ? { status } : undefined,
  });
  return res.data;
}

export async function resolveReport(id: number) {
  await axiosInstance.put(`/admin/reports/${id}/resolve`);
}

export async function dismissReport(id: number) {
  await axiosInstance.put(`/admin/reports/${id}/dismiss`);
}
