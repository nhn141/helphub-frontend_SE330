"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { SupportRequestCard } from "@/components/support-request-card";
import {
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeading,
} from "@/components/support-ui";
import {
  getMySupportRequests,
  getMyVolunteerAssignments,
  getSupportRequests,
  type SupportRequestSummary,
  type VolunteerAssignment,
} from "@/lib/api";
import { SUPPORT_REQUEST_STATUS_LABELS } from "@/lib/support-request-ui";

export default function DashboardClient() {
  const { profile, getAccessToken } = useAuth();
  const [requests, setRequests] = useState<SupportRequestSummary[]>([]);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();

      if (profile.role === "REQUESTER") {
        setRequests(await getMySupportRequests(token));
      } else if (profile.role === "VOLUNTEER") {
        const [availableRequests, myAssignments] = await Promise.all([
          getSupportRequests(token),
          getMyVolunteerAssignments(token),
        ]);
        setRequests(
          availableRequests.filter(
            (request) =>
              request.status === "APPROVED" ||
              request.status === "IN_PROGRESS",
          ),
        );
        setAssignments(myAssignments);
      } else {
        setRequests(await getSupportRequests(token));
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, profile.role]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const metrics = useMemo(
    () => getMetrics(profile.role, requests, assignments),
    [assignments, profile.role, requests],
  );

  if (loading) {
    return <LoadingBlock message="Đang tổng hợp hoạt động hỗ trợ..." />;
  }

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="HelpHub portal"
        title={`Xin chào, ${profile.fullName}`}
        description={getDashboardDescription(profile.role)}
        action={
          profile.role === "REQUESTER" ? (
            <Link
              href="/support-requests/new"
              className="inline-flex h-11 items-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Đăng yêu cầu mới
            </Link>
          ) : (
            <Link
              href="/support-requests"
              className="inline-flex h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
            >
              Mở danh sách yêu cầu
            </Link>
          )
        }
      />

      {error ? (
        <Notice type="error">
          {error}{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => void loadDashboard()}
          >
            Thử lại
          </button>
        </Notice>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex size-10 items-center justify-center rounded-xl ${metric.color}`}
            >
              <MetricIcon />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
              {metric.value}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {metric.label}
            </p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {profile.role === "REQUESTER"
                ? "Yêu cầu gần đây của bạn"
                : profile.role === "VOLUNTEER"
                  ? "Yêu cầu đang cần hỗ trợ"
                  : "Yêu cầu mới nhất"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi tiến độ và xử lý bước tiếp theo.
            </p>
          </div>
          <Link
            href="/support-requests"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Xem tất cả
          </Link>
        </div>

        {requests.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {requests.slice(0, 6).map((request) => (
              <SupportRequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có hoạt động support request"
            description={
              profile.role === "REQUESTER"
                ? "Hãy đăng yêu cầu đầu tiên và mô tả rõ nhu cầu để đội ngũ HelpHub có thể hỗ trợ."
                : "Hiện chưa có yêu cầu phù hợp với vai trò của bạn."
            }
            actionHref={
              profile.role === "REQUESTER"
                ? "/support-requests/new"
                : "/support-requests"
            }
            actionLabel={
              profile.role === "REQUESTER"
                ? "Đăng yêu cầu"
                : "Mở danh sách"
            }
          />
        )}
      </section>
    </div>
  );
}

function getMetrics(
  role: string,
  requests: SupportRequestSummary[],
  assignments: VolunteerAssignment[],
) {
  if (role === "VOLUNTEER") {
    return [
      {
        label: "Có thể đăng ký",
        value: requests.length,
        color: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Chờ xác nhận",
        value: assignments.filter((item) => item.status === "PENDING").length,
        color: "bg-amber-50 text-amber-700",
      },
      {
        label: "Đang tham gia",
        value: assignments.filter((item) => item.status === "ACCEPTED").length,
        color: "bg-sky-50 text-sky-700",
      },
      {
        label: "Đã hoàn thành",
        value: assignments.filter((item) => item.status === "COMPLETED").length,
        color: "bg-violet-50 text-violet-700",
      },
    ];
  }

  const statuses = [
    "PENDING",
    "APPROVED",
    "IN_PROGRESS",
    "COMPLETED",
  ] as const;
  const colors = [
    "bg-amber-50 text-amber-700",
    "bg-sky-50 text-sky-700",
    "bg-violet-50 text-violet-700",
    "bg-emerald-50 text-emerald-700",
  ];

  return statuses.map((status, index) => ({
    label: SUPPORT_REQUEST_STATUS_LABELS[status],
    value: requests.filter((request) => request.status === status).length,
    color: colors[index],
  }));
}

function getDashboardDescription(role: string): string {
  if (role === "REQUESTER") {
    return "Quản lý yêu cầu, nhu cầu cụ thể và tình nguyện viên đăng ký hỗ trợ.";
  }

  if (role === "VOLUNTEER") {
    return "Tìm yêu cầu phù hợp, theo dõi đăng ký và cập nhật phần hỗ trợ của bạn.";
  }

  return "Duyệt yêu cầu, điều phối điểm hỗ trợ và theo dõi tiến độ thực hiện.";
}

function MetricIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 19V9M12 19V5M19 19v-7" strokeLinecap="round" />
    </svg>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Không thể tải dashboard.";
}
