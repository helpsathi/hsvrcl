import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "FINANCE"] });
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(req.url);
    const exportType = searchParams.get("export");
    const type = searchParams.get("type") || "transactions";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const statusParam = searchParams.get("status");
    const roleParam = searchParams.get("role");

    // Construct common date filter
    const dateFilter: any = {};
    if (startDateParam) dateFilter.gte = new Date(startDateParam);
    if (endDateParam) {
      const endD = new Date(endDateParam);
      endD.setHours(23, 59, 59, 999);
      dateFilter.lte = endD;
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    if (exportType === "pdf") {
      const now = new Date().toLocaleDateString("en-IN");
      let tableHeader = "";
      let tableRows = "";

      if (type === "transactions") {
        const where: any = {};
        if (hasDateFilter) where.createdAt = dateFilter;
        if (statusParam) where.type = statusParam;

        const transactions = await prisma.transaction.findMany({
          where,
          include: { wallet: { include: { user: true } } },
          orderBy: { createdAt: "desc" },
          take: 500,
        });

        tableHeader = "<th>Tx ID</th><th>User</th><th>Type</th><th>Amount</th><th>Description</th><th>Date</th>";
        tableRows = transactions.map(t => `
          <tr>
            <td>${t.id.slice(0, 8)}...</td>
            <td>${t.wallet?.user?.name || "N/A"} (${t.wallet?.user?.email || "N/A"})</td>
            <td><strong>${t.type}</strong></td>
            <td>₹${t.amount.toFixed(2)}</td>
            <td>${t.description || "-"}</td>
            <td>${new Date(t.createdAt).toLocaleDateString("en-IN")}</td>
          </tr>
        `).join("");
      } else if (type === "chats") {
        const where: any = {};
        if (hasDateFilter) where.startTime = dateFilter;
        if (statusParam) where.status = statusParam;

        const chats = await prisma.chatSession.findMany({
          where,
          include: { student: { select: { name: true } }, mentor: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 500,
        });

        tableHeader = "<th>Session ID</th><th>Student</th><th>Mentor</th><th>Status</th><th>Duration</th><th>Charge</th><th>Date</th>";
        tableRows = chats.map(c => `
          <tr>
            <td>${c.id.slice(0, 8)}...</td>
            <td>${c.student?.name || "-"}</td>
            <td>${c.mentor?.name || "-"}</td>
            <td>${c.status}</td>
            <td>${c.durationMinutes} mins</td>
            <td>₹${c.totalCharge.toFixed(2)}</td>
            <td>${new Date(c.startTime).toLocaleDateString("en-IN")}</td>
          </tr>
        `).join("");
      } else if (type === "withdrawals") {
        const where: any = {};
        if (hasDateFilter) where.createdAt = dateFilter;
        if (statusParam) where.status = statusParam;

        const withdrawals = await prisma.withdrawalRequest.findMany({
          where,
          include: { mentor: { include: { user: { select: { name: true, email: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 500,
        });

        tableHeader = "<th>Request ID</th><th>Mentor</th><th>Amount</th><th>UPI / Account</th><th>Status</th><th>Date</th>";
        tableRows = withdrawals.map(w => `
          <tr>
            <td>${w.id.slice(0, 8)}...</td>
            <td>${w.mentor?.user?.name || w.mentorId}</td>
            <td>₹${w.amount.toFixed(2)}</td>
            <td>${w.upiId || "Bank Details"}</td>
            <td>${w.status}</td>
            <td>${new Date(w.createdAt).toLocaleDateString("en-IN")}</td>
          </tr>
        `).join("");
      } else if (type === "users") {
        const where: any = {};
        if (hasDateFilter) where.createdAt = dateFilter;
        if (roleParam) where.role = roleParam;

        const users = await prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 500,
        });

        tableHeader = "<th>User ID</th><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Joined Date</th>";
        tableRows = users.map(u => `
          <tr>
            <td>${u.id.slice(0, 8)}...</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.role}</td>
            <td>${u.phone || "—"}</td>
            <td>${new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
          </tr>
        `).join("");
      } else if (type === "subscriptions") {
        const where: any = {};
        if (hasDateFilter) where.createdAt = dateFilter;
        if (statusParam === "ACTIVE") where.isActive = true;
        if (statusParam === "INACTIVE") where.isActive = false;

        const subs = await prisma.subscription.findMany({
          where,
          include: { student: { select: { name: true, email: true } }, mentor: { include: { user: { select: { name: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 500,
        });

        tableHeader = "<th>Subscription ID</th><th>Student</th><th>Mentor</th><th>Price</th><th>Active</th><th>Start Date</th><th>End Date</th>";
        tableRows = subs.map(s => `
          <tr>
            <td>${s.id.slice(0, 8)}...</td>
            <td>${s.student?.name || "—"}</td>
            <td>${s.mentor?.user?.name || "—"}</td>
            <td>₹${s.price.toFixed(2)}</td>
            <td>${s.isActive ? "YES" : "NO"}</td>
            <td>${new Date(s.startDate).toLocaleDateString("en-IN")}</td>
            <td>${new Date(s.endDate).toLocaleDateString("en-IN")}</td>
          </tr>
        `).join("");
      } else if (type === "coupons") {
        const coupons = await prisma.coupon.findMany({
          orderBy: { createdAt: "desc" },
          take: 500,
        });

        tableHeader = "<th>Coupon Code</th><th>Discount</th><th>Type</th><th>Usage Count</th><th>Max Uses</th><th>Active</th><th>Expiry</th>";
        tableRows = coupons.map(cp => `
          <tr>
            <td><strong>${cp.code}</strong></td>
            <td>${cp.discountType === "PERCENTAGE" ? `${cp.discountValue}%` : `₹${cp.discountValue}`}</td>
            <td>${cp.discountType}</td>
            <td>${cp.usedCount}</td>
            <td>${cp.totalLimit || "Unlimited"}</td>
            <td>${cp.isActive ? "ACTIVE" : "INACTIVE"}</td>
            <td>${cp.expiresAt ? new Date(cp.expiresAt).toLocaleDateString("en-IN") : "Never"}</td>
          </tr>
        `).join("");
      } else if (type === "mentor-earnings") {
        const mentors = await prisma.mentorProfile.findMany({
          where: { status: "APPROVED" },
          include: {
            user: { select: { name: true, email: true } },
          },
          take: 500,
        });

        tableHeader = "<th>Mentor</th><th>Email</th><th>Rating</th><th>Chat Rate</th><th>Call Rate</th><th>Monthly Rate</th>";
        tableRows = mentors.map(m => `
          <tr>
            <td><strong>${m.user?.name || "Mentor"}</strong></td>
            <td>${m.user?.email || "—"}</td>
            <td>⭐ ${m.avgRating.toFixed(1)}</td>
            <td>₹${m.perMinutePrice}/min</td>
            <td>₹${m.callPricePerMinute}/min</td>
            <td>₹${m.monthlyPrice}/mo</td>
          </tr>
        `).join("");
      }

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>HelpSathi ${type.toUpperCase()} Report</title>
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
          h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 13px; }
          th { background-color: #f8fafc; color: #334155; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
          .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body onload="window.print()">
        <h1>HelpSathi Platform Report &bull; ${type.toUpperCase().replace("-", " ")}</h1>
        <p class="meta">Generated on: <strong>${now}</strong> by Administrator &bull; Confidential Internal Report</p>
        <table>
          <thead>
            <tr>
              ${tableHeader}
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="7" style="text-align:center;padding:24px;color:#94a3b8;">No records found for the selected criteria.</td></tr>'}
          </tbody>
        </table>
        <div class="footer">HelpSathi Automated Admin Auditing & Reporting System &bull; All Rights Reserved.</div>
      </body>
      </html>
      `;

      return new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="${type}_report.html"`,
        },
      });
    }

    if (exportType === "csv") {
      let csvContent = "";
      const filename = `${type}_report_${Date.now()}.csv`;

      if (type === "transactions") {
        const where: any = {};
        if (hasDateFilter) where.createdAt = dateFilter;
        if (statusParam) where.type = statusParam;

        const transactions = await prisma.transaction.findMany({
          where,
          include: { wallet: { include: { user: true } } },
          orderBy: { createdAt: "desc" },
          take: 5000,
        });
        csvContent = "ID,User Name,Email,Type,Amount (INR),Description,Reference ID,Date\n";
        transactions.forEach((tx) => {
          csvContent += `"${tx.id}","${tx.wallet?.user?.name || ""}","${tx.wallet?.user?.email || ""}","${tx.type}",${tx.amount},"${tx.description || ""}","${tx.referenceId || ""}","${tx.createdAt.toISOString()}"\n`;
        });
      } else if (type === "chats") {
        const where: any = {};
        if (hasDateFilter) where.startTime = dateFilter;
        if (statusParam) where.status = statusParam;

        const chats = await prisma.chatSession.findMany({
          where,
          include: {
            student: { select: { name: true } },
            mentor: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5000,
        });
        csvContent = "Chat ID,Student,Mentor,Status,Duration (Mins),Free Trial,Total Charge (INR),Start Time,End Time\n";
        chats.forEach((c) => {
          csvContent += `"${c.id}","${c.student?.name || ""}","${c.mentor?.name || ""}","${c.status}",${c.durationMinutes},${c.isFreeTrial},${c.totalCharge},"${c.startTime.toISOString()}","${c.endTime ? c.endTime.toISOString() : ""}"\n`;
        });
      } else if (type === "withdrawals") {
        const where: any = {};
        if (hasDateFilter) where.createdAt = dateFilter;
        if (statusParam) where.status = statusParam;

        const withdrawals = await prisma.withdrawalRequest.findMany({
          where,
          include: { mentor: { include: { user: { select: { name: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 5000,
        });
        csvContent = "ID,Mentor Name,Amount (INR),UPI ID,Status,Created At\n";
        withdrawals.forEach((w) => {
          csvContent += `"${w.id}","${w.mentor?.user?.name || w.mentorId}",${w.amount},"${w.upiId || ""}","${w.status}","${w.createdAt.toISOString()}"\n`;
        });
      } else if (type === "users") {
        const where: any = {};
        if (hasDateFilter) where.createdAt = dateFilter;
        if (roleParam) where.role = roleParam;

        const users = await prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 5000,
        });
        csvContent = "ID,Name,Email,Role,Phone,Created At\n";
        users.forEach((u) => {
          csvContent += `"${u.id}","${u.name}","${u.email}","${u.role}","${u.phone || ""}","${u.createdAt.toISOString()}"\n`;
        });
      } else if (type === "subscriptions") {
        const where: any = {};
        if (hasDateFilter) where.createdAt = dateFilter;
        if (statusParam === "ACTIVE") where.isActive = true;
        if (statusParam === "INACTIVE") where.isActive = false;

        const subs = await prisma.subscription.findMany({
          where,
          include: { student: { select: { name: true } }, mentor: { include: { user: { select: { name: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 5000,
        });
        csvContent = "ID,Student,Mentor,Price (INR),Active,Start Date,End Date\n";
        subs.forEach((s) => {
          csvContent += `"${s.id}","${s.student?.name || ""}","${s.mentor?.user?.name || ""}",${s.price},${s.isActive},"${s.startDate.toISOString()}","${s.endDate.toISOString()}"\n`;
        });
      } else if (type === "coupons") {
        const coupons = await prisma.coupon.findMany({
          orderBy: { createdAt: "desc" },
          take: 5000,
        });
        csvContent = "ID,Code,Discount Type,Discount Value,Used Count,Max Uses,Active,Expiry\n";
        coupons.forEach((cp) => {
          csvContent += `"${cp.id}","${cp.code}","${cp.discountType}",${cp.discountValue},${cp.usedCount},${cp.totalLimit || "Unlimited"},${cp.isActive},"${cp.expiresAt ? cp.expiresAt.toISOString() : ""}"\n`;
        });
      } else if (type === "mentor-earnings") {
        const mentors = await prisma.mentorProfile.findMany({
          include: { user: { select: { name: true, email: true } } },
          take: 5000,
        });
        csvContent = "Mentor ID,Name,Email,Status,Avg Rating,Chat Rate (INR),Call Rate (INR),Monthly Rate (INR)\n";
        mentors.forEach((m) => {
          csvContent += `"${m.id}","${m.user?.name || ""}","${m.user?.email || ""}","${m.status}",${m.avgRating},${m.perMinutePrice},${m.callPricePerMinute},${m.monthlyPrice}\n`;
        });
      }

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Standard JSON Summary Dashboard Report using DB aggregations
    const [
      studentCount,
      mentorCount,
      pendingMentorsCount,
      activeSubscriptionsCount,
      rechargeAgg,
      chatVolumeAgg,
      pendingWithdrawalAgg,
      pendingWithdrawalsCount,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "MENTOR" } }),
      prisma.mentorProfile.count({ where: { status: "PENDING" } }),
      prisma.subscription.count({ where: { isActive: true } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "CREDIT", description: { contains: "Recharge" } },
      }),
      prisma.chatSession.aggregate({
        _sum: { totalCharge: true },
        where: { status: "COMPLETED" },
      }),
      prisma.withdrawalRequest.aggregate({
        _sum: { amount: true },
        where: { status: "PENDING" },
      }),
      prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
    ]);

    const totalWalletRecharges = rechargeAgg._sum.amount || 0;
    const totalChatVolume = chatVolumeAgg._sum.totalCharge || 0;
    const pendingWithdrawalAmount = pendingWithdrawalAgg._sum.amount || 0;

    return NextResponse.json({
      summary: {
        totalStudents: studentCount,
        totalMentors: mentorCount,
        pendingMentors: pendingMentorsCount,
        activeSubscriptions: activeSubscriptionsCount,
        totalWalletRecharges,
        totalChatVolume,
        pendingWithdrawalsCount,
        pendingWithdrawalAmount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
